import Phaser from 'phaser';
import type { Application, InterviewRound } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';

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
    private answerBtn!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'InterviewScene' });
    }

    init(data: { application: Application }): void {
        this.application = data.application;
        this.currentRound = this.application.interviewRounds.find(r => r.status === 'scheduled')!;
        this.questionCount = 0;
        this.askedQuestions = [];

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
    }

    create(): void {
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        const job = jobHuntSystem.getJobPosition(this.application.jobId);
        const company = jobHuntSystem.getCompany(this.application.companyId);

        // 顶部
        this.add.rectangle(640, 50, 1280, 100, 0x2a2a3a);
        this.add.text(50, 30, `${company?.name} - ${job?.title}`, {
            fontSize: '20px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });

        const typeLabel = this.isPressureInterview ? '【压力面试】' : '';
        this.add.text(50, 60,
            `第${this.currentRound.round}轮 ${typeLabel} | 面试官: ${this.currentRound.interviewerName} (${this.currentRound.interviewerRole})`, {
            fontSize: '14px',
            color: this.isPressureInterview ? '#ff6644' : '#888888'
        });

        // 进度
        this.add.text(1100, 45, `问题 1/${this.totalQuestions}`, {
            fontSize: '14px',
            color: '#888888'
        });

        // 面试官区域
        this.createInterviewerArea();

        // 对话区域
        this.add.rectangle(700, 280, 700, 240, 0x2a2a3a).setStrokeStyle(1, 0x444444);

        this.responseText = this.add.text(700, 280, '', {
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: 650 },
            align: 'left',
            lineSpacing: 8
        }).setOrigin(0.5);

        // 参考提示区域
        this.add.rectangle(700, 460, 700, 100, 0x252535).setStrokeStyle(1, 0x3a3a4a);
        this.add.text(360, 420, '💡 回答参考方向:', {
            fontSize: '12px',
            color: '#666666'
        });

        this.hintText = this.add.text(700, 470, '', {
            fontSize: '13px',
            color: '#888888',
            wordWrap: { width: 680 },
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // 回答按钮
        this.createAnswerButton();

        // 底部
        this.createBottomBar();

        // 开始
        this.startInterview();
    }

    private createInterviewerArea(): void {
        this.add.rectangle(180, 300, 220, 320, 0x2a2a3a).setStrokeStyle(1, 0x444444);

        // 表情
        this.moodEmoji = this.add.text(180, 240, this.getMoodEmoji(), {
            fontSize: '90px'
        }).setOrigin(0.5);

        // 名字
        this.add.text(180, 340, this.currentRound.interviewerName, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(180, 365, this.currentRound.interviewerRole, {
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);

        if (this.isPressureInterview) {
            this.add.text(180, 400, '面试官看起来很严肃...', {
                fontSize: '11px',
                color: '#ff6644'
            }).setOrigin(0.5);
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
        this.answerBtn = this.add.text(700, 560, '✍️ 输入你的回答', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 40, y: 15 }
        }).setOrigin(0.5);

        this.answerBtn.setInteractive({ useHandCursor: true });

        this.answerBtn.on('pointerover', () => {
            this.answerBtn.setStyle({ backgroundColor: '#5aa0e9' });
        });
        this.answerBtn.on('pointerout', () => {
            this.answerBtn.setStyle({ backgroundColor: '#4a90d9' });
        });
        this.answerBtn.on('pointerdown', () => {
            this.submitAnswer();
        });
    }

    private startInterview(): void {
        const openings = this.isPressureInterview ? [
            '行，开始吧。简单介绍下自己，别说废话。',
            '我时间紧，直接开始。你有什么特别的？',
            '看了你的简历，一般。来，证明一下自己。'
        ] : [
            '你好，请先简单自我介绍一下吧。',
            '欢迎来面试，先聊聊你自己？',
            '我们开始吧，介绍一下你的经历。'
        ];

        const opening = openings[Math.floor(Math.random() * openings.length)];
        this.currentQuestion = '自我介绍';

        this.responseText.setText(`${this.currentRound.interviewerName}:\n\n"${opening}"`);
        this.updateHint('自我介绍');
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
        // 禁用按钮防止重复点击
        this.answerBtn.disableInteractive();

        // 创建内嵌输入框
        const inputContainer = this.add.container(640, 360);
        inputContainer.setDepth(10000);

        // 背景遮罩 - 阻止点击穿透
        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.8);
        overlay.setOrigin(0.5);
        overlay.setInteractive();  // 关键！阻止点击穿透到后面
        inputContainer.add(overlay);

        // 输入框背景
        const inputBg = this.add.rectangle(0, 0, 800, 300, 0x1a1a2e);
        inputBg.setStrokeStyle(3, 0x4a90d9);
        inputBg.setOrigin(0.5);
        inputContainer.add(inputBg);

        // 问题标题
        const questionTitle = this.add.text(0, -100, `面试官问: "${this.currentQuestion}"`, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold',
            wordWrap: { width: 750 },
            align: 'center'
        }).setOrigin(0.5);
        inputContainer.add(questionTitle);

        // HTML输入框
        const inputHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; width: 750px;">
                <textarea id="interviewInput" 
                          placeholder="输入你的回答..."
                          style="width: 100%; 
                                 height: 120px;
                                 padding: 12px; 
                                 font-size: 14px; 
                                 background: #2a2a3a; 
                                 color: #ffffff; 
                                 border: 2px solid #4a90d9; 
                                 border-radius: 6px;
                                 outline: none;
                                 resize: none;
                                 font-family: inherit;
                                 box-sizing: border-box;"></textarea>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="interviewSubmit"
                            style="padding: 12px 40px;
                                   font-size: 15px;
                                   background: #4a90d9;
                                   color: #ffffff;
                                   border: none;
                                   border-radius: 6px;
                                   cursor: pointer;
                                   font-weight: bold;">
                        ✅ 提交回答
                    </button>
                    <button id="interviewCancel"
                            style="padding: 12px 40px;
                                   font-size: 15px;
                                   background: #666666;
                                   color: #ffffff;
                                   border: none;
                                   border-radius: 6px;
                                   cursor: pointer;">
                        ❌ 取消
                    </button>
                </div>
            </div>
        `;

        const domElement = this.add.dom(0, 20, 'div').createFromHTML(inputHTML);
        inputContainer.add(domElement);

        // 延迟绑定事件
        this.time.delayedCall(100, () => {
            const textarea = document.getElementById('interviewInput') as HTMLTextAreaElement;
            const submitBtn = document.getElementById('interviewSubmit') as HTMLButtonElement;
            const cancelBtn = document.getElementById('interviewCancel') as HTMLButtonElement;

            if (textarea) {
                textarea.focus();
            }

            const handleSubmit = () => {
                if (!textarea) return;

                const input = textarea.value.trim();
                if (input === '') {
                    return;
                }

                // 销毁输入框
                inputContainer.destroy();

                // 禁用按钮
                this.answerBtn.setStyle({ backgroundColor: '#3a3a4a', color: '#888888' });
                this.answerBtn.setText('思考中...');

                this.questionCount++;

                // 评估回答
                const evaluation = this.evaluateAnswer(input, this.currentQuestion);
                this.performance = Math.max(0, Math.min(100, this.performance + evaluation.change));
                this.updateMood();

                // 显示回答和反馈
                this.responseText.setText(`你: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"\n\n${this.currentRound.interviewerName}正在思考...`);

                this.time.delayedCall(1500, () => {
                    this.showResponse(evaluation);
                });
            };

            const handleCancel = () => {
                inputContainer.destroy();
                // 恢复按钮
                this.answerBtn.setInteractive({ useHandCursor: true });
            };

            // 提交按钮
            if (submitBtn) {
                submitBtn.addEventListener('click', handleSubmit);
                submitBtn.addEventListener('mouseenter', () => {
                    submitBtn.style.background = '#5aa0e9';
                });
                submitBtn.addEventListener('mouseleave', () => {
                    submitBtn.style.background = '#4a90d9';
                });
            }

            // 取消按钮
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
                cancelBtn.addEventListener('mouseenter', () => {
                    cancelBtn.style.background = '#888888';
                });
                cancelBtn.addEventListener('mouseleave', () => {
                    cancelBtn.style.background = '#666666';
                });
            }

            // Ctrl+Enter 快捷键提交
            if (textarea) {
                textarea.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                        handleSubmit();
                    }
                });
            }
        });
    }

    private evaluateAnswer(answer: string, questionType: string): { change: number; quality: 'good' | 'ok' | 'bad' } {
        const len = answer.length;
        let score = 0;

        // 基础分：回答长度
        if (len >= 100) score += 3;
        else if (len >= 50) score += 1;
        else if (len < 20) score -= 3;

        // 正面关键词
        const goodKeywords = [
            '经验', '项目', '解决', '优化', '学习', '团队', '成长', '提升',
            '负责', '主导', '设计', '实现', '分析', '思考', '改进', '创新',
            '沟通', '协作', '结果', '数据', '效率', '质量', '用户', '业务'
        ];
        const goodCount = goodKeywords.filter(k => answer.includes(k)).length;
        score += Math.min(goodCount * 2, 8);

        // 负面关键词
        const badKeywords = [
            '不知道', '不会', '不确定', '没做过', '算了', '随便', '无所谓',
            '差不多', '还行吧', '一般', '不太', '可能'
        ];
        const badCount = badKeywords.filter(k => answer.includes(k)).length;
        score -= badCount * 3;

        // 自大/消极词汇
        const trapKeywords = [
            '最强', '第一', '完美', '没缺点', '都会', '简单', '垃圾', '傻'
        ];
        const trapCount = trapKeywords.filter(k => answer.includes(k)).length;
        score -= trapCount * 4;

        // 压力面更严格
        if (this.isPressureInterview) {
            score = Math.floor(score * 0.7);
        }

        // 转换为分数变化
        let change: number;
        let quality: 'good' | 'ok' | 'bad';

        if (score >= 6) {
            change = this.isPressureInterview ? 8 : 12;
            quality = 'good';
        } else if (score >= 0) {
            change = this.isPressureInterview ? -2 : 2;
            quality = 'ok';
        } else {
            change = this.isPressureInterview ? -12 : -8;
            quality = 'bad';
        }

        return { change, quality };
    }

    private showResponse(evaluation: { change: number; quality: 'good' | 'ok' | 'bad' }): void {
        const responses = this.getResponses(evaluation.quality);
        const response = responses[Math.floor(Math.random() * responses.length)];

        // 检查是否结束
        if (this.questionCount >= this.totalQuestions) {
            this.responseText.setText(`${this.currentRound.interviewerName}: "${response}"`);
            this.time.delayedCall(1500, () => this.endInterview());
            return;
        }

        // 下一个问题
        const nextQ = this.getNextQuestion();
        this.currentQuestion = nextQ.display;

        this.responseText.setText(`${this.currentRound.interviewerName}:

"${response}

${nextQ.question}"`);
        this.updateHint(nextQ.type);

        // 恢复按钮
        this.answerBtn.setInteractive({ useHandCursor: true });
        this.answerBtn.setStyle({ backgroundColor: '#4a90d9', color: '#ffffff' });
        this.answerBtn.setText('✍️ 输入你的回答');
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

            const resultBtn = this.add.text(640, 550, msg, {
                fontSize: '20px',
                color: passed ? '#00ff88' : '#ff4444',
                backgroundColor: '#333333',
                padding: { x: 40, y: 15 }
            }).setOrigin(0.5);

            const backBtn = this.add.text(640, 620, '返回', {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#4a90d9',
                padding: { x: 50, y: 12 }
            }).setOrigin(0.5);
            backBtn.setInteractive({ useHandCursor: true });
            backBtn.on('pointerdown', () => {
                this.scene.stop();
                this.scene.resume('JobHuntScene');
            });
        });
    }

    private createBottomBar(): void {
        this.add.text(640, 680, this.isPressureInterview ?
            '⚠️ 压力面试：请认真思考后回答，面试官会更严格评判' :
            '💡 提示：观察面试官表情判断回答效果，参考提示组织回答', {
            fontSize: '12px',
            color: this.isPressureInterview ? '#ff6644' : '#666666'
        }).setOrigin(0.5);

        const quitBtn = this.add.text(1200, 680, '放弃面试', {
            fontSize: '12px',
            color: '#ff4444'
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
