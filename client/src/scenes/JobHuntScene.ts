import Phaser from 'phaser';
import type { Application, Company, JobPosition } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';
import { notificationManager } from '../NotificationManager';
import { applyGlassEffect, COLORS, createStyledButton, FONTS, Layout, SPACING, TEXT_STYLES } from '../UIConfig';

/**
 * 求职主界面场景
 */
export class JobHuntScene extends Phaser.Scene {
    private statusPanel!: Phaser.GameObjects.Container;
    private navPanel!: Phaser.GameObjects.Container;
    private mainContent!: Phaser.GameObjects.Container;
    private navButtons: Phaser.GameObjects.Container[] = [];
    private currentTab: 'jobs' | 'applications' | 'interviews' | 'offers' = 'jobs';
    private jobListPage: number = 0;
    private jobsPerPage: number = 4; // Use 4 to fit taller cards
    private layout!: Layout;

    constructor() {
        super({ key: 'JobHuntScene' });
    }

    create(): void {
        // 初始化布局
        this.layout = new Layout(this);
        const L = this.layout;

        // 绑定通知系统到当前场景
        notificationManager.bindScene(this);

        // 初始加载动态职位
        jobHuntSystem.initializeDynamicJobs().then(() => {
            if (this.currentTab === 'jobs') {
                this.refreshContent();
            }
        });

        // 监听职位更新
        jobHuntSystem.onEvent((event, data) => {
            if (event === 'jobs_updated' && this.currentTab === 'jobs') {
                this.refreshContent();
            }
        });

        // 现代背景 - 与模板一致
        this.add.rectangle(640, 360, 1280, 720, COLORS.bg);

        // 网格背景
        this.createGridBackground();

        // 渐变光晕 - 更柔和
        const topGlow = this.add.graphics();
        topGlow.fillStyle(COLORS.primary, 0.06);
        topGlow.fillCircle(280, -30, 350);
        topGlow.fillStyle(COLORS.secondary, 0.04);
        topGlow.fillCircle(950, 120, 280);

        const bottomGlow = this.add.graphics();
        bottomGlow.fillStyle(COLORS.accent, 0.03);
        bottomGlow.fillCircle(1100, 750, 320);

        // 标题容器
        const header = this.add.container(640, 50);

        // 小标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(0xffffff, 0.06);
        tagBg.fillRoundedRect(-55, -28, 110, 22, 11);

        const tagText = this.add.text(0, -17, '求职中心', {
            fontSize: '11px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        const titleText = this.add.text(0, 12, '职业探索', {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        header.add([tagBg, tagText, titleText]);

        // 创建顶部状态栏
        this.createStatusBar();

        // 创建左侧导航
        this.createNavigation();

        // 创建主内容区域
        this.mainContent = this.add.container(700, 380);
        this.mainContent.setDepth(10);

        // 默认显示职位列表
        this.showJobList();

        // 监听事件
        this.setupEventListeners();

        // 底部操作栏
        this.createBottomBar();
    }

    private createGridBackground(): void {
        const graphics = this.add.graphics();
        graphics.setAlpha(0.25);
        const gridSize = 40;
        graphics.lineStyle(1, 0xffffff, 0.02);

        for (let x = 0; x <= 1280; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 720);
        }
        for (let y = 0; y <= 720; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(1280, y);
        }
        graphics.strokePath();
    }

    private createStatusBar(): void {
        if (this.statusPanel) {
            this.statusPanel.destroy();
        }
        this.statusPanel = this.add.container(0, 100); // 往下移动一点，腾出标题空间
        this.statusPanel.setDepth(5);

        const status = jobHuntSystem.getStatus();

        // 状态栏背景 - 现代卡片风格
        const statusBg = this.add.graphics();
        statusBg.fillStyle(COLORS.bgPanel, 0.85);
        statusBg.fillRoundedRect(0, 0, 1280, 80, 0);
        statusBg.lineStyle(1, 0xffffff, 0.05);
        statusBg.strokeRect(0, 79, 1280, 1);
        this.statusPanel.add(statusBg);

        // 存款
        const savingsLabel = this.add.text(40, 20, 'ASSETS / 资产', {
            fontSize: '10px',
            color: '#888888',
            fontStyle: 'bold'
        });
        const savingsValue = this.add.text(40, 35, `¥${status.savings.toLocaleString()}`, {
            fontSize: '20px',
            fontFamily: FONTS.mono,
            color: status.savings < 5000 ? '#ef4444' : '#10b981',
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
        this.createMiniStat(statsX, 30, 'APPLY', status.totalApplications); // Move up slightly
        this.createMiniStat(statsX + 100, 30, 'INTVW', status.totalInterviews); // More spacing
        this.createMiniStat(statsX + 200, 30, 'OFFER', status.totalOffers);

        // 下一天按钮 (Styled)
        const nextDayBtn = createStyledButton(this, 1180, 40, 160, 50, 'NEXT DAY ⏭️', () => this.advanceDay()); // Larger button
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

        // 导航背景 - 现代卡片风格
        const navBg = this.add.graphics();
        navBg.fillStyle(COLORS.bgPanel, 0.6);
        navBg.fillRoundedRect(20, 140, 180, 520, 12);
        navBg.lineStyle(1, 0xffffff, 0.05);
        navBg.strokeRoundedRect(20, 140, 180, 520, 12);
        this.navPanel.add(navBg);

        navItems.forEach(item => {
            const container = this.add.container(110, item.y);
            const isActive = this.currentTab === item.key;

            const bg = this.add.graphics();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 0.2);
                bg.fillRoundedRect(-80, -25, 160, 50, 8);
                bg.lineStyle(1, COLORS.primary, 0.4);
                bg.strokeRoundedRect(-80, -25, 160, 50, 8);
            }

            const label = this.add.text(-60, 0, item.label, {
                fontSize: '15px',
                fontFamily: 'Inter',
                color: isActive ? '#ffffff' : '#888888',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0, 0.5);

            // 交互区域
            const hitArea = this.add.rectangle(0, 0, 160, 50, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });

            container.add([bg, label, hitArea]);

            hitArea.on('pointerover', () => {
                if (this.currentTab !== item.key) {
                    bg.clear();
                    bg.fillStyle(0xffffff, 0.05);
                    bg.fillRoundedRect(-80, -25, 160, 50, 8);
                    label.setColor('#ffffff');
                }
            });

            hitArea.on('pointerout', () => {
                if (this.currentTab !== item.key) {
                    bg.clear();
                    label.setColor('#888888');
                }
            });

            hitArea.on('pointerdown', () => {
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
            const bg = container.list[0] as Phaser.GameObjects.Graphics;
            const label = container.list[1] as Phaser.GameObjects.Text;

            bg.clear();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 0.2);
                bg.fillRoundedRect(-80, -25, 160, 50, 8);
                bg.lineStyle(1, COLORS.primary, 0.4);
                bg.strokeRoundedRect(-80, -25, 160, 50, 8);
            }
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
        const title = this.add.text(0, -300, '热门职位', TEXT_STYLES.h2);
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        const totalPages = Math.ceil(jobs.length / this.jobsPerPage);
        const startIdx = this.jobListPage * this.jobsPerPage;
        const pageJobs = jobs.slice(startIdx, startIdx + this.jobsPerPage);

        // 职位列表 - Bento Style
        pageJobs.forEach((job, index) => {
            const company = companies.find(c => c.id === job.companyId);
            if (!company) return;

            // Increase card height (120px) and spacing (SPACING.cardGap = 24px)
            // Start higher to center 4 items better
            const cardHeight = 120;
            const y = -200 + index * (cardHeight + SPACING.cardGap);

            // 职位卡片容器
            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景 (磨砂玻璃卡片 - Lighter for visibility)
            // Use lighter alpha (0.6) and lighter fill to pop against dark BG
            const bg = this.add.rectangle(0, 0, 840, cardHeight, COLORS.bgCard, 0.6);
            bg.setStrokeStyle(2, COLORS.primary, 0.3); // Thicker, brighter border

            // Stronger Shadow
            const shadow = this.add.rectangle(6, 6, 840, cardHeight, 0x000000, 0.6);
            cardContainer.add(shadow);
            cardContainer.add(bg);

            // 公司名 (Top Left)
            const companyName = this.add.text(-390, -35, company.name.toUpperCase(), {
                fontSize: '12px',
                fontFamily: FONTS.mono,
                color: '#06b6d4', // Fixed: COLORS.accent -> string
                letterSpacing: 1
            });
            cardContainer.add(companyName);

            // 职位名 (Main Title)
            const jobTitle = this.add.text(-390, -5, job.title, {
                fontSize: '22px',
                fontFamily: FONTS.main,
                color: '#ffffff', // Fixed: COLORS.textMain -> string
                fontStyle: 'bold'
            });
            cardContainer.add(jobTitle);

            // 薪资 (Top Right)
            const salary = this.add.text(390, -35,
                `¥${(job.salaryRange[0] / 1000).toFixed(0)}k - ${(job.salaryRange[1] / 1000).toFixed(0)}k`, {
                fontSize: '20px',
                fontFamily: FONTS.mono,
                color: '#10b981', // Fixed: COLORS.success -> string
                fontStyle: 'bold'
            }).setOrigin(1, 0); // Align Right
            cardContainer.add(salary);

            // 要求 (Below Title)
            const reqs = this.add.text(-390, 25, `${job.experience}  •  ${job.education}`, {
                fontSize: '14px',
                fontFamily: FONTS.main,
                color: '#c0c0c6' // Fixed: COLORS.textSecondary -> string
            });
            cardContainer.add(reqs);

            // 标签系统 (Right Side, Bottom)
            let tagX = 150;
            const createTag = (text: string, color: number) => {
                const tagBg = this.add.rectangle(tagX, 25, 60, 24, color, 0.15);
                tagBg.setStrokeStyle(1, color, 0.4);
                const tagText = this.add.text(tagX, 25, text, {
                    fontSize: '11px',
                    fontFamily: FONTS.main,
                    color: '#ffffff', // Fixed: Always white text for tags
                    padding: { x: 6, y: 3 }
                }).setOrigin(0.5);

                const tagWidth = Math.max(60, tagText.width + 16);
                tagBg.width = tagWidth;

                cardContainer.add([tagBg, tagText]);
                tagX += tagWidth + 12;
            };

            const typeColors: { [key: string]: number } = {
                'large': COLORS.primary,
                'foreign': COLORS.accent,
                'startup': COLORS.warning,
                'mid': COLORS.textSecondary,
                'state': COLORS.danger
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

            // 投递按钮 (Absolute Right Bottom)
            const applications = jobHuntSystem.getApplications();
            const hasApplied = applications.some(app => app.jobId === job.id);

            const btnText = hasApplied ? '✓ 已投递' : '投递简历';
            const btnColor = hasApplied ? COLORS.borderMedium : COLORS.primary;

            // Larger button target
            const applyBtnBg = this.add.rectangle(350, 25, 120, 44, btnColor, hasApplied ? 0.2 : 1);
            if (!hasApplied) applyBtnBg.setStrokeStyle(0); // Solid fill for action

            const applyBtnText = this.add.text(350, 25, btnText, {
                fontSize: '15px',
                fontFamily: FONTS.main,
                color: hasApplied ? '#888888' : '#ffffff', // Fixed to strings
                fontStyle: 'bold'
            }).setOrigin(0.5);

            cardContainer.add([applyBtnBg, applyBtnText]);

            if (!hasApplied) {
                applyBtnBg.setInteractive({ useHandCursor: true });

                applyBtnBg.on('pointerover', () => {
                    applyBtnBg.setFillStyle(0x818cf8, 1); // Lighter Indigo
                    this.tweens.add({ targets: cardContainer, scaleX: 1.01, scaleY: 1.01, duration: 200, ease: 'Cubic.out' });
                });

                applyBtnBg.on('pointerout', () => {
                    applyBtnBg.setFillStyle(COLORS.primary, 1);
                    this.tweens.add({ targets: cardContainer, scaleX: 1, scaleY: 1, duration: 200, ease: 'Cubic.out' });
                });

                applyBtnBg.on('pointerdown', () => {
                    applyBtnText.setText('...');
                    this.applyJob(job);
                });
            }

            // 点击卡片背景查看详情
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerover', () => {
                bg.setStrokeStyle(1, COLORS.primary, 0.6);
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(1, COLORS.borderLight, 1);
            });
            bg.on('pointerdown', () => this.showJobDetail(job, company));
        });

        // 分页控制 (Moved down)
        this.createPaginationControls(totalPages);
    }

    private createPaginationControls(totalPages: number): void {
        const y = 280;
        const controlContainer = this.add.container(0, y);
        this.mainContent.add(controlContainer);

        // 页码信息
        const pageText = this.add.text(0, 0, `第 ${this.jobListPage + 1} / ${totalPages} 页`, {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5);
        controlContainer.add(pageText);

        // 上一页
        if (this.jobListPage > 0) {
            const prevBtn = createStyledButton(this, -120, 0, 100, 30, 'PREV', () => {
                this.jobListPage--;
                this.refreshContent();
            });
            controlContainer.add(prevBtn);
        }

        // 下一页
        if (this.jobListPage < totalPages - 1) {
            const nextBtn = createStyledButton(this, 120, 0, 100, 30, 'NEXT', () => {
                this.jobListPage++;
                this.refreshContent();

                // 预加载逻辑
                const jobs = jobHuntSystem.getJobPositions();
                const currentPoolEnd = (this.jobListPage + 1) * this.jobsPerPage;
                if (currentPoolEnd >= jobs.length - 2) {
                    jobHuntSystem.fetchMoreJobs();
                }
            });
            controlContainer.add(nextBtn);
        } else if (jobHuntSystem.isFetching()) {
            const loadingText = this.add.text(120, 0, 'AI 生成中...', {
                fontSize: '12px',
                color: '#4a90d9'
            }).setOrigin(0.5);
            controlContainer.add(loadingText);
        } else if (totalPages > 0) {
            // 在最后一页也可以尝试触发加载更多（如果总数还很少）
            const jobs = jobHuntSystem.getJobPositions();
            if (jobs.length < 50) { // 设定一个合理的人工上限
                const moreBtn = createStyledButton(this, 120, 0, 100, 30, 'REFRESH', async () => {
                    // 显示加载状态
                    this.refreshContent();
                    // 等待 AI 生成完成
                    await jobHuntSystem.fetchMoreJobs();
                    // 刷新列表
                    this.refreshContent();
                });
                controlContainer.add(moreBtn);
            }
        }
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
        // 监听求职系统事件
        jobHuntSystem.onEvent((event, data) => {
            if (event === 'jobs_updated' && this.currentTab === 'jobs') {
                this.refreshContent();
            }
        });

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
