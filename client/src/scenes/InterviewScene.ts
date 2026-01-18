import Phaser from 'phaser';
import { apiService } from '../APIService';
import { formatAnswer, getQuestions } from '../data/QuestionBank';
import type { Application, InterviewRound } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';
import { COLORS, FONTS, applyGlassEffect, createGridBackground, createModernStarBackground, createStyledButton } from '../UIConfig';

/**
 * 面试场景 - 自由回答版
 * 玩家通过观察面试官表情判断自己的表现
 */
export class InterviewScene extends Phaser.Scene {
    private application!: Application;
    private currentRound!: InterviewRound;
    private questionCount = 0;
    private performance = 50;
    private responseText!: Phaser.GameObjects.Text;
    private hintText!: Phaser.GameObjects.Text;
    private interviewerMood: 'happy' | 'neutral' | 'unhappy' | 'angry' = 'neutral';
    private moodEmoji!: Phaser.GameObjects.Text;
    private isPressureInterview = false;
    private totalQuestions = 6;
    private askedQuestions: string[] = [];
    private currentQuestion = '';
    private currentSampleAnswer = '';
    private interviewHistory: { role: string; content: string }[] = [];
    private answerBtn!: Phaser.GameObjects.Text;
    private isWaitingForAI = false;
    private hasValidQuestion = false;
    private usedQuestionIds: Set<string> = new Set();

    constructor() {
        super({ key: 'InterviewScene' });
    }

    // 文本截断辅助函数，防止溢出
    private truncateText(text: string, maxLen: number = 200): string {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '...';
    }

    init(data: { application: Application }): void {
        this.application = data.application;
        this.currentRound = this.application.interviewRounds.find(r => r.status === 'scheduled')!;
        this.questionCount = 0;
        this.askedQuestions = [];
        this.usedQuestionIds.clear(); // Clear used questions for a new interview round

        // 压力面判断
        this.isPressureInterview =
            this.currentRound.interviewerRole === '部门主管' ||
            this.currentRound.round >= 3;

        if (this.isPressureInterview) {
            this.performance = 40;
            this.totalQuestions = 7;
            this.interviewerMood = 'unhappy';
        } else {
            this.performance = 50;
            this.totalQuestions = 5;
            this.interviewerMood = 'neutral';
        }

        // 重置状态
        this.isWaitingForAI = false;
        this.interviewHistory = [];

        // 重置计时器对象引用（确保在 create 中重新创建）
        this.timerBar = undefined;
        this.timerText = undefined;
        this.timerEvent = undefined;
        this.resetTimerState();
    }


    // Timer Properties
    private timerEvent?: Phaser.Time.TimerEvent;
    private timerBar?: Phaser.GameObjects.Graphics;
    private timerText?: Phaser.GameObjects.Text;
    private timeLeft: number = 60;
    private maxTime: number = 60;
    private currentDialog?: HTMLDivElement;

