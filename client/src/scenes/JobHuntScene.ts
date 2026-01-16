import Phaser from 'phaser';
import type { Application, Company, JobPosition } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';
import { notificationManager } from '../NotificationManager';

/**
 * 求职主界面场景
 */
export class JobHuntScene extends Phaser.Scene {
    private statusPanel!: Phaser.GameObjects.Container;
    private navPanel!: Phaser.GameObjects.Container;
    private mainContent!: Phaser.GameObjects.Container;
    private navButtons: Phaser.GameObjects.Text[] = [];
    private currentTab: 'jobs' | 'applications' | 'interviews' | 'offers' = 'jobs';

    constructor() {
        super({ key: 'JobHuntScene' });
    }

    create(): void {
        // 绑定通知系统到当前场景
        notificationManager.bindScene(this);

        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // 创建顶部状态栏
        this.createStatusBar();

        // 创建左侧导航
        this.createNavigation();

        // 创建主内容区域
        this.mainContent = this.add.container(700, 360);
        this.mainContent.setDepth(10); // 设置基础层级，确保弹窗能覆盖

        // 默认显示职位列表
        this.showJobList();

        // 监听事件
        this.setupEventListeners();

        // 底部操作栏
        this.createBottomBar();
    }

    private createStatusBar(): void {
        // 清理旧的状态栏
        if (this.statusPanel) {
            this.statusPanel.destroy();
        }
        this.statusPanel = this.add.container(0, 0);
        this.statusPanel.setDepth(5);

        const status = jobHuntSystem.getStatus();

        // 状态栏背景
        const statusBg = this.add.rectangle(640, 40, 1280, 80, 0x2a2a3a);
        this.statusPanel.add(statusBg);

        // 存款
        const savingsText = this.add.text(50, 25, `💰 存款: ¥${status.savings.toLocaleString()}`, {
            fontSize: '16px',
            color: status.savings < 5000 ? '#ff4444' : '#00ff88'
        });
        this.statusPanel.add(savingsText);

        // 每日开销
        const expenseText = this.add.text(50, 50, `📉 日开销: ¥${status.dailyExpense}`, {
            fontSize: '12px',
            color: '#888888'
        });
        this.statusPanel.add(expenseText);

        // 焦虑值
        const anxietyColor = status.anxiety > 70 ? '#ff4444' : status.anxiety > 40 ? '#ffaa00' : '#00ff88';
        const anxietyText = this.add.text(280, 25, `😰 焦虑: ${status.anxiety}%`, {
            fontSize: '16px',
            color: anxietyColor
        });
        this.statusPanel.add(anxietyText);

        // 焦虑条
        const anxietyBarBg = this.add.rectangle(280, 55, 100, 8, 0x333333);
        anxietyBarBg.setOrigin(0, 0.5);
        this.statusPanel.add(anxietyBarBg);
        const anxietyBar = this.add.rectangle(280, 55, status.anxiety, 8,
            status.anxiety > 70 ? 0xff4444 : status.anxiety > 40 ? 0xffaa00 : 0x00ff88);
        anxietyBar.setOrigin(0, 0.5);
        this.statusPanel.add(anxietyBar);

        // 信心值
        const confidenceText = this.add.text(450, 25, `💪 信心: ${status.confidence}%`, {
            fontSize: '16px',
            color: status.confidence > 50 ? '#00ff88' : '#ff4444'
        });
        this.statusPanel.add(confidenceText);

        // 求职天数
        const daysText = this.add.text(620, 25, `📅 第${status.currentDay}天`, {
            fontSize: '16px',
            color: '#ffffff'
        });
        this.statusPanel.add(daysText);

        // 失业天数
        const unemployedText = this.add.text(620, 50, `已失业 ${status.unemployedDays} 天`, {
            fontSize: '12px',
            color: status.unemployedDays > 30 ? '#ff4444' : '#888888'
        });
        this.statusPanel.add(unemployedText);

        // 统计数据
        const statsText = this.add.text(800, 25,
            `📨 投递:${status.totalApplications} | 🎤 面试:${status.totalInterviews} | ✅ Offer:${status.totalOffers} | ❌ 拒绝:${status.totalRejections}`, {
            fontSize: '14px',
            color: '#aaaaaa'
        });
        this.statusPanel.add(statsText);

        // 下一天按钮
        const nextDayBtn = this.add.text(1180, 40, '⏭️ 下一天', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 15, y: 8 }
        });
        nextDayBtn.setOrigin(0.5, 0.5);
        nextDayBtn.setInteractive({ useHandCursor: true });
        nextDayBtn.on('pointerdown', () => this.advanceDay());
        this.statusPanel.add(nextDayBtn);
    }

    private createNavigation(): void {
        // 清理旧的导航栏
        if (this.navPanel) {
            this.navPanel.destroy();
        }
        this.navPanel = this.add.container(0, 0);
        this.navPanel.setDepth(5);
        this.navButtons = [];

        const navItems = [
            { key: 'jobs', label: '🔍 找工作', y: 150 },
            { key: 'applications', label: '📨 我的投递', y: 210 },
            { key: 'interviews', label: '🎤 面试安排', y: 270 },
            { key: 'offers', label: '📋 Offer', y: 330 },
        ];

        // 导航背景
        const navBg = this.add.rectangle(100, 400, 180, 500, 0x2a2a3a);
        this.navPanel.add(navBg);

        navItems.forEach(item => {
            const isActive = this.currentTab === item.key;
            const btn = this.add.text(100, item.y, item.label, {
                fontSize: '16px',
                color: isActive ? '#4a90d9' : '#ffffff',
                backgroundColor: isActive ? '#3a3a4a' : '#2a2a3a',
                padding: { x: 15, y: 10 }
            });
            btn.setOrigin(0.5, 0.5);
            btn.setInteractive({ useHandCursor: true });

            // 鼠标悬停效果
            btn.on('pointerover', () => {
                if (this.currentTab !== item.key) {
                    btn.setStyle({ backgroundColor: '#4a4a5a' });
                    this.tweens.add({
                        targets: btn,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 100
                    });
                }
            });

            btn.on('pointerout', () => {
                if (this.currentTab !== item.key) {
                    btn.setStyle({ backgroundColor: '#2a2a3a' });
                    this.tweens.add({
                        targets: btn,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 100
                    });
                }
            });

            btn.on('pointerdown', () => {
                // 点击动画反馈
                this.tweens.add({
                    targets: btn,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    yoyo: true,
                    onComplete: () => {
                        if (this.currentTab !== item.key) {
                            this.currentTab = item.key as typeof this.currentTab;
                            this.updateNavStyles();
                            this.refreshContent();
                            // 显示切换通知
                            notificationManager.info('切换标签', `已切换到${item.label.split(' ')[1]}`, 2000);
                        }
                    }
                });
            });

            this.navButtons.push(btn);
            this.navPanel.add(btn);
        });

        // 简历编辑
        const resumeBtn = this.add.text(100, 450, '📝 我的简历', {
            fontSize: '14px',
            color: '#888888',
            backgroundColor: '#2a2a3a',
            padding: { x: 10, y: 8 }
        });
        resumeBtn.setOrigin(0.5, 0.5);
        resumeBtn.setInteractive({ useHandCursor: true });
        resumeBtn.on('pointerover', () => resumeBtn.setStyle({ color: '#ffffff' }));
        resumeBtn.on('pointerout', () => resumeBtn.setStyle({ color: '#888888' }));
        resumeBtn.on('pointerdown', () => this.showResumeEditor());
        this.navPanel.add(resumeBtn);

        // 理财入口
        const financeBtn = this.add.text(100, 500, '📈 理财', {
            fontSize: '14px',
            color: '#888888',
            backgroundColor: '#2a2a3a',
            padding: { x: 10, y: 8 }
        });
        financeBtn.setOrigin(0.5, 0.5);
        financeBtn.setInteractive({ useHandCursor: true });
        financeBtn.on('pointerover', () => financeBtn.setStyle({ color: '#ffffff' }));
        financeBtn.on('pointerout', () => financeBtn.setStyle({ color: '#888888' }));
        financeBtn.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('StockScene');
        });
        this.navPanel.add(financeBtn);

        // 新场景测试入口
        const testOfficeBtn = this.add.text(100, 550, '🏢 职场(新)', {
            fontSize: '14px',
            color: '#ffaa00',
            backgroundColor: '#2a2a3a',
            padding: { x: 10, y: 8 }
        });
        testOfficeBtn.setOrigin(0.5, 0.5);
        testOfficeBtn.setInteractive({ useHandCursor: true });
        testOfficeBtn.on('pointerover', () => testOfficeBtn.setStyle({ color: '#ffffff' }));
        testOfficeBtn.on('pointerout', () => testOfficeBtn.setStyle({ color: '#ffaa00' }));
        testOfficeBtn.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('ImprovedOfficeScene');
        });
        this.navPanel.add(testOfficeBtn);
    }

    private updateNavStyles(): void {
        const keys = ['jobs', 'applications', 'interviews', 'offers'];
        this.navButtons.forEach((btn, index) => {
            const isActive = this.currentTab === keys[index];
            btn.setStyle({
                color: isActive ? '#4a90d9' : '#ffffff',
                backgroundColor: isActive ? '#3a3a4a' : '#2a2a3a'
            });
            btn.setScale(1);
        });
    }

    private createBottomBar(): void {
        // 底部提示
        const tips = [
            '💡 投简历后要耐心等待，通常需要3-7天才有回复',
            '💡 大公司面试难度高，但薪资也高',
            '💡 存款耗尽就会游戏结束，注意控制开支',
            '💡 被拒绝很正常，保持信心继续投递'
        ];
        const tipText = this.add.text(640, 690, tips[Math.floor(Math.random() * tips.length)], {
            fontSize: '12px',
            color: '#666666'
        });
        tipText.setOrigin(0.5, 0.5);
    }

    private refreshContent(): void {
        this.mainContent.removeAll(true);

        switch (this.currentTab) {
            case 'jobs':
                this.showJobList();
                break;
            case 'applications':
                this.showApplications();
                break;
            case 'interviews':
                this.showInterviews();
                break;
            case 'offers':
                this.showOffers();
                break;
        }
    }

    private showJobList(): void {
        const jobs = jobHuntSystem.getJobPositions();
        const companies = jobHuntSystem.getCompanies();

        // 标题
        const title = this.add.text(0, -280, '热门职位', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        // 职位列表
        jobs.slice(0, 6).forEach((job, index) => {
            const company = companies.find(c => c.id === job.companyId);
            if (!company) return;

            const y = -200 + index * 95; // 增加卡片间距

            // 职位卡片
            const card = this.add.rectangle(0, y, 800, 85, 0x2a2a3a); // 增加卡片高度
            card.setInteractive({ useHandCursor: true });
            this.mainContent.add(card);

            // 公司名
            const companyName = this.add.text(-380, y - 25, company.name, {
                fontSize: '14px',
                color: '#4a90d9'
            });
            this.mainContent.add(companyName);

            // 职位名
            const jobTitle = this.add.text(-380, y, job.title, {
                fontSize: '16px',
                color: '#ffffff'
            });
            this.mainContent.add(jobTitle);

            // 薪资
            const salary = this.add.text(-380, y + 25,
                `¥${(job.salaryRange[0] / 1000).toFixed(0)}K-${(job.salaryRange[1] / 1000).toFixed(0)}K`, {
                fontSize: '14px',
                color: '#00ff88'
            });
            this.mainContent.add(salary);

            // 要求
            const reqs = this.add.text(-150, y, `${job.experience} | ${job.education}`, {
                fontSize: '12px',
                color: '#888888'
            });
            this.mainContent.add(reqs);

            // 公司标签
            const typeColors: { [key: string]: number } = {
                'large': 0x4a90d9,
                'foreign': 0x00aa88,
                'startup': 0xff6600,
                'mid': 0x888888,
                'state': 0xaa0000
            };
            const typeLabels: { [key: string]: string } = {
                'large': '大厂',
                'foreign': '外企',
                'startup': '创业',
                'mid': '中型',
                'state': '国企'
            };
            const tag = this.add.text(200, y - 15, typeLabels[company.type], {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: `#${typeColors[company.type].toString(16)}`,
                padding: { x: 8, y: 4 }
            });
            this.mainContent.add(tag);

            // 紧急程度
            if (job.urgency !== 'normal') {
                const urgentTag = this.add.text(260, y - 15, job.urgency === 'asap' ? '急招' : '紧急', {
                    fontSize: '12px',
                    color: '#ffffff',
                    backgroundColor: '#ff4444',
                    padding: { x: 8, y: 4 }
                });
                this.mainContent.add(urgentTag);
            }

            // 投递按钮 - 检查是否已投递
            const applications = jobHuntSystem.getApplications();
            const hasApplied = applications.some(app => app.jobId === job.id);

            const applyBtn = this.add.text(350, y, hasApplied ? '✅ 已投递' : '投递简历', {
                fontSize: '14px',
                color: hasApplied ? '#888888' : '#ffffff',
                backgroundColor: hasApplied ? '#3a3a3a' : '#4a90d9',
                padding: { x: 15, y: 8 }
            });

            if (!hasApplied) {
                applyBtn.setInteractive({ useHandCursor: true });

                // 悬停效果
                applyBtn.on('pointerover', () => {
                    applyBtn.setStyle({ backgroundColor: '#5aa0e9' });
                    this.tweens.add({
                        targets: applyBtn,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 100
                    });
                });
                applyBtn.on('pointerout', () => {
                    applyBtn.setStyle({ backgroundColor: '#4a90d9' });
                    this.tweens.add({
                        targets: applyBtn,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 100
                    });
                });

                // 点击动画反馈
                applyBtn.on('pointerdown', () => {
                    // 按下效果 - 文字变为“投递中...”
                    applyBtn.setText('投递中...');
                    applyBtn.setStyle({ backgroundColor: '#3a80c9', color: '#aaaaaa' });
                    applyBtn.disableInteractive();

                    this.tweens.add({
                        targets: applyBtn,
                        scaleX: 0.95,
                        scaleY: 0.95,
                        duration: 100,
                        onComplete: () => {
                            this.time.delayedCall(300, () => {
                                this.applyJob(job);
                            });
                        }
                    });
                });
            }
            this.mainContent.add(applyBtn);

            // 点击查看详情
            card.on('pointerdown', () => this.showJobDetail(job, company));
        });
    }

    private showApplications(): void {
        const applications = jobHuntSystem.getApplications();

        // 标题
        const title = this.add.text(0, -280, `我的投递 (${applications.length})`, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (applications.length === 0) {
            const emptyText = this.add.text(0, 0, '还没有投递记录\n去找工作页面投递简历吧！', {
                fontSize: '16px',
                color: '#888888',
                align: 'center'
            });
            emptyText.setOrigin(0.5, 0.5);
            this.mainContent.add(emptyText);
            return;
        }

        applications.slice(0, 6).forEach((app, index) => {
            const job = jobHuntSystem.getJobPosition(app.jobId);
            const company = jobHuntSystem.getCompany(app.companyId);
            if (!job || !company) return;

            const y = -200 + index * 80;

            // 卡片
            const card = this.add.rectangle(0, y, 800, 70, 0x2a2a3a);
            this.mainContent.add(card);

            // 公司和职位
            const info = this.add.text(-380, y - 10, `${company.name} - ${job.title}`, {
                fontSize: '14px',
                color: '#ffffff'
            });
            this.mainContent.add(info);

            // 投递时间
            const time = this.add.text(-380, y + 15, `投递于第${app.appliedDay}天`, {
                fontSize: '12px',
                color: '#888888'
            });
            this.mainContent.add(time);

            // 状态
            const statusColors: { [key: string]: string } = {
                'pending': '#888888',
                'viewed': '#4a90d9',
                'interview_invited': '#00ff88',
                'interviewing': '#ffaa00',
                'offer': '#00ff88',
                'rejected': '#ff4444',
                'withdrawn': '#666666'
            };
            const statusLabels: { [key: string]: string } = {
                'pending': '⏳ 待查看',
                'viewed': '👁️ 已查看',
                'interview_invited': '🎉 邀请面试',
                'interviewing': '🎤 面试中',
                'offer': '✅ 已发Offer',
                'rejected': '❌ 已拒绝',
                'withdrawn': '↩️ 已撤回'
            };
            const status = this.add.text(300, y, statusLabels[app.status], {
                fontSize: '14px',
                color: statusColors[app.status]
            });
            this.mainContent.add(status);
        });
    }

    private showInterviews(): void {
        const applications = jobHuntSystem.getApplications();
        const upcomingInterviews = applications.filter(app =>
            app.interviewRounds.some(r => r.status === 'scheduled')
        );

        // 标题
        const title = this.add.text(0, -280, '面试安排', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (upcomingInterviews.length === 0) {
            const emptyText = this.add.text(0, 0, '暂无面试安排\n投递简历后等待面试邀请', {
                fontSize: '16px',
                color: '#888888',
                align: 'center'
            });
            emptyText.setOrigin(0.5, 0.5);
            this.mainContent.add(emptyText);
            return;
        }

        upcomingInterviews.forEach((app, index) => {
            const job = jobHuntSystem.getJobPosition(app.jobId);
            const company = jobHuntSystem.getCompany(app.companyId);
            const interview = app.interviewRounds.find(r => r.status === 'scheduled');
            if (!job || !company || !interview) return;

            const y = -200 + index * 100;

            // 卡片
            const card = this.add.rectangle(0, y, 800, 90, 0x2a3a2a);
            card.setStrokeStyle(1, 0x00ff88);
            this.mainContent.add(card);

            // 公司和职位
            const info = this.add.text(-380, y - 25, `${company.name} - ${job.title}`, {
                fontSize: '16px',
                color: '#ffffff'
            });
            this.mainContent.add(info);

            // 面试信息
            const interviewInfo = this.add.text(-380, y + 5,
                `第${interview.round}轮 ${interview.type === 'phone' ? '电话面试' : interview.type === 'video' ? '视频面试' : '现场面试'}`, {
                fontSize: '14px',
                color: '#00ff88'
            });
            this.mainContent.add(interviewInfo);

            // 时间
            const timeInfo = this.add.text(-380, y + 30,
                `📅 第${interview.scheduledDay}天 ${interview.scheduledTime} | 👤 ${interview.interviewerRole}: ${interview.interviewerName}`, {
                fontSize: '12px',
                color: '#888888'
            });
            this.mainContent.add(timeInfo);

            // 开始面试按钮
            const status = jobHuntSystem.getStatus();
            if (interview.scheduledDay <= status.currentDay) {
                const startBtn = this.add.text(320, y, '开始面试', {
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: '#00aa44',
                    padding: { x: 15, y: 8 }
                });
                startBtn.setInteractive({ useHandCursor: true });
                startBtn.on('pointerdown', () => this.startInterview(app, interview));
                this.mainContent.add(startBtn);
            }
        });
    }

    private showOffers(): void {
        const applications = jobHuntSystem.getApplications();
        const offers = applications.filter(app => app.status === 'offer' && app.offerDetails);

        // 标题
        const title = this.add.text(0, -280, 'Offer列表', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (offers.length === 0) {
            const emptyText = this.add.text(0, 0, '还没有收到Offer\n继续努力面试吧！', {
                fontSize: '16px',
                color: '#888888',
                align: 'center'
            });
            emptyText.setOrigin(0.5, 0.5);
            this.mainContent.add(emptyText);
            return;
        }

        offers.forEach((app, index) => {
            const job = jobHuntSystem.getJobPosition(app.jobId);
            const company = jobHuntSystem.getCompany(app.companyId);
            const offer = app.offerDetails!;

            const y = -180 + index * 140;

            // 卡片
            const card = this.add.rectangle(0, y, 800, 120, 0x2a3a2a);
            card.setStrokeStyle(2, 0x00ff88);
            this.mainContent.add(card);

            // 公司和职位
            const info = this.add.text(-380, y - 40, `🎉 ${company?.name} - ${job?.title}`, {
                fontSize: '18px',
                color: '#00ff88'
            });
            this.mainContent.add(info);

            // 薪资
            const salaryInfo = this.add.text(-380, y - 10,
                `月薪: ¥${offer.baseSalary.toLocaleString()}${offer.bonus ? ` + 奖金` : ''}`, {
                fontSize: '16px',
                color: '#ffffff'
            });
            this.mainContent.add(salaryInfo);

            // 福利
            const benefits = this.add.text(-380, y + 15,
                `福利: ${offer.benefits.slice(0, 3).join(', ')}`, {
                fontSize: '12px',
                color: '#888888'
            });
            this.mainContent.add(benefits);

            // 有效期
            const status = jobHuntSystem.getStatus();
            const daysLeft = offer.expirationDay - status.currentDay;
            const expireText = this.add.text(-380, y + 40,
                `⏰ ${daysLeft > 0 ? `还剩${daysLeft}天` : '已过期'}`, {
                fontSize: '12px',
                color: daysLeft > 0 ? '#ffaa00' : '#ff4444'
            });
            this.mainContent.add(expireText);

            if (offer.status === 'pending' && daysLeft > 0) {
                // 接受按钮
                const acceptBtn = this.add.text(250, y - 15, '接受Offer', {
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: '#00aa44',
                    padding: { x: 15, y: 8 }
                });
                acceptBtn.setInteractive({ useHandCursor: true });
                acceptBtn.on('pointerdown', () => this.acceptOffer(app));
                this.mainContent.add(acceptBtn);

                // 谈薪按钮
                if (offer.negotiable) {
                    const negotiateBtn = this.add.text(250, y + 25, '谈薪资', {
                        fontSize: '14px',
                        color: '#ffffff',
                        backgroundColor: '#4a90d9',
                        padding: { x: 15, y: 8 }
                    });
                    negotiateBtn.setInteractive({ useHandCursor: true });
                    negotiateBtn.on('pointerdown', () => this.negotiateSalary(app));
                    this.mainContent.add(negotiateBtn);
                }

                // 拒绝按钮
                const declineBtn = this.add.text(370, y - 15, '拒绝', {
                    fontSize: '14px',
                    color: '#888888',
                    backgroundColor: '#333333',
                    padding: { x: 15, y: 8 }
                });
                declineBtn.setInteractive({ useHandCursor: true });
                declineBtn.on('pointerdown', () => {
                    jobHuntSystem.declineOffer(app.id);
                    this.refreshContent();
                });
                this.mainContent.add(declineBtn);
            }
        });
    }

    private applyJob(job: JobPosition): void {
        const result = jobHuntSystem.applyJob(job.id);
        const company = jobHuntSystem.getCompany(job.companyId);

        if (result.success) {
            notificationManager.success(
                '简历投递成功',
                `您的简历已成功投递至 ${company?.name || '公司'}`,
                8000
            );
            // 延迟刷新内容，让通知有时间显示
            this.time.delayedCall(500, () => {
                this.refreshContent();
            });
        } else {
            notificationManager.warning('投递失败', result.message, 5000);
        }
    }

    private showJobDetail(job: JobPosition, company: Company): void {
        // 创建详情弹窗
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(1000);

        const dialog = this.add.container(640, 360);
        dialog.setDepth(1001);

        const bg = this.add.rectangle(0, 0, 700, 500, 0x2a2a3a);
        bg.setStrokeStyle(2, 0x4a90d9);
        dialog.add(bg);

        // 公司名
        const companyName = this.add.text(0, -220, company.name, {
            fontSize: '24px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        companyName.setOrigin(0.5, 0.5);
        dialog.add(companyName);

        // 职位名
        const jobTitle = this.add.text(0, -180, job.title, {
            fontSize: '20px',
            color: '#ffffff'
        });
        jobTitle.setOrigin(0.5, 0.5);
        dialog.add(jobTitle);

        // 薪资
        const salary = this.add.text(0, -140,
            `💰 ${(job.salaryRange[0] / 1000).toFixed(0)}K-${(job.salaryRange[1] / 1000).toFixed(0)}K`, {
            fontSize: '18px',
            color: '#00ff88'
        });
        salary.setOrigin(0.5, 0.5);
        dialog.add(salary);

        // 公司信息
        const companyInfo = this.add.text(-320, -100, [
            `🏢 规模: ${company.size}`,
            `⭐ 口碑: ${'★'.repeat(company.reputation)}${'☆'.repeat(5 - company.reputation)}`,
            `📊 面试难度: ${'●'.repeat(company.interviewDifficulty)}${'○'.repeat(5 - company.interviewDifficulty)}`,
            `⚖️ 工作生活平衡: ${'●'.repeat(company.workLifeBalance)}${'○'.repeat(5 - company.workLifeBalance)}`,
            '',
            company.description
        ].join('\n'), {
            fontSize: '14px',
            color: '#cccccc',
            lineSpacing: 8
        });
        dialog.add(companyInfo);

        // 职位要求
        const requirements = this.add.text(-320, 50, [
            '📋 职位要求:',
            ...job.requirements.map(r => `  • ${r}`),
            '',
            '🎁 福利待遇:',
            ...job.benefits.map(b => `  • ${b}`)
        ].join('\n'), {
            fontSize: '13px',
            color: '#aaaaaa',
            lineSpacing: 6
        });
        dialog.add(requirements);

        // 投递按钮 - 检查是否已投递
        const applications = jobHuntSystem.getApplications();
        const hasApplied = applications.some(app => app.jobId === job.id);

        const applyBtn = this.add.text(0, 200, hasApplied ? '✅ 已投递' : '📨 投递简历', {
            fontSize: '18px',
            color: hasApplied ? '#888888' : '#ffffff',
            backgroundColor: hasApplied ? '#3a3a3a' : '#4a90d9',
            padding: { x: 30, y: 12 }
        });
        applyBtn.setOrigin(0.5, 0.5);

        if (!hasApplied) {
            applyBtn.setInteractive({ useHandCursor: true });

            // 悬停效果
            applyBtn.on('pointerover', () => {
                applyBtn.setStyle({ backgroundColor: '#5aa0e9' });
                this.tweens.add({ targets: applyBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
            });
            applyBtn.on('pointerout', () => {
                applyBtn.setStyle({ backgroundColor: '#4a90d9' });
                this.tweens.add({ targets: applyBtn, scaleX: 1, scaleY: 1, duration: 100 });
            });

            // 点击动画反馈
            applyBtn.on('pointerdown', () => {
                applyBtn.setText('投递中...');
                applyBtn.setStyle({ backgroundColor: '#3a80c9', color: '#aaaaaa' });
                applyBtn.disableInteractive();

                this.tweens.add({
                    targets: applyBtn,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    onComplete: () => {
                        this.time.delayedCall(300, () => {
                            this.applyJob(job);
                            overlay.destroy();
                            dialog.destroy();
                        });
                    }
                });
            });
        }
        dialog.add(applyBtn);

        // 关闭按钮
        const closeBtn = this.add.text(320, -220, '✕', {
            fontSize: '24px',
            color: '#888888'
        });
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            dialog.destroy();
        });
        dialog.add(closeBtn);

        overlay.on('pointerdown', () => {
            overlay.destroy();
            dialog.destroy();
        });
    }

    private startInterview(app: Application, _interview: Application['interviewRounds'][0]): void {
        // 启动面试场景
        this.scene.pause();
        this.scene.launch('InterviewScene', { application: app });
    }

    private acceptOffer(app: Application): void {
        const company = jobHuntSystem.getCompany(app.companyId);
        const result = jobHuntSystem.acceptOffer(app.id);

        if (result) {
            // 跳转到胜利结局
            this.time.delayedCall(1500, () => {
                this.scene.start('GameOverScene', {
                    victory: true,
                    reason: '成功入职',
                    companyName: company?.name || '公司',
                    salary: app.offerDetails?.baseSalary || 15000
                });
            });
        } else {
            notificationManager.error('入职失败', '接受Offer时出现问题', 4000);
        }
    }

    private negotiateSalary(app: Application): void {
        const currentSalary = app.offerDetails?.baseSalary || 0;
        const company = jobHuntSystem.getCompany(app.companyId);
        const input = prompt(`当前offer薪资: ¥${currentSalary}\n请输入期望薪资:`);
        if (!input) return;

        const requestedSalary = parseInt(input);
        if (isNaN(requestedSalary)) {
            notificationManager.warning('输入错误', '请输入有效的数字', 3000);
            return;
        }

        const result = jobHuntSystem.negotiateSalary(app.id, requestedSalary);

        if (result.success) {
            notificationManager.success(
                '薪资谈判成功',
                `${company?.name || '公司'} ${result.message}`,
                6000
            );
        } else {
            notificationManager.warning(
                '薪资谈判',
                result.message,
                5000
            );
        }
        this.refreshContent();
    }

    private showResumeEditor(): void {
        const resume = jobHuntSystem.getResume();

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(1000);

        const dialog = this.add.container(640, 360);
        dialog.setDepth(1001);

        const bg = this.add.rectangle(0, 0, 600, 450, 0x2a2a3a);
        bg.setStrokeStyle(2, 0x4a90d9);
        dialog.add(bg);

        const title = this.add.text(0, -190, '📝 我的简历', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        dialog.add(title);

        const eduLabels: { [key: string]: string } = {
            'high_school': '高中',
            'college': '大专',
            'bachelor': '本科',
            'master': '硕士',
            'phd': '博士'
        };

        const content = this.add.text(-260, -150, [
            `👤 姓名: ${resume.name}`,
            `🎂 年龄: ${resume.age}岁`,
            `🎓 学历: ${eduLabels[resume.education]}`,
            `🏫 学校: ${resume.school}`,
            `📚 专业: ${resume.major}`,
            `💼 工作经验: ${resume.experience}年`,
            ``,
            `🛠️ 技能: ${resume.skills.join(', ')}`,
            ``,
            `📂 项目经历: ${resume.projects.join(', ')}`,
            ``,
            `💰 期望薪资: ¥${resume.expectedSalary[0]}-${resume.expectedSalary[1]}`
        ].join('\n'), {
            fontSize: '14px',
            color: '#cccccc',
            lineSpacing: 8
        });
        dialog.add(content);

        const closeBtn = this.add.text(0, 180, '关闭', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 30, y: 10 }
        });
        closeBtn.setOrigin(0.5, 0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            dialog.destroy();
        });
        dialog.add(closeBtn);
    }

    private advanceDay(): void {
        const result = jobHuntSystem.advanceDay();

        // 处理事件 - 使用右下角通知系统
        result.events.forEach((event, index) => {
            // 延迟显示，让多个通知依次弹出
            this.time.delayedCall(index * 800, () => {
                switch (event.type) {
                    case 'application_viewed':
                        notificationManager.info(
                            '简历被查看',
                            `${event.data.company.name} 查看了您的简历`,
                            6000
                        );
                        break;
                    case 'interview_invited':
                        notificationManager.success(
                            '面试邀请',
                            `恭喜！${event.data.company.name} 邀请您参加面试`,
                            8000
                        );
                        break;
                    case 'application_rejected':
                        notificationManager.error(
                            '申请被拒',
                            `${event.data.company.name}: ${event.data.reason}`,
                            6000
                        );
                        break;
                    case 'offer_received':
                        notificationManager.success(
                            '收到Offer!',
                            `${event.data.company.name} 向您发放了Offer`,
                            10000
                        );
                        break;
                    case 'bankrupt':
                        // 直接跳转到游戏结束场景
                        this.time.delayedCall(2000, () => {
                            this.scene.start('GameOverScene', {
                                victory: false,
                                reason: '存款耗尽，无法继续求职'
                            });
                        });
                        break;
                    case 'timeout':
                        // 时间超限失败
                        this.time.delayedCall(2000, () => {
                            this.scene.start('GameOverScene', {
                                victory: false,
                                reason: '求职时间过长，精神崩溃了...'
                            });
                        });
                        break;
                }
            });
        });

        // 显示日期变更通知
        const status = jobHuntSystem.getStatus();
        notificationManager.info(
            '新的一天',
            `第 ${status.currentDay} 天开始了`,
            3000
        );

        // 刷新界面（不使用restart以保留通知）
        this.time.delayedCall(500, () => {
            this.createStatusBar();
            this.createNavigation();
            this.refreshContent();
        });
    }

    private setupEventListeners(): void {
        // 监听从其他场景返回
        this.events.on('resume', () => {
            // 不使用restart以保留通知
            this.createStatusBar();
            this.createNavigation();
            this.refreshContent();
        });
    }

    private showToast(message: string, success: boolean): void {
        const toast = this.add.text(640, 650, message, {
            fontSize: '14px',
            color: success ? '#00ff88' : '#ff4444',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        toast.setOrigin(0.5, 0.5);
        toast.setDepth(2000);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 600,
            duration: 3000,
            onComplete: () => toast.destroy()
        });
    }
}
