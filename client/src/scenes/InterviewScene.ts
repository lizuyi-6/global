import Phaser from 'phaser';
import type { Application, InterviewRound } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';

/**
 * 面试场景 - AI驱动的面试体验
 */
export class InterviewScene extends Phaser.Scene {
    private application!: Application;
    private currentRound!: InterviewRound;
    private chatHistory: { role: string; content: string }[] = [];
    private questionCount = 0;
    private performance = 50;
    private responseText!: Phaser.GameObjects.Text;
    private dialogItems: Phaser.GameObjects.GameObject[] = [];
    private askedQuestions: string[] = []; // 跟踪已问过的问题，防止重复

    constructor() {
        super({ key: 'InterviewScene' });
    }

    init(data: { application: Application }): void {
        this.application = data.application;
        this.currentRound = this.application.interviewRounds.find(r => r.status === 'scheduled')!;
        this.chatHistory = [];
        this.questionCount = 0;
        this.performance = 50;
        this.askedQuestions = []; // 重置已问问题列表
    }

    create(): void {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        const job = jobHuntSystem.getJobPosition(this.application.jobId);
        const company = jobHuntSystem.getCompany(this.application.companyId);

        // 顶部信息
        const headerBg = this.add.rectangle(640, 50, 1280, 100, 0x2a2a3a);

        const companyText = this.add.text(50, 30, `${company?.name} - ${job?.title}`, {
            fontSize: '20px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });

        const roundText = this.add.text(50, 60,
            `第${this.currentRound.round}轮面试 | ${this.getInterviewTypeName(this.currentRound.type)} | 面试官: ${this.currentRound.interviewerRole} ${this.currentRound.interviewerName}`, {
            fontSize: '14px',
            color: '#888888'
        });

        // 表现评分
        const performanceText = this.add.text(1000, 40, `表现: ${this.performance}`, {
            fontSize: '16px',
            color: this.performance >= 60 ? '#00ff88' : '#ff4444'
        });
        this.dialogItems.push(performanceText);

        // 对话区域
        const chatBg = this.add.rectangle(640, 350, 1100, 450, 0x2a2a3a);
        chatBg.setStrokeStyle(1, 0x444444);

        // 面试官头像区域
        const interviewerBg = this.add.rectangle(150, 200, 180, 180, 0x3a3a4a);
        const interviewerLabel = this.add.text(150, 300, this.currentRound.interviewerName, {
            fontSize: '14px',
            color: '#ffffff'
        });
        interviewerLabel.setOrigin(0.5, 0.5);

        // 面试官发言
        this.responseText = this.add.text(640, 280, '', {
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: 800 },
            align: 'center',
            lineSpacing: 8
        });
        this.responseText.setOrigin(0.5, 0.5);

        // 开始面试
        this.startInterview();

        // 回答选项区域
        this.createAnswerOptions();

        // 底部操作
        this.createBottomBar();
    }

    private getInterviewTypeName(type: string): string {
        const names: { [key: string]: string } = {
            'phone': '电话面试',
            'video': '视频面试',
            'onsite': '现场面试',
            'group': '群面',
            'hr': 'HR面试'
        };
        return names[type] || '面试';
    }

    private async startInterview(): Promise<void> {
        this.responseText.setText('面试官正在查看你的简历...');

        const job = jobHuntSystem.getJobPosition(this.application.jobId);
        const company = jobHuntSystem.getCompany(this.application.companyId);

        // 获取AI面试官的开场白
        try {
            const prompt = this.currentRound.round === 1 ?
                `你好，我是${this.currentRound.interviewerName}，${this.currentRound.interviewerRole}。先简单自我介绍一下吧。` :
                `我们进入第${this.currentRound.round}轮面试。上一轮你的表现还不错。这一轮我们会更深入地聊一聊。`;

            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n"${prompt}"`);
            this.chatHistory.push({ role: 'interviewer', content: prompt });

        } catch (error) {
            this.responseText.setText(`${this.currentRound.interviewerName}:\n\n"你好，先简单自我介绍一下吧。"`);
        }
    }

    private createAnswerOptions(): void {
        const optionY = 520;
        const options = this.getAnswerOptions();

        options.forEach((option, index) => {
            const x = 250 + index * 260;

            const btn = this.add.text(x, optionY, option.text, {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#3a3a4a',
                padding: { x: 15, y: 10 },
                wordWrap: { width: 220 }
            });
            btn.setOrigin(0.5, 0.5);
            btn.setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#4a4a5a' }));
            btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#3a3a4a' }));
            btn.on('pointerdown', () => this.selectAnswer(option));

            this.dialogItems.push(btn);
        });

        // 自由回答
        const customBtn = this.add.text(1000, optionY, '💬 自由回答', {
            fontSize: '14px',
            color: '#4a90d9',
            backgroundColor: '#2a2a3a',
            padding: { x: 15, y: 10 }
        });
        customBtn.setOrigin(0.5, 0.5);
        customBtn.setInteractive({ useHandCursor: true });
        customBtn.on('pointerdown', () => this.customAnswer());
        this.dialogItems.push(customBtn);
    }

    private getAnswerOptions(): Array<{ text: string; quality: 'good' | 'neutral' | 'bad' }> {
        const round = this.currentRound.round;
        const type = this.currentRound.interviewerRole;

        if (type === 'HR') {
            return [
                { text: '专业自信地介绍自己的经历和优势', quality: 'good' },
                { text: '简单介绍基本情况', quality: 'neutral' },
                { text: '紧张地说"我...我叫..."', quality: 'bad' }
            ];
        } else if (type === '技术面试官') {
            return [
                { text: '清晰地解释技术原理并举例', quality: 'good' },
                { text: '给出基本正确的回答', quality: 'neutral' },
                { text: '支支吾吾地说"这个...我不太确定"', quality: 'bad' }
            ];
        } else if (type === '部门主管') {
            return [
                { text: '展示项目经验和解决问题的能力', quality: 'good' },
                { text: '按照要求回答问题', quality: 'neutral' },
                { text: '回答得过于简短', quality: 'bad' }
            ];
        } else {
            return [
                { text: '表现出强烈的入职意愿和职业规划', quality: 'good' },
                { text: '诚实地表达想法', quality: 'neutral' },
                { text: '显得犹豫不决', quality: 'bad' }
            ];
        }
    }

    private async selectAnswer(option: { text: string; quality: 'good' | 'neutral' | 'bad' }): Promise<void> {
        this.questionCount++;

        // 更新表现
        const performanceChange = option.quality === 'good' ? 15 : option.quality === 'neutral' ? 5 : -10;
        this.performance = Math.max(0, Math.min(100, this.performance + performanceChange));

        // 更新表现显示
        const perfText = this.dialogItems[0] as Phaser.GameObjects.Text;
        perfText.setText(`表现: ${this.performance}`);
        perfText.setColor(this.performance >= 60 ? '#00ff88' : '#ff4444');

        // 显示你的回答
        this.responseText.setText(`你: "${option.text}"\n\n${this.currentRound.interviewerName}正在思考...`);

        // 延迟后显示面试官的回应
        this.time.delayedCall(1500, () => {
            this.showInterviewerResponse(option);
        });
    }

    private showInterviewerResponse(option: { text: string; quality: 'good' | 'neutral' | 'bad' }): void {
        const responses = {
            'good': [
                '嗯，回答得很好。那我们继续下一个问题...',
                '不错，看来你在这方面很有经验。',
                '很好，这正是我们想要的答案。'
            ],
            'neutral': [
                '嗯，可以。我再问一个问题...',
                '好的，我理解了。那么...',
                '还行，继续说说...'
            ],
            'bad': [
                '嗯...这个回答有点简单了。算了，下一个问题...',
                '好吧...我们换个问题。',
                '我需要更具体的回答...'
            ]
        };

        const responseList = responses[option.quality];
        const response = responseList[Math.floor(Math.random() * responseList.length)];

        // 检查是否结束面试
        if (this.questionCount >= 5) {
            this.endInterview();
            return;
        }

        // 生成下一个问题
        const nextQuestion = this.generateNextQuestion();
        this.responseText.setText(`${this.currentRound.interviewerName}:

"${response}

${nextQuestion}"`);

        // 更新选项
        this.refreshAnswerOptions();
    }

    private generateNextQuestion(): string {
        const questions = {
            'HR': [
                '你为什么想加入我们公司？',
                '说说你最大的优点和缺点。',
                '你的期望薪资是多少？',
                '你有什么问题想问我吗？',
                '如果遇到与同事意见不一致，你会怎么处理？',
                '你对加班怎么看？',
                '你的职业规划是什么？',
                '说说你的离职原因。',
                '你对我们公司有什么了解？'
            ],
            '技术面试官': [
                '说说你对React/Vue的理解。',
                '如何优化页面加载性能？',
                '描述一下你遇到过最难的技术问题。',
                '说说你对设计模式的理解。',
                'HTTP和HTTPS有什么区别？',
                '说说你对前端工程化的理解。',
                '如何处理跨域问题？',
                '说说你对TypeScript的理解。',
                '如何进行代码审查？'
            ],
            '部门主管': [
                '说说你做过最有挑战的项目。',
                '如何平衡工作质量和进度？',
                '你对加班怎么看？',
                '你的职业规划是什么？',
                '为什么离开上一家公司？',
                '你如何带新人？',
                '如何处理紧急任务？',
                '说说你的管理风格。'
            ],
            'VP': [
                '你认为你能为团队带来什么？',
                '如何看待我们这个行业？',
                '有什么问题想问我吗？',
                '你对公司文化有什么期待？',
                '说说你的长期职业目标。'
            ]
        };

        const roleQuestions = questions[this.currentRound.interviewerRole as keyof typeof questions] || questions['HR'];

        // 过滤掉已经问过的问题
        const availableQuestions = roleQuestions.filter(q => !this.askedQuestions.includes(q));

        // 如果所有问题都问过了，重置列表（不应该发生，但做个保险）
        if (availableQuestions.length === 0) {
            this.askedQuestions = [];
            return roleQuestions[0];
        }

        // 随机选择一个未问过的问题
        const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        this.askedQuestions.push(selectedQuestion);

        return selectedQuestion;
    }

    private refreshAnswerOptions(): void {
        // 移除旧选项（保留第一个表现文本）
        while (this.dialogItems.length > 1) {
            const item = this.dialogItems.pop();
            item?.destroy();
        }
        this.createAnswerOptions();
    }

    private async customAnswer(): Promise<void> {
        const input = prompt('输入你的回答:');
        if (!input) return;

        this.questionCount++;

        // AI评估回答质量
        const quality = this.evaluateAnswer(input);
        const performanceChange = quality === 'good' ? 15 : quality === 'neutral' ? 5 : -10;
        this.performance = Math.max(0, Math.min(100, this.performance + performanceChange));

        // 更新表现显示
        const perfText = this.dialogItems[0] as Phaser.GameObjects.Text;
        perfText.setText(`表现: ${this.performance}`);
        perfText.setColor(this.performance >= 60 ? '#00ff88' : '#ff4444');

        this.responseText.setText(`你: "${input}"\n\n${this.currentRound.interviewerName}正在思考...`);

        this.time.delayedCall(1500, () => {
            this.showInterviewerResponse({ text: input, quality });
        });
    }

    private evaluateAnswer(answer: string): 'good' | 'neutral' | 'bad' {
        // 简单的关键词评估
        const goodKeywords = ['经验', '项目', '解决', '学习', '团队', '成长', '优化', '创新'];
        const badKeywords = ['不知道', '没有', '不会', '不确定', '算了'];

        const lowerAnswer = answer.toLowerCase();
        const goodCount = goodKeywords.filter(k => answer.includes(k)).length;
        const badCount = badKeywords.filter(k => lowerAnswer.includes(k)).length;

        if (goodCount >= 2 && answer.length > 20) return 'good';
        if (badCount > 0 || answer.length < 10) return 'bad';
        return 'neutral';
    }

    private endInterview(): void {
        const passed = this.performance >= 60;

        // 清除选项
        while (this.dialogItems.length > 1) {
            const item = this.dialogItems.pop();
            item?.destroy();
        }

        // 显示面试结果
        const resultText = passed ?
            `面试结束。你的表现不错，我们会尽快通知你下一轮的安排。` :
            `面试结束。谢谢你来面试，我们会综合考虑后通知你结果。`;

        this.responseText.setText(`${this.currentRound.interviewerName}:

"${resultText}"


面试得分: ${this.performance}/100
${passed ? '✅ 面试通过!' : '❌ 面试未通过'}`);

        // 处理面试结果
        const nextRound = jobHuntSystem.scheduleNextRound(this.application.id, passed);

        // 显示结果按钮
        const message = passed ?
            (nextRound ? `恭喜通过！已安排第${nextRound.round}轮面试` : '🎉 所有面试通过！等待Offer!') :
            '很遗憾，面试未通过';

        const resultBtn = this.add.text(640, 620, message, {
            fontSize: '16px',
            color: passed ? '#00ff88' : '#ff4444',
            backgroundColor: '#333333',
            padding: { x: 30, y: 15 }
        });
        resultBtn.setOrigin(0.5, 0.5);

        // 返回按钮
        const backBtn = this.add.text(640, 680, '返回', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 30, y: 10 }
        });
        backBtn.setOrigin(0.5, 0.5);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('JobHuntScene');
        });
    }

    private createBottomBar(): void {
        // 提示
        const tipText = this.add.text(640, 690, '💡 不同的回答会影响面试表现，获得60分以上即可通过', {
            fontSize: '12px',
            color: '#666666'
        });
        tipText.setOrigin(0.5, 0.5);

        // 放弃按钮
        const quitBtn = this.add.text(1200, 690, '放弃面试', {
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
