import Phaser from 'phaser';
import type { Application, Company, JobPosition } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';
import { notificationManager } from '../NotificationManager';
import { applyGlassEffect, COLORS, createStyledButton, FONTS, TEXT_STYLES } from '../UIConfig';

/**
 * 求职主界面场景
 */
export class JobHuntScene extends Phaser.Scene {
    private statusPanel!: Phaser.GameObjects.Container;
    private navPanel!: Phaser.GameObjects.Container;
    private mainContent!: Phaser.GameObjects.Container;
    private navButtons: Phaser.GameObjects.Container[] = [];
    private currentTab: 'jobs' | 'applications' | 'interviews' | 'offers' = 'jobs';

    constructor() {
        super({ key: 'JobHuntScene' });
    }

    create(): void {
        // 绑定通知系统到当前场景
        notificationManager.bindScene(this);

        // 背景
        this.add.rectangle(640, 360, 1280, 720, COLORS.bg);

        // 背景装饰
        const deco = this.add.graphics();
        deco.lineStyle(2, COLORS.primary, 0.1);
        for (let i = 0; i < 1280; i += 40) {
            deco.moveTo(i, 0);
            deco.lineTo(i, 720);
        }
        for (let i = 0; i < 720; i += 40) {
            deco.moveTo(0, i);
            deco.lineTo(1280, i);
        }
        deco.strokePath();

        // 标题容器
        const header = this.add.container(640, 60);
        const titleText = this.add.text(0, -15, '🔍 职业搜索与规划', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 25, 'OPPORTUNITY AWAITS / STRATEGIZE YOUR NEXT MOVE', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        }).setOrigin(0.5);
        header.add([titleText, subTitleText]);

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
        if (this.statusPanel) {
            this.statusPanel.destroy();
        }
        this.statusPanel = this.add.container(0, 100); // 往下移动一点，腾出标题空间
        this.statusPanel.setDepth(5);

        const status = jobHuntSystem.getStatus();

        // 状态栏背景 (磨砂玻璃)
        const statusBg = this.add.rectangle(640, 40, 1280, 80, COLORS.panel, 0.9);
        statusBg.setStrokeStyle(1, COLORS.primary, 0.2);
        this.statusPanel.add(statusBg);

        // 存款
        const savingsLabel = this.add.text(40, 20, 'ASSETS / 资产', {
            fontSize: '10px',
            color: '#888888',
            fontStyle: 'bold'
        });
        const savingsValue = this.add.text(40, 35, `¥${status.savings.toLocaleString()}`, {
            fontSize: '20px',
            color: status.savings < 5000 ? '#ff4444' : '#00ff88',
            fontStyle: 'bold'
        });
        this.statusPanel.add([savingsLabel, savingsValue]);

        // 焦虑与信心 (紧凑型条状图)
        this.createStatusMeter(240, 40, 'STRESS', status.anxiety, COLORS.danger);
        this.createStatusMeter(380, 40, 'CONFID', status.confidence, COLORS.success);