    private resetTimerState(): void {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = undefined;
        }
        if (this.timerBar) {
            this.timerBar.clear();
        }
        if (this.timerText) {
            this.timerText.setText('');
        }
        this.timeLeft = 60;
    }

    private startQuestionTimer(): void {
        this.resetTimerState();
        this.maxTime = this.isPressureInterview ? 30 : 60; // 真实硬核模式：压力面30秒，普通60秒
        this.timeLeft = this.maxTime;

        if (!this.timerBar) {
            this.timerBar = this.add.graphics();
        }
        if (!this.timerText) {
            this.timerText = this.add.text(1700, 310, '', {
                fontSize: '20px',
                fontFamily: FONTS.mono,
                color: '#ef4444'
            }).setOrigin(0.5);
        }

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.updateTimerVisual();
                if (this.timeLeft <= 0) {
                    this.handleTimeout();
                }
            },
            loop: true
        });
        this.updateTimerVisual();
    }

    private updateTimerVisual(): void {
        if (!this.timerBar || !this.timerText) return;

        const width = 1600;
        const percent = this.timeLeft / this.maxTime;

        this.timerBar.clear();
        this.timerBar.fillStyle(0x333333, 0.5);
        this.timerBar.fillRect(900, 330, width, 4); // Background moved to 900 (center 1700)

        const color = percent > 0.5 ? 0x10b981 : (percent > 0.2 ? 0xf59e0b : 0xef4444);
        this.timerBar.fillStyle(color, 1);
        this.timerBar.fillRect(900, 330, width * percent, 4);

        this.timerText.setText(`${this.timeLeft}秒`);
        this.timerText.setColor(percent > 0.2 ? '#ffffff' : '#ef4444');
    }

    private handleTimeout(): void {
        this.resetTimerState();
        // Close dialog if open
        if (this.currentDialog) {
            this.currentDialog.remove();
            this.currentDialog = undefined;
        }
        // Submit empty answer with timeout flag
        this.processAnswer("", true);
    }

    create(): void {
        // 添加实心深色背景，防止下层场景透出
        this.add.rectangle(1280, 720, 2560, 1440, 0x0a0a0f, 1);

        // 现代粒子星空背景
        createModernStarBackground(this, 2560, 1440);

        // 网格背景
        createGridBackground(this, 2560, 1440);

        const job = jobHuntSystem.getJobPosition(this.application.jobId);
        const company = jobHuntSystem.getCompany(this.application.companyId);

        // 标题容器 - 2K
        const headerContainer = this.add.container(1280, 120);
        const titleText = this.add.text(0, -30, '🎤 面试环节', {
            fontSize: '72px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 50, `${company?.name} / ${job?.title} - 第 ${this.currentRound.round} 轮`, {
            fontSize: '24px',
            fontFamily: FONTS.mono,
            color: '#6366f1',
            letterSpacing: 4
        }).setOrigin(0.5);
        headerContainer.add([titleText, subTitleText]);

        // 面试官区域
        this.createInterviewerArea();

        // 对话区域 - 2K
        // Panel: x=1700, width=1200. Left edge = 1100, Right edge = 2300.
        // Text should start at left edge + padding.
        const dialogBg = this.add.rectangle(1700, 600, 1200, 560, COLORS.bgPanel, 0.6);
        applyGlassEffect(dialogBg);

        // 文字：锚点改为左上角(0,0)，从面板左边开始，严格限制在面板内
        // Left edge of panel = 1700 - 600 = 1100. Add 20px padding = 1120.
        // Top of panel = 600 - 280 = 320. Add 20px padding = 340.
        this.responseText = this.add.text(1120, 340, '', {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            wordWrap: { width: 1000, useAdvancedWrap: true },
            align: 'left',
            lineSpacing: 10,
            maxLines: 18  // 限制最多显示18行，防止溢出
        }).setOrigin(0, 0);

        // 参考提示区域 - 2K
        const hintBg = this.add.rectangle(1700, 960, 1600, 120, 0xffffff, 0.05);
        hintBg.setStrokeStyle(2, 0xffffff, 0.1);

        this.add.text(940, 910, '💡 面试锦囊:', { // 1700 - 800 + padding = ~940
            fontSize: '22px',
            fontFamily: FONTS.mono,
            color: '#6366f1'
        });

        this.hintText = this.add.text(1700, 970, '', {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#71717a',
            wordWrap: { width: 1520 },
            align: 'center'
        }).setOrigin(0.5);

        // 回答按钮
        this.createAnswerButton();

        // 底部
        this.createBottomBar();

        // 开始
        this.startInterview();
    }

    private createInterviewerArea(): void {
        // 面试官区域 - 2K
        const interviewerBg = this.add.rectangle(400, 760, 560, 880, COLORS.bgPanel, 0.5);
        applyGlassEffect(interviewerBg);

        // 装饰边框
        const border = this.add.graphics();
        border.lineStyle(4, this.isPressureInterview ? COLORS.danger : COLORS.primary, 0.3);
        border.strokeRoundedRect(160, 360, 480, 800, 24);

        // 表情
        this.moodEmoji = this.add.text(400, 640, this.getMoodEmoji(), {
            fontSize: '240px'
        }).setOrigin(0.5);

        // 名字标签
        const nameBg = this.add.rectangle(400, 960, 440, 80, 0x000000, 0.5);
        this.add.text(400, 960, this.currentRound.interviewerName, {
            fontSize: '40px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 1030, this.currentRound.interviewerRole, {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: '#6366f1'
        }).setOrigin(0.5);

        if (this.isPressureInterview) {
            const warningText = this.add.text(400, 1120, '⚠️ 压力值: 高', {
                fontSize: '20px',
                fontFamily: FONTS.mono,
                color: '#ef4444'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: warningText,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                loop: -1
            });
        }
    }

    private getMoodEmoji(): string {
        const moods = {
            'happy': '😊',
            'neutral': '😐',
            'unhappy': '😒',
            'angry': '😠'
        };
        return moods[this.interviewerMood];
    }

    private updateMood(): void {
        if (this.performance >= 70) {
            this.interviewerMood = 'happy';
        } else if (this.performance >= 55) {
            this.interviewerMood = 'neutral';
        } else if (this.performance >= 40) {
            this.interviewerMood = 'unhappy';
        } else {
            this.interviewerMood = 'angry';
        }

        if (this.isPressureInterview && this.interviewerMood === 'happy') {
            this.interviewerMood = 'neutral';
        }

        this.moodEmoji.setText(this.getMoodEmoji());
    }

    private createAnswerButton(): void {
        this.answerBtn = createStyledButton(this, 1700, 1200, 600, 110,
            this.hasValidQuestion ? '✍️ 输入你的回答' : '⏳ 面试官思考中...',
            () => {
                // 防止在 AI 思考时或没有有效问题时点击
                if (this.isWaitingForAI || !this.hasValidQuestion) {
                    return;
                }
                this.submitAnswer();
            }
        ) as any;
    }

    private async startInterview(): Promise<void> {
        // 显示连接状态
        this.responseText.setText("正在建立视频连接...\n(面试官正在查看你的简历)");
        this.hasValidQuestion = false;
        if (this.answerBtn) this.answerBtn.destroy();

        const job = jobHuntSystem.getJobPosition(this.application.jobId);
        const company = jobHuntSystem.getCompany(this.application.companyId);
        const resume = jobHuntSystem.getResume();

        try {
            const playerInfoForAI = {
                name: resume.name,
                age: resume.age,
                education: resume.education,
                school: resume.school,
                major: resume.major,
                experience: resume.experience,
                skills: resume.skills,
                projects: resume.projects
            };

            // 首次提问使用本地题库（节省 Token）
            const [localQ] = getQuestions(
                company.type || 'startup',
                this.currentRound.interviewerRole,
                1,
                Array.from(this.usedQuestionIds) // Pass already used question IDs
            );

            if (!localQ) {
                // Should rare if pool is sufficient, or fallback logic in getQuestions works
                throw new Error('No questions available');
            }
            this.usedQuestionIds.add(localQ.id); // Add the ID of the selected question

            const data = {
                question: localQ.question,
                sample_answer: formatAnswer(localQ.sample_answer, resume),
                display_type: localQ.display_type,
                type: localQ.type || 'behavioral'
            };

            this.currentQuestion = data.question;
            this.currentSampleAnswer = data.sample_answer;
            this.updateHint(data.display_type || '自我介绍');

            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n"${data.question}"`);
            this.interviewHistory.push({ role: 'assistant', content: data.question });

            this.hasValidQuestion = true;
            this.createAnswerButton();
            this.startQuestionTimer();

        } catch (error) {
            console.error('Failed to start interview:', error);
            // 本地兜底逻辑（极少触发）- 使用完整的示例回答
            const openings = [
                '你好，请先做一个自我介绍吧。',
                '欢迎参加面试，能先介绍一下你的经历吗？'
            ];
            const opening = openings[Math.floor(Math.random() * openings.length)];

            this.currentQuestion = opening;
            // 完整的示例回答，避免简短的"我叫面试者..."
            this.currentSampleAnswer = `面试官您好，我叫${resume.name}，毕业于${resume.school || 'XX大学'}。我有${resume.experience || 1}年的工作经验，主要技术栈是${(resume.skills || ['编程']).join('、')}。在之前的经历中，我参与了${resume.projects?.[0] || '核心业务系统'}的开发，负责了架构设计和核心模块的实现。我是一个对技术充满热情的人，喜欢钻研底层原理，同时也注重业务落地。今天很高兴有机会来贵公司面试。`;

            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n"${opening}"`);
            this.interviewHistory.push({ role: 'assistant', content: opening });

            this.hasValidQuestion = true;
            this.createAnswerButton();
            this.startQuestionTimer();
        }
    }

    private updateHint(questionType: string): void {
        const hints: { [key: string]: string } = {
            '自我介绍': '可以说: 姓名、工作经验、技术栈、项目亮点、为什么来应聘',
            '优缺点': '可以说: 真实的优点+例子、可改进的缺点+改进计划',
            '期望薪资': '可以说: 基于市场行情、个人能力、可协商范围',
            '离职原因': '可以说: 职业发展、学习机会、新挑战（避免说前公司坏话）',
            '职业规划': '可以说: 短期目标、长期方向、与公司发展的结合',
            '技术问题': '可以说: 原理解释、实际应用、遇到的问题和解决方案',
            '项目经验': '可以说: 项目背景、你的角色、技术难点、成果数据',
            '压力处理': '可以说: 具体例子、处理方式、结果和反思',
            '团队协作': '可以说: 沟通方式、冲突处理、协作成果',
            '加班看法': '可以说: 效率优先、必要时配合、work-life balance',
            '其他': '可以说: 真诚回答、结合实际经验、展示思考过程'
        };

        this.hintText.setText(hints[questionType] || hints['其他']);
    }

    private submitAnswer(): void {
        this.answerBtn.destroy();

        // 使用原生 DOM 创建全屏输入层，避免 Phaser 缩放导致的错位
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.left = '0';
        div.style.width = '100vw';
        div.style.height = '100vh';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // 降低背景遮罩浓度，让面试官可见
        div.style.display = 'flex';
        div.style.justifyContent = 'flex-end'; // 改为靠右对齐
        div.style.alignItems = 'center';
        div.style.paddingRight = '5%'; // 留出右边距
        div.style.zIndex = '10000';
        div.style.backdropFilter = 'blur(2px)'; // 降低模糊度

        // 响应式尺寸 - 适配右侧布局
        const isMobile = window.innerWidth < 1000;
        const width = isMobile ? '95%' : '55vw'; // 使用视口宽度比例，不再占据全屏宽度
        const maxWidth = '1000px';

        div.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                gap: 30px; 
                width: ${width};
                max-width: ${maxWidth};
                background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
                padding: ${isMobile ? '30px' : '50px'};
                border-radius: 24px;
                border: 2px solid rgba(99, 102, 241, 0.3);
                box-shadow: 0 30px 80px rgba(0,0,0,0.6);
                font-family: -apple-system, sans-serif;
                animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            ">
                <style>
                    @keyframes popIn {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                </style>
                
                <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
                    <div style="color: #10b981; font-size: ${isMobile ? '20px' : '24px'}; font-weight: bold; margin-bottom: 10px;">
                        面试官提问
                    </div>
                    <div style="color: #ffffff; font-size: ${isMobile ? '24px' : '32px'}; font-weight: bold; line-height: 1.4;">
                        "${this.currentQuestion}"
                    </div>
                </div>

                <div style="position: relative;">
                    <textarea id="interviewInput" 
                            placeholder="在此输入你的回答... (尽可能具体，结合简历中的项目经验)"
                            style="width: 100%; 
                                    height: ${isMobile ? '200px' : '300px'};
                                    padding: 20px; 
                                    font-size: ${isMobile ? '20px' : '24px'}; 
                                    background: rgba(0,0,0,0.3); 
                                    color: #e4e4e7; 
                                    border: 2px solid rgba(255,255,255,0.1); 
                                    border-radius: 16px;
                                    outline: none;
                                    resize: none;
                                    line-height: 1.6;
                                    font-family: inherit;
                                    box-sizing: border-box;
                                    transition: all 0.2s;"
                            onfocus="this.style.borderColor='#6366f1'; this.style.backgroundColor='rgba(99, 102, 241, 0.05)'"
                            onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.backgroundColor='rgba(0,0,0,0.3)'"></textarea>
                </div>

                <div style="display: flex; gap: 20px; justify-content: flex-end; flex-wrap: wrap;">
                    <button id="aiHintBtn"
                            style="padding: 16px 30px;
                                    font-size: ${isMobile ? '18px' : '22px'};
                                    background: rgba(139, 92, 246, 0.15);
                                    color: #a78bfa;
                                    border: 1px solid rgba(139, 92, 246, 0.3);
                                    border-radius: 12px;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    margin-right: auto;
                                    display: flex; align-items: center; gap: 8px;">
                        ✨ 帮我生成回答
                    </button>
                    
                    <button id="interviewCancel"
                            style="padding: 16px 40px;
                                    font-size: ${isMobile ? '20px' : '24px'};
                                    background: transparent;
                                    color: #a1a1aa;
                                    border: 2px solid rgba(255,255,255,0.1);
                                    border-radius: 12px;
                                    cursor: pointer;
                                    transition: all 0.2s;">
                        放弃
                    </button>
                    
                    <button id="interviewSubmit"
                            style="padding: 16px 60px;
                                    font-size: ${isMobile ? '20px' : '24px'};
                                    background: #6366f1;
                                    color: #ffffff;
                                    border: none;
                                    border-radius: 12px;
                                    cursor: pointer;
                                    font-weight: bold;
                                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                                    transition: all 0.2s;">
                        提交回答
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(div);
        this.currentDialog = div; // Store reference

        // 延迟绑定事件，确保 DOM 已渲染
        requestAnimationFrame(() => {
            // 关键修复：使用 div.querySelector 而不是 document.getElementById
            // 防止获取到上一次未完全销毁的 DOM 元素
            const textarea = div.querySelector('#interviewInput') as HTMLTextAreaElement;
            const submitBtn = div.querySelector('#interviewSubmit') as HTMLButtonElement;
            const cancelBtn = div.querySelector('#interviewCancel') as HTMLButtonElement;
            const aiHintBtn = div.querySelector('#aiHintBtn') as HTMLButtonElement;

            if (textarea) {
                textarea.focus();
                // 暂时禁用游戏键盘输入，防止快捷键冲突
                if (this.input && this.input.keyboard) {
                    this.input.keyboard.enabled = false;
                }
            }

            const cleanup = () => {
                if (this.input && this.input.keyboard) {
                    this.input.keyboard.enabled = true;
                }
                div.style.opacity = '0';
                this.currentDialog = undefined; // Clear reference
                setTimeout(() => {
                    if (document.body.contains(div)) {
                        document.body.removeChild(div);
                    }
                }, 200);
            };

            let typeInterval: any = null;

            const handleSubmit = () => {
                const input = textarea.value.trim();
                if (!input) return;

                if (typeInterval) clearInterval(typeInterval);

                // 记录历史
                this.interviewHistory.push({ role: 'player', content: input });

                cleanup();

                // 显示思考状态
                this.responseText.setText(`${this.currentRound.interviewerName}:\n\n(正在分析你的回答...)`);
                this.isWaitingForAI = true;

                this.processAnswer(input);
            };

            submitBtn.onclick = handleSubmit;

            cancelBtn.onclick = () => {
                if (typeInterval) clearInterval(typeInterval);
                cleanup();
                this.createAnswerButton(); // 恢复按钮
            };

            aiHintBtn.onclick = () => {
                if (typeInterval) clearInterval(typeInterval);

                const answer = this.currentSampleAnswer || "关于这个问题，我结合我的简历和项目经验认为...";

                let i = 0;
                textarea.value = "";
                textarea.focus();
                textarea.style.backgroundColor = "rgba(99, 102, 241, 0.15)"; // 输入中视觉反馈

                typeInterval = setInterval(() => {
                    if (i >= answer.length) {
                        clearInterval(typeInterval);
                        typeInterval = null;
                        textarea.style.backgroundColor = "rgba(0, 0, 0, 0.3)"; // 恢复
                        return;
                    }
                    textarea.value += answer[i];
                    textarea.scrollTop = textarea.scrollHeight;
                    i++;
                }, 10);
            };

            // 快捷键支持
            textarea.onkeydown = (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSubmit();
                } else if (e.key === 'Escape') {
                    cancelBtn.click();
                }
            };
        });
    }

    private processAnswer(input: string, isTimeout: boolean = false): void {
        const remainingTime = this.timeLeft; // 获取剩余时间用于评分
        this.resetTimerState();
        this.questionCount++;

        // 评估回答
        const evaluation = this.evaluateAnswer(input, isTimeout, remainingTime);
        this.performance = Math.max(0, Math.min(100, this.performance + evaluation.change));
        this.updateMood();

        if (isTimeout) {
            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n(遗憾) 很抱歉，你的思考时间太长了。\n\n(面试官记录了一个差评)`);
        } else {
            // 显示回答和反馈 - 限制显示长度
            const displayInput = this.truncateText(input, 300);
            this.responseText.setText(`你: "${displayInput}"\n\n${this.currentRound.interviewerName}正在评估你的回答...`);
        }

        this.time.delayedCall(1500, async () => {
            await this.showResponse(evaluation);
        });
    }

    private evaluateAnswer(answer: string, isTimeout: boolean, remainingTime: number): any {
        if (isTimeout) {
            return {
                quality: 'bad',
                score: 0,
                change: -15,
                keywords: []
            };
        }

        const keywords = ['经验', '项目', '学习', '团队', '技术', '解决', '责任', '沟通', '效率', '用户', '架构', '优化'];
        let matched = 0;
        keywords.forEach(k => {
            if (answer.includes(k)) matched++;
        });

        const lengthScore = Math.min(answer.length / 5, 40);
        const keywordScore = matched * 10;

        let score = lengthScore + keywordScore;

        // 速度加分：如果用时少于一半，加分
        if (remainingTime > this.maxTime * 0.5) {
            score += 10;
        }

        let quality: 'good' | 'ok' | 'bad' = 'ok';
        let change = 0;

        if (score > 60) {
            quality = 'good';
            change = 10;
        } else if (score < 20) {
            quality = 'bad';
            change = -5;
        } else {
            quality = 'ok';
            change = 5;
        }

        return { quality, score, change, keywords: [] };
    }

    private async showResponse(evaluation: { change: number; quality: 'good' | 'ok' | 'bad' }): Promise<void> {
        // 检查是否结束
        if (this.questionCount >= this.totalQuestions) {
            const responses = this.getResponses(evaluation.quality);
            const response = responses[Math.floor(Math.random() * responses.length)];

            this.responseText.setText(`${this.currentRound.interviewerName}: "${response}"`);
            this.time.delayedCall(1500, () => this.endInterview());
            return;
        }

        // 保持思考状态，等待 API 返回
        this.isWaitingForAI = true;
        this.hasValidQuestion = false;

        try {
            const job = jobHuntSystem.getJobPosition(this.application.jobId);
            const company = jobHuntSystem.getCompany(this.application.companyId);
            const resume = jobHuntSystem.getResume();

            // 构建完整的玩家信息
            const playerInfoForAI = {
                name: resume.name,
                age: resume.age,
                education: resume.education,
                school: resume.school,
                major: resume.major,
                experience: resume.experience,
                skills: resume.skills,
                projects: resume.projects
            };

            // 获取历史
            const history = this.interviewHistory.map(h => ({
                role: h.role,
                content: h.content
            }));

            // 1. 调用 API - 仅获取点评 (action='analyze')
            const aiData = await apiService.generateInterviewQuestion(
                playerInfoForAI,
                company,
                job,
                {
                    round: 1,
                    interviewerRole: this.currentRound.interviewerRole,
                    isPressure: this.isPressureInterview
                },
                history,
                'analyze'
            );

            // 2. 获取下一个本地问题
            const [localQ] = getQuestions(
                company.type || 'startup',
                this.currentRound.interviewerRole,
                1,
                Array.from(this.usedQuestionIds)
            );

            // ★ 关键修复：如果题库用尽，生成一个适当的跟进问题，而不是回退到"自我介绍"
            let questionToAsk: { question: string; sample_answer: string; display_type: string; type: string };
            if (localQ) {
                this.usedQuestionIds.add(localQ.id);
                questionToAsk = {
                    question: localQ.question,
                    sample_answer: formatAnswer(localQ.sample_answer, resume),
                    display_type: localQ.display_type,
                    type: localQ.type
                };
            } else {
                // 题库用尽，使用更智能的跟进问题（完整示例回答）
                const skill1 = resume.skills?.[0] || '编程';
                const skill2 = resume.skills?.[1] || '团队协作';
                const project1 = resume.projects?.[0] || '核心业务系统';
                const followUps = [
                    {
                        q: '你刚才说的那个点很有意思，能再具体聊聊吗？',
                        a: `好的，我来展开一下。在${project1}项目中，我们遇到了一个核心挑战是性能瓶颈。当时用户量激增导致响应变慢，我主动承担了优化任务。通过分析日志和Profile，我定位到问题是数据库查询效率低下。我引入了Redis缓存热点数据，并优化了SQL索引，最终将接口响应时间从2秒降到了200毫秒以内，用户体验明显提升。`,
                        t: '项目深挖'
                    },
                    {
                        q: '你觉得自己相比其他候选人，最大的优势是什么？',
                        a: `我认为我的核心优势有两点。第一是技术上的${skill1}能力，我有扎实的基础和丰富的实战经验。第二是${skill2}，我在之前团队中经常主动承担跨部门沟通的角色，能够有效推动项目落地。另外，我学习新技术的速度很快，在${project1}项目中，我只用了一周就掌握了新的技术栈并投入生产环境。`,
                        t: '个人优势'
                    },
                    {
                        q: '如果入职后遇到技术难题，你会怎么解决？',
                        a: `首先，我会尝试自己查阅官方文档、技术社区和相关源码来理解问题本质。如果一小时内没有头绪，我会整理清楚问题描述和已尝试的方案，然后向团队前辈请教。我认为高效的沟通能节省大量时间。在之前做${project1}时，就是通过这种方式快速解决了一个棘手的并发问题。同时我也会把解决过程记录下来，方便团队知识沉淀。`,
                        t: '问题解决'
                    },
                    {
                        q: '你对这个职位还有什么想了解的吗？',
                        a: `有几个问题想请教。第一，团队目前的技术栈和主要业务方向是什么？第二，新人入职后的成长路径和培养机制是怎样的？第三，团队的工作节奏和协作方式是怎样的，比如是否有定期的Code Review和技术分享会？这些信息能帮助我更好地评估自己与团队的匹配度。`,
                        t: '反问环节'
                    },
                    {
                        q: '如果给你一个新项目，你会如何规划前两周的工作？',
                        a: `第一周我会以"理解"为主：熟悉代码库结构、阅读核心模块代码、了解业务流程和产品文档。同时积极参加团队会议，快速融入。第二周我会申请承担一两个小型任务或Bug修复，通过实践来验证我对代码的理解。我会主动寻求Code Review反馈，确保代码风格与团队一致。两周结束时，我希望能独立负责一个功能模块的开发。`,
                        t: '工作方法'
                    }
                ];
                const pick = followUps[Math.floor(Math.random() * followUps.length)];
                questionToAsk = {
                    question: pick.q,
                    sample_answer: pick.a,
                    display_type: pick.t,
                    type: 'behavioral'
                };
                console.warn('Question pool exhausted, using follow-up question:', pick.q);
            }

            // 3. 合并数据
            const data = {
                question: questionToAsk.question,
                sample_answer: questionToAsk.sample_answer,
                display_type: questionToAsk.display_type,
                type: questionToAsk.type,
                analysis: aiData.analysis
            };

            // 恢复状态
            this.hasValidQuestion = true;
            this.isWaitingForAI = false;

            if (this.answerBtn) this.answerBtn.destroy();
            this.createAnswerButton();

            // Start timer for next question
            this.startQuestionTimer();

            // 更新当前问题和提示
            this.currentQuestion = data.question;
            this.currentSampleAnswer = data.sample_answer;
            this.updateHint(data.display_type);

            // 记录历史
            this.interviewHistory.push({ role: 'assistant', content: data.question });

            // 组合显示评价和新问题
            let introText = "";
            if (data.analysis) {
                // 限制评价长度，防止遮挡
                const shortAnalysis = this.truncateText(data.analysis, 150);
                introText = `【评价】${shortAnalysis}\n\n`;
            } else {
                const responses = this.getResponses(evaluation.quality);
                introText = `${responses[Math.floor(Math.random() * responses.length)]}\n\n`;
            }

            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n${introText}${data.question}`);

            // 恢复按钮
            this.hasValidQuestion = true;
            this.isWaitingForAI = false;

            if (this.answerBtn) this.answerBtn.destroy();
            this.createAnswerButton();

        } catch (error) {
            console.error('Failed to get question:', error);
            // 更丰富的兜底问题列表（完整示例回答）
            const fallbackQuestions = [
                { q: "能具体讲讲你刚才提到的那点吗？", a: "好的。在那个项目中，我们的核心挑战是用户量激增导致系统响应变慢。我负责性能优化，通过引入缓存和优化数据库索引，将响应时间从2秒降到了200毫秒。" },
                { q: "你最大的优势是什么？", a: "我认为我的优势是快速学习能力和解决问题的韧性。在之前的项目中，我能在一周内掌握新技术栈并投入生产。遇到难题时，我会系统地分析和尝试，直到找到解决方案。" },
                { q: "如果入职后第一个月，你打算怎么做？", a: "第一周我会专注于熟悉代码库和业务流程，多读文档和代码。第二三周开始承担小型任务，通过实践加深理解。第四周希望能独立负责一个模块，同时积极参与Code Review学习团队最佳实践。" },
                { q: "你有什么想问我的吗？", a: "有几个问题：第一，团队目前的技术栈和主要业务方向是什么？第二，新人的成长路径和培养机制是怎样的？第三，团队日常的协作方式和会议节奏是怎样的？" }
            ];
            const pick = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
            this.currentQuestion = pick.q;
            this.currentSampleAnswer = pick.a;

            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n(面试官陷入沉思...)\n\n"${this.currentQuestion}"`);

            this.hasValidQuestion = true;
            this.isWaitingForAI = false;
            if (this.answerBtn) this.answerBtn.destroy();
            this.createAnswerButton();
            this.startQuestionTimer();
        }

        // 重新创建按钮以确保交互性正常
        if (this.answerBtn) this.answerBtn.destroy();
        this.createAnswerButton();
    }

    private setAnswerBtnText(text: string): void {
        if (!this.answerBtn) return;
        try {
            if ((this.answerBtn as any).setText) {
                (this.answerBtn as any).setText(text);
            }
            // 兼容 Container 情况
            const container = this.answerBtn as any;
            if (container.list) {
                const label = container.list.find((obj: any) => obj instanceof Phaser.GameObjects.Text);
                if (label) label.setText(text);
            }
        } catch (e) {
            console.warn('Failed to set button text', e);
        }
    }

    private getResponses(quality: string): string[] {
        if (this.isPressureInterview) {
            if (quality === 'good') {
                return ['还行。', '嗯，继续。', '可以。'];
            } else if (quality === 'ok') {
                return ['就这？', '一般。', '没什么亮点。'];
            } else {
                return ['这回答不行。', '你没准备过？', '算了，下一题。'];
            }
        } else {
            if (quality === 'good') {
                return ['回答得不错！', '嗯，很好。', '这点说得很到位。'];
            } else if (quality === 'ok') {
                return ['好的，我了解了。', '嗯，继续。', '还可以。'];
            } else {
                return ['嗯...这个回答有点简单。', '需要再具体一些。', '好吧...'];
            }
        }
    }

    private getNextQuestion(): { question: string; type: string; display: string } {
        const role = this.currentRound.interviewerRole;

        const questionPool = [
            { q: '说说你最大的优点和缺点。', type: '优缺点', display: '优缺点' },
            { q: '你的期望薪资是多少？', type: '期望薪资', display: '期望薪资' },
            { q: '为什么离开上一家公司？', type: '离职原因', display: '离职原因' },
            { q: '你的职业规划是什么？', type: '职业规划', display: '职业规划' },
            { q: '如何看待加班？', type: '加班看法', display: '加班看法' },
            { q: '有什么想问我们的？', type: '其他', display: '反问环节' }
        ];

        if (role === '技术面试官') {
            questionPool.push(
                { q: '说说你对前端框架的理解。', type: '技术问题', display: '技术理解' },
                { q: '描述一个你解决过的技术难题。', type: '技术问题', display: '技术难题' },
                { q: '如何优化页面性能？', type: '技术问题', display: '性能优化' }
            );
        }

        if (role === '部门主管') {
            questionPool.push(
                { q: '说说你做过最有挑战的项目。', type: '项目经验', display: '项目经验' },
                { q: '如何处理紧急任务和压力？', type: '压力处理', display: '压力处理' },
                { q: '如何与团队成员协作？', type: '团队协作', display: '团队协作' }
            );
        }

        // 过滤已问过的
        const available = questionPool.filter(q => !this.askedQuestions.includes(q.q));

        if (available.length === 0) {
            return { question: '还有什么想补充的吗？', type: '其他', display: '补充' };
        }

        const selected = available[Math.floor(Math.random() * available.length)];
        this.askedQuestions.push(selected.q);

        return { question: selected.q, type: selected.type, display: selected.display };
    }

    private endInterview(): void {
        const passed = this.performance >= 60;

        // 最终表情
        if (passed) {
            this.interviewerMood = 'happy';
        } else {
            this.interviewerMood = this.isPressureInterview ? 'angry' : 'unhappy';
        }
        this.moodEmoji.setText(this.getMoodEmoji());

        const endText = passed ?
            (this.isPressureInterview ? '表现还可以，算你过了。' : '今天面试到这里，表现不错。') :
            (this.isPressureInterview ? '准备不够，回去再练练。' : '感谢你来面试，我们会通知你结果。');

        this.responseText.setText(`${this.currentRound.interviewerName}: "${endText}"\n\n` +
            `${passed ? '✅ 本轮面试通过' : '❌ 本轮面试未通过'}`);

        this.answerBtn.destroy();
        this.hintText.setText('');

        // 处理结果
        const nextRound = jobHuntSystem.scheduleNextRound(this.application.id, passed);

        this.time.delayedCall(2000, () => {
            const msg = passed ?
                (nextRound ? `恭喜通过！已安排第${nextRound.round}轮面试` : '🎉 所有面试通过！等待Offer!') :
                '很遗憾，面试未通过';

            const resultBtn = this.add.text(1280, 1100, msg, {
                fontSize: '40px',
                color: passed ? '#10b981' : '#ef4444',
                backgroundColor: '#1a1a1d',
                padding: { x: 80, y: 30 }
            }).setOrigin(0.5);

            const backBtn = createStyledButton(this, 1280, 1240, 400, 100, '返回', () => {
                this.scene.stop();
                this.scene.resume('JobHuntScene');
            });
        });
    }

    private createBottomBar(): void {
        this.add.text(1280, 1360, this.isPressureInterview ?
            '⚠️ 压力面试：请认真思考后回答，面试官会更严格评判' :
            '💡 提示：观察面试官表情判断回答效果，参考提示组织回答', {
            fontSize: '24px',
            color: this.isPressureInterview ? '#ef4444' : '#52525b'
        }).setOrigin(0.5);

        const quitBtn = this.add.text(2400, 1360, '放弃面试', {
            fontSize: '24px',
            color: '#ef4444'
        });
        quitBtn.setInteractive({ useHandCursor: true });
        quitBtn.on('pointerdown', () => {
            if (confirm('确定要放弃这次面试吗？')) {
                jobHuntSystem.scheduleNextRound(this.application.id, false);
                this.scene.stop();
                this.scene.resume('JobHuntScene');
            }
        });
    }
}