        // 日期
        const dayLabel = this.add.text(640, 20, `DAY ${status.currentDay}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        const daySub = this.add.text(640, 50, `已失业 ${status.unemployedDays} 天`, {
            fontSize: '11px',
            color: '#888888'
        }).setOrigin(0.5, 0);
        this.statusPanel.add([dayLabel, daySub]);

        // 核心数据统计
        const statsX = 850;
        this.createMiniStat(statsX, 40, 'APPLY', status.totalApplications);
        this.createMiniStat(statsX + 80, 40, 'INTVW', status.totalInterviews);
        this.createMiniStat(statsX + 160, 40, 'OFFER', status.totalOffers);

        // 下一天按钮 (Styled)
        const nextDayBtn = createStyledButton(this, 1180, 40, 140, 45, 'NEXT DAY ⏭️', () => this.advanceDay());
        this.statusPanel.add(nextDayBtn);
    }

    private createStatusMeter(x: number, y: number, label: string, value: number, color: number): void {
        const title = this.add.text(x, y - 20, label, { fontSize: '10px', color: '#888888', fontStyle: 'bold' });
        const bg = this.add.rectangle(x, y + 5, 100, 4, 0x333333).setOrigin(0, 0.5);
        const fill = this.add.rectangle(x, y + 5, value, 4, color).setOrigin(0, 0.5);
        const valText = this.add.text(x + 105, y + 5, `${value}%`, { fontSize: '10px', color: '#ffffff' }).setOrigin(0, 0.5);
        this.statusPanel.add([title, bg, fill, valText]);
    }

    private createMiniStat(x: number, y: number, label: string, value: number): void {
        const l = this.add.text(x, y - 10, label, { fontSize: '9px', color: '#666666' }).setOrigin(0.5);
        const v = this.add.text(x, y + 5, value.toString(), { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        this.statusPanel.add([l, v]);
    }

    private createNavigation(): void {
        if (this.navPanel) {
            this.navPanel.destroy();
        }
        this.navPanel = this.add.container(0, 50); // 往下移动
        this.navPanel.setDepth(5);
        this.navButtons = [];

        const navItems = [
            { key: 'jobs', label: '🔍 找工作', y: 160 },
            { key: 'applications', label: '📨 我的投递', y: 220 },
            { key: 'interviews', label: '🎤 面试安排', y: 280 },
            { key: 'offers', label: '📋 OFFER', y: 340 },
        ];

        // 导航背景
        const navBg = this.add.rectangle(110, 400, 180, 520, COLORS.panel, 0.5);
        navBg.setStrokeStyle(1, COLORS.primary, 0.1);
        this.navPanel.add(navBg);

        navItems.forEach(item => {
            const container = this.add.container(110, item.y);
            const isActive = this.currentTab === item.key;

            const bg = this.add.rectangle(0, 0, 160, 50, isActive ? COLORS.primary : 0x000000, isActive ? 0.2 : 0);
            bg.setStrokeStyle(isActive ? 1 : 0, COLORS.primary, 0.5);

            const label = this.add.text(-60, 0, item.label, {
                fontSize: '15px',
                fontFamily: 'Inter',
                color: isActive ? '#ffffff' : '#888888',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0, 0.5);

            container.add([bg, label]);

            bg.setInteractive({ useHandCursor: true });

            bg.on('pointerover', () => {
                if (this.currentTab !== item.key) {
                    bg.setFillStyle(0xffffff, 0.05);
                    label.setColor('#ffffff');
                }
            });

            bg.on('pointerout', () => {
                if (this.currentTab !== item.key) {
                    bg.setFillStyle(0, 0);
                    label.setColor('#888888');
                }
            });

            bg.on('pointerdown', () => {
                if (this.currentTab !== item.key) {
                    this.currentTab = item.key as any;
                    this.updateNavStyles();
                    this.refreshContent();
                }
            });

            this.navButtons.push(container);
            this.navPanel.add(container);
        });

        // 功能分割线
        const sep = this.add.rectangle(110, 420, 140, 1, 0x333333);
        this.navPanel.add(sep);

        // 附加功能
        this.createSecondaryNavBtn(110, 460, '📝 修改简历', () => this.showResumeEditor());
        this.createSecondaryNavBtn(110, 500, '📈 股市行情', () => {
            this.scene.pause();
            this.scene.launch('StockScene');
        });
        this.createSecondaryNavBtn(110, 540, '🏢 职场行动', () => {
            this.scene.pause();
            this.scene.launch('ImprovedOfficeScene');
        });

        // DEBUG 按钮
        const debugBtn = this.add.text(110, 620, '[DEBUG: SKIP TO WORK]', {
            fontSize: '10px',
            fontFamily: FONTS.mono,
            color: '#ff4444',
            backgroundColor: '#330000',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        debugBtn.on('pointerdown', () => {
            if (confirm('跳过入职过程，直接进入职场生活？')) {
                this.scene.start('ImprovedOfficeScene');
            }
        });
        this.navPanel.add(debugBtn);
    }

    private createSecondaryNavBtn(x: number, y: number, label: string, onClick: () => void): void {
        const btn = this.add.text(x, y, label, {
            fontSize: '13px',
            color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor('#ffffff'));
        btn.on('pointerout', () => btn.setColor('#666666'));
        btn.on('pointerdown', onClick);

        this.navPanel.add(btn);
    }

    private updateNavStyles(): void {
        const keys = ['jobs', 'applications', 'interviews', 'offers'];
        this.navButtons.forEach((container, index) => {
            const isActive = this.currentTab === keys[index];
            const bg = container.list[0] as Phaser.GameObjects.Rectangle;
            const label = container.list[1] as Phaser.GameObjects.Text;

            bg.setFillStyle(isActive ? COLORS.primary : 0x000000, isActive ? 0.2 : 0);
            bg.setStrokeStyle(isActive ? 1 : 0, COLORS.primary, 0.5);
            label.setColor(isActive ? '#ffffff' : '#888888');
            label.setFontStyle(isActive ? 'bold' : 'normal');
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
        const title = this.add.text(0, -280, '热门职位', TEXT_STYLES.h2);
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        // 职位列表
        jobs.slice(0, 6).forEach((job, index) => {
            const company = companies.find(c => c.id === job.companyId);
            if (!company) return;

            const y = -190 + index * 95;

            // 职位卡片容器
            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景 (磨砂玻璃卡片)
            const bg = this.add.rectangle(0, 0, 800, 85, COLORS.panel, 0.4);
            bg.setStrokeStyle(1, COLORS.primary, 0.2);
            applyGlassEffect(bg, 0.4);
            cardContainer.add(bg);

            // 公司名
            const companyName = this.add.text(-380, -25, company.name.toUpperCase(), {
                fontSize: '11px',
                fontFamily: FONTS.mono,
                color: '#4a90d9',
                letterSpacing: 1
            });
            cardContainer.add(companyName);

            // 职位名
            const jobTitle = this.add.text(-380, 0, job.title, {
                fontSize: '18px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(jobTitle);

            // 薪资
            const salary = this.add.text(-380, 25,
                `¥${(job.salaryRange[0] / 1000).toFixed(0)}K - ${(job.salaryRange[1] / 1000).toFixed(0)}K`, {
                fontSize: '14px',
                fontFamily: FONTS.mono,
                color: '#00ff88',
                fontStyle: 'bold'
            });
            cardContainer.add(salary);

            // 要求 (居中偏右)
            const reqs = this.add.text(-100, 0, `${job.experience} / ${job.education}`, {
                fontSize: '12px',
                fontFamily: FONTS.main,
                color: '#888888'
            }).setOrigin(0, 0.5);
            cardContainer.add(reqs);

            // 标签系统
            let tagX = 180;
            const createTag = (text: string, color: number) => {
                const tagBg = this.add.rectangle(tagX, -15, 50, 20, color, 0.2);
                tagBg.setStrokeStyle(1, color, 0.5);
                const tagText = this.add.text(tagX, -15, text, {
                    fontSize: '10px',
                    fontFamily: FONTS.main,
                    color: '#ffffff',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5);

                const tagWidth = Math.max(50, tagText.width + 10);
                tagBg.width = tagWidth;

                cardContainer.add([tagBg, tagText]);
                tagX += tagWidth + 10;
            };

            const typeColors: { [key: string]: number } = {
                'large': 0x4a90d9,
                'foreign': 0x00ffcc,
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
            createTag(typeLabels[company.type], typeColors[company.type]);

            if (job.urgency !== 'normal') {
                createTag(job.urgency === 'asap' ? '急招' : '紧急', COLORS.danger);
            }

            // 投递按钮
            const applications = jobHuntSystem.getApplications();
            const hasApplied = applications.some(app => app.jobId === job.id);

            const btnText = hasApplied ? '✓ 已投递' : '投递简历';
            const btnColor = hasApplied ? 0x333333 : COLORS.primary;

            const applyBtnBg = this.add.rectangle(340, 0, 100, 40, btnColor, hasApplied ? 0.3 : 0.8);
            applyBtnBg.setStrokeStyle(1, btnColor, 1);
            const applyBtnText = this.add.text(340, 0, btnText, {
                fontSize: '14px',
                fontFamily: FONTS.main,
                color: hasApplied ? '#888888' : '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            cardContainer.add([applyBtnBg, applyBtnText]);

            if (!hasApplied) {
                applyBtnBg.setInteractive({ useHandCursor: true });

                applyBtnBg.on('pointerover', () => {
                    applyBtnBg.setFillStyle(COLORS.primary, 1);
                    this.tweens.add({ targets: cardContainer, scaleX: 1.01, scaleY: 1.01, duration: 100 });
                });

                applyBtnBg.on('pointerout', () => {
                    applyBtnBg.setFillStyle(COLORS.primary, 0.8);
                    this.tweens.add({ targets: cardContainer, scaleX: 1, scaleY: 1, duration: 100 });
                });

                applyBtnBg.on('pointerdown', () => {
                    applyBtnText.setText('...');
                    this.applyJob(job);
                });
            }

            // 点击卡片背景查看详情
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => {
                bg.setStrokeStyle(1, COLORS.primary, 1);
                bg.setFillStyle(COLORS.panel, 0.6);
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(1, COLORS.primary, 0.2);
                bg.setFillStyle(COLORS.panel, 0.4);
            });
            bg.on('pointerdown', () => this.showJobDetail(job, company));
        });
    }

    private showApplications(): void {
        const applications = jobHuntSystem.getApplications();

        // 标题
        const title = this.add.text(0, -280, `我的投递 (${applications.length})`, TEXT_STYLES.h2);
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (applications.length === 0) {
            const emptyText = this.add.text(0, 0, '还没有投递记录\n去职位列表寻找机会吧', {
                fontSize: '16px',
                fontFamily: FONTS.main,
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5);
            this.mainContent.add(emptyText);
            return;
        }

        applications.slice(0, 6).forEach((app, index) => {
            const job = jobHuntSystem.getJobPosition(app.jobId);
            const company = jobHuntSystem.getCompany(app.companyId);
            if (!job || !company) return;

            const y = -190 + index * 80;

            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景
            const bg = this.add.rectangle(0, 0, 800, 70, COLORS.panel, 0.4);
            applyGlassEffect(bg, 0.3);
            cardContainer.add(bg);

            // 信息
            const info = this.add.text(-380, -10, `${company.name} / ${job.title}`, {
                fontSize: '15px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(info);

            // 时间
            const time = this.add.text(-380, 15, `第 ${app.appliedDay} 天投递`, {
                fontSize: '12px',
                fontFamily: FONTS.mono,
                color: '#888888'
            });
            cardContainer.add(time);

            // 状态标签
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
                'pending': '⏳ 待处理',
                'viewed': '👁️ 已查看',
                'interview_invited': '🎉 邀请面试',
                'interviewing': '🎤 面试中',
                'offer': '✅ 已录用',
                'rejected': '❌ 已拒绝',
                'withdrawn': '↩️ 已撤回'
            };

            const status = this.add.text(380, 0, statusLabels[app.status], {
                fontSize: '14px',
                fontFamily: FONTS.main,
                color: statusColors[app.status],
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            cardContainer.add(status);
        });
    }

    private showInterviews(): void {
        const applications = jobHuntSystem.getApplications();
        const upcomingInterviews = applications.filter(app =>
            app.interviewRounds.some(r => r.status === 'scheduled')
        );

        // 标题
        const title = this.add.text(0, -280, '面试安排', TEXT_STYLES.h2);
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (upcomingInterviews.length === 0) {
            const emptyText = this.add.text(0, 0, '暂无面试安排\n投递简历后等待面试邀请', {
                fontSize: '16px',
                fontFamily: FONTS.main,
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5);
            this.mainContent.add(emptyText);
            return;
        }

        upcomingInterviews.forEach((app, index) => {
            const job = jobHuntSystem.getJobPosition(app.jobId);
            const company = jobHuntSystem.getCompany(app.companyId);
            const interview = app.interviewRounds.find(r => r.status === 'scheduled');
            if (!job || !company || !interview) return;

            const y = -190 + index * 110;

            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景
            const bg = this.add.rectangle(0, 0, 800, 100, COLORS.panel, 0.4);
            bg.setStrokeStyle(1, COLORS.success, 0.3);
            applyGlassEffect(bg, 0.4);
            cardContainer.add(bg);

            // 公司和职位
            const info = this.add.text(-380, -30, `${company.name} / ${job.title}`, {
                fontSize: '16px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(info);

            // 面试信息
            const interviewInfo = this.add.text(-380, -5,
                `第 ${interview.round} 轮 ${interview.type === 'phone' ? '电话面试' : interview.type === 'video' ? '视频面试' : '现场面试'}`, {
                fontSize: '14px',
                fontFamily: FONTS.main,
                color: '#00ff88',
                fontStyle: 'bold'
            });
            cardContainer.add(interviewInfo);

            // 时间
            const timeInfo = this.add.text(-380, 20,
                `📅 第 ${interview.scheduledDay} 天 ${interview.scheduledTime} | 👤 ${interview.interviewerRole}: ${interview.interviewerName}`, {
                fontSize: '12px',
                fontFamily: FONTS.mono,
                color: '#888888'
            });
            cardContainer.add(timeInfo);

            // 开始面试按钮
            const status = jobHuntSystem.getStatus();
            if (interview.scheduledDay <= status.currentDay) {
                const startBtn = createStyledButton(this, 330, 0, 120, 40, '开始面试', () => this.startInterview(app, interview));
                cardContainer.add(startBtn);
            } else {
                const waitText = this.add.text(330, 0, '未开始', {
                    fontSize: '14px',
                    fontFamily: FONTS.main,
                    color: '#666666'
                }).setOrigin(0.5);
                cardContainer.add(waitText);
            }
        });
    }

    private showOffers(): void {
        const applications = jobHuntSystem.getApplications();
        const offers = applications.filter(app => app.status === 'offer' && app.offerDetails);

        // 标题
        const title = this.add.text(0, -280, 'Offer列表', TEXT_STYLES.h2);
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (offers.length === 0) {
            const emptyText = this.add.text(0, 0, '还没有收到Offer\n继续努力面试吧！', {
                fontSize: '16px',
                fontFamily: FONTS.main,
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5);
            this.mainContent.add(emptyText);
            return;
        }

        offers.forEach((app, index) => {
            const job = jobHuntSystem.getJobPosition(app.jobId);
            const company = jobHuntSystem.getCompany(app.companyId);
            const offer = app.offerDetails!;

            const y = -160 + index * 140;

            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景
            const bg = this.add.rectangle(0, 0, 800, 120, COLORS.panel, 0.4);
            bg.setStrokeStyle(2, COLORS.success, 0.3);
            applyGlassEffect(bg, 0.5);
            cardContainer.add(bg);

            // 公司和职位
            const info = this.add.text(-380, -40, `🎉 ${company?.name} / ${job?.title}`, {
                fontSize: '18px',
                fontFamily: FONTS.main,
                color: '#00ff88',
                fontStyle: 'bold'
            });
            cardContainer.add(info);

            // 薪资
            const salaryInfo = this.add.text(-380, -10,
                `月薪: ¥${offer.baseSalary.toLocaleString()}${offer.bonus ? ` + 奖金` : ''}`, {
                fontSize: '16px',
                fontFamily: FONTS.mono,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(salaryInfo);

            // 福利
            const benefits = this.add.text(-380, 15,
                `福利: ${offer.benefits.slice(0, 3).join(', ')}`, {
                fontSize: '12px',
                fontFamily: FONTS.main,
                color: '#aaaaaa'
            });
            cardContainer.add(benefits);

            // 有效期
            const status = jobHuntSystem.getStatus();
            const daysLeft = offer.expirationDay - status.currentDay;
            const expireText = this.add.text(-380, 40,
                `⏰ ${daysLeft > 0 ? `还剩 ${daysLeft} 天` : '已过期'}`, {
                fontSize: '12px',
                fontFamily: FONTS.mono,
                color: daysLeft > 0 ? '#ffaa00' : '#ff4444'
            });
            cardContainer.add(expireText);

            if (offer.status === 'pending' && daysLeft > 0) {
                // 接受按钮
                const acceptBtn = createStyledButton(this, 280, -15, 120, 35, '接受Offer', () => this.acceptOffer(app));
                cardContainer.add(acceptBtn);

                // 谈薪按钮
                if (offer.negotiable) {
                    const negotiateBtn = createStyledButton(this, 280, 25, 120, 35, '聊聊薪资', () => this.negotiateSalary(app));
                    cardContainer.add(negotiateBtn);
                }

                // 拒绝按钮
                const declineBtn = this.add.text(380, -15, '残忍拒绝', {
                    fontSize: '13px',
                    fontFamily: FONTS.main,
                    color: '#666666'
                }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

                declineBtn.on('pointerover', () => declineBtn.setColor('#ff4444'));
                declineBtn.on('pointerout', () => declineBtn.setColor('#666666'));
                declineBtn.on('pointerdown', () => {
                    jobHuntSystem.declineOffer(app.id);
                    this.refreshContent();
                });
                cardContainer.add(declineBtn);
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

        const bg = this.add.rectangle(0, 0, 700, 520, COLORS.panel, 0.95);
        bg.setStrokeStyle(2, COLORS.primary, 0.5);
        applyGlassEffect(bg, 0.95);
        dialog.add(bg);

        // 公司名 (小标题)
        const companyName = this.add.text(-320, -220, company.name.toUpperCase(), {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        });
        dialog.add(companyName);

        // 职位名 (大标题)
        const jobTitle = this.add.text(-320, -200, job.title, {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });
        dialog.add(jobTitle);

        // 薪资
        const salary = this.add.text(-320, -155,
            `¥${(job.salaryRange[0] / 1000).toFixed(0)}K - ${(job.salaryRange[1] / 1000).toFixed(0)}K`, {
            fontSize: '20px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold'
        });
        dialog.add(salary);

        // 装饰线
        const line = this.add.rectangle(-170, -120, 300, 1, COLORS.primary, 0.3);
        dialog.add(line);

        // 公司信息
        const companyInfo = this.add.text(-320, -100, [
            `🏢 规模: ${company.size}`,
            `⭐ 口碑: ${'★'.repeat(company.reputation)}${'☆'.repeat(5 - company.reputation)}`,
            `📊 难度: ${'●'.repeat(company.interviewDifficulty)}${'○'.repeat(5 - company.interviewDifficulty)}`,
            `⚖️ WLB: ${'●'.repeat(company.workLifeBalance)}${'○'.repeat(5 - company.workLifeBalance)}`,
            '',
            company.description
        ].join('\n'), {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: '#cccccc',
            lineSpacing: 8
        });
        dialog.add(companyInfo);

        // 职位要求 (右侧)
        const requirements = this.add.text(30, -100, [
            '📋 职位要求:',
            ...job.requirements.map(r => `  • ${r}`),
            '',
            '🎁 福利待遇:',
            ...job.benefits.map(b => `  • ${b}`)
        ].join('\n'), {
            fontSize: '13px',
            fontFamily: FONTS.main,
            color: '#aaaaaa',
            lineSpacing: 6
        });
        dialog.add(requirements);

        // 投递按钮
        const applications = jobHuntSystem.getApplications();
        const hasApplied = applications.some(app => app.jobId === job.id);

        const applyBtn = createStyledButton(
            this,
            0, 200, 200, 50,
            hasApplied ? '✓ 已投递' : '📨 立即投递',
            () => {
                if (!hasApplied) {
                    this.applyJob(job);
                    overlay.destroy();
                    dialog.destroy();
                }
            }
        );
        dialog.add(applyBtn);

        // 关闭按钮
        const closeBtn = this.add.text(320, -230, '✕', {
            fontSize: '24px',
            color: '#666666'
        }).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#666666'));
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

        this.showInputDialog({
            title: '薪资谈判',
            message: `当前 Offer 薪资: ¥${currentSalary.toLocaleString()}\n请输入您的期望薪资:`,
            placeholder: '例如: 25000',
            onConfirm: (input) => {
                const requestedSalary = parseInt(input);
                if (isNaN(requestedSalary) || requestedSalary <= 0) {
                    notificationManager.warning('输入错误', '请输入有效的薪资数字', 3000);
                    return;
                }

                const result = jobHuntSystem.negotiateSalary(app.id, requestedSalary);

                if (result.success) {
                    notificationManager.success('谈判成功', `${company?.name}: ${result.message}`, 6000);
                } else {
                    notificationManager.warning('谈判反馈', result.message, 5000);
                }
                this.refreshContent();
            }
        });
    }

    private showInputDialog(config: {
        title: string,
        message: string,
        placeholder?: string,
        onConfirm: (value: string) => void
    }): void {
        // 遮罩
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(2000);

        const dialog = this.add.container(640, 360);
        dialog.setDepth(2001);

        const bg = this.add.rectangle(0, 0, 450, 300, COLORS.panel, 0.95);
        bg.setStrokeStyle(2, COLORS.primary, 0.5);
        applyGlassEffect(bg, 0.95);
        dialog.add(bg);

        const titleText = this.add.text(0, -110, config.title, {
            fontSize: '20px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        dialog.add(titleText);

        const messageText = this.add.text(0, -60, config.message, {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: '#aaaaaa',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);
        dialog.add(messageText);

        // HTML 输入框
        const inputHTML = `
            <div style="width: 300px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
                <input type="text" id="dialogInput" placeholder="${config.placeholder || ''}" 
                    style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid #4a90d9; color: white; border-radius: 4px; outline: none; text-align: center; font-family: Inter, sans-serif;">
                <div style="display: flex; gap: 20px; width: 100%;">
                    <button id="cancelBtn" style="flex: 1; padding: 10px; background: #333; color: #888; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                    <button id="confirmBtn" style="flex: 1; padding: 10px; background: #4a90d9; color: white; border: none; border-radius: 4px; cursor: pointer;">确定</button>
                </div>
            </div>
        `;

        const domElement = this.add.dom(640, 360 + 40).createFromHTML(inputHTML);
        // 不放入 container
        // dialog.add(domElement);
        domElement.setDepth(1001);

        // 延迟绑定事件以确保 DOM 已渲染
        this.time.delayedCall(50, () => {
            const input = document.getElementById('dialogInput') as HTMLInputElement;
            const confirmBtn = document.getElementById('confirmBtn');
            const cancelBtn = document.getElementById('cancelBtn');

            if (input) {
                input.focus();
                input.addEventListener('focus', () => {
                    this.input.keyboard!.enabled = false;
                });
                input.addEventListener('blur', () => {
                    this.input.keyboard!.enabled = true;
                });
            }

            const handleSubmit = () => {
                const value = input?.value || '';
                config.onConfirm(value);
                overlay.destroy();
                dialog.destroy();
                domElement.destroy(); // 销毁 DOM
            };

            confirmBtn?.addEventListener('click', handleSubmit);

            cancelBtn?.addEventListener('click', () => {
                overlay.destroy();
                dialog.destroy();
                domElement.destroy(); // 销毁 DOM
            });

            // 回车支持
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn?.click();
                }
            });
        });
    }

    private showResumeEditor(): void {
        const resume = jobHuntSystem.getResume();

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(1000);

        const dialog = this.add.container(640, 360);
        dialog.setDepth(1001);

        const bg = this.add.rectangle(0, 0, 600, 500, COLORS.panel, 0.95);
        bg.setStrokeStyle(2, COLORS.primary, 0.5);
        applyGlassEffect(bg, 0.95);
        dialog.add(bg);

        const title = this.add.text(0, -210, '📝 我的核心简历', {
            fontSize: '24px',
            fontFamily: FONTS.main,
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

        const content = this.add.text(-260, -160, [
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
            fontSize: '15px',
            fontFamily: FONTS.main,
            color: '#cccccc',
            lineSpacing: 10
        });
        dialog.add(content);

        const editBtn = createStyledButton(this, 0, 180, 160, 45, '进入编辑模式', () => {
            overlay.destroy();
            dialog.destroy();
            this.scene.pause();
            this.scene.launch('ResumeEditScene');
        });
        dialog.add(editBtn);

        const closeBtn = this.add.text(270, -220, '✕', {
            fontSize: '20px',
            color: '#666666'
        }).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#666666'));
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
