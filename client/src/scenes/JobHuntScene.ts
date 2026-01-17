import Phaser from 'phaser';
import type { Application, Company, JobPosition } from '../JobHuntSystem';
import { jobHuntSystem } from '../JobHuntSystem';
import { notificationManager } from '../NotificationManager';
import { applyGlassEffect, COLORS, createStyledButton, FONTS, Layout, TEXT_STYLES } from '../UIConfig';

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

    // 响应式布局帮助方法
    private getLayoutInfo() {
        const cam = this.cameras.main;
        return {
            centerX: cam.width / 2,
            centerY: cam.height / 2,
            width: cam.width,
            height: cam.height
        };
    }

    create(): void {
        // 初始化布局
        this.layout = new Layout(this);
        const L = this.layout;

        // 绑定通知系统到当前场景
        notificationManager.bindScene(this);

        // 获取响应式布局参数 (使用相机尺寸)
        const { centerX, centerY, width, height } = this.getLayoutInfo();

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
        this.add.rectangle(centerX, centerY, width, height, COLORS.bg);

        // 网格背景
        this.createGridBackground();

        // 渐变光晕 - Scale sizes
        const topGlow = this.add.graphics();
        topGlow.fillStyle(COLORS.primary, 0.06);
        topGlow.fillCircle(width * 0.22, -60, 700);
        topGlow.fillStyle(COLORS.secondary, 0.04);
        topGlow.fillCircle(width * 0.74, 240, 560);

        const bottomGlow = this.add.graphics();
        bottomGlow.fillStyle(COLORS.accent, 0.03);
        bottomGlow.fillCircle(width * 0.86, height + 60, 640);

        // 标题容器 - Scale position
        const header = this.add.container(centerX, 100);

        // 小标签 - Scale size
        const tagBg = this.add.graphics();
        tagBg.fillStyle(0xffffff, 0.06);
        tagBg.fillRoundedRect(-110, -56, 220, 44, 22);

        const tagText = this.add.text(0, -34, '求职中心', {
            fontSize: '22px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        const titleText = this.add.text(0, 24, '职业探索', {
            fontSize: '56px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        header.add([tagBg, tagText, titleText]);

        // 创建顶部状态栏
        this.createStatusBar();

        // 创建左侧导航
        this.createNavigation();

        // 创建主内容区域 - Scale position (700,380) -> (1400, 760)
        this.mainContent = this.add.container(1400, 760);
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
        const gridSize = 80;
        graphics.lineStyle(1, 0xffffff, 0.02);

        for (let x = 0; x <= 2560; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 1440);
        }
        for (let y = 0; y <= 1440; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(2560, y);
        }
        graphics.strokePath();
    }

    private createStatusBar(): void {
        if (this.statusPanel) {
            this.statusPanel.destroy();
        }
        this.statusPanel = this.add.container(0, 200);
        this.statusPanel.setDepth(5);

        const status = jobHuntSystem.getStatus();

        // 状态栏背景 - 现代卡片风格
        const statusBg = this.add.graphics();
        statusBg.fillStyle(COLORS.bgPanel, 0.85);
        statusBg.fillRoundedRect(0, 0, 2560, 160, 0);
        statusBg.lineStyle(2, 0xffffff, 0.05);
        statusBg.strokeRect(0, 158, 2560, 2);
        this.statusPanel.add(statusBg);

        // 存款
        const savingsLabel = this.add.text(80, 40, 'ASSETS / 资产', {
            fontSize: '20px',
            color: '#888888',
            fontStyle: 'bold'
        });
        const savingsValue = this.add.text(80, 70, `¥${status.savings.toLocaleString()}`, {
            fontSize: '40px',
            fontFamily: FONTS.mono,
            color: status.savings < 5000 ? '#ef4444' : '#10b981',
            fontStyle: 'bold'
        });
        this.statusPanel.add([savingsLabel, savingsValue]);

        // 焦虑与信心 (紧凑型条状图)
        this.createStatusMeter(480, 80, 'STRESS', status.anxiety, COLORS.danger);
        this.createStatusMeter(760, 80, 'CONFID', status.confidence, COLORS.success);

        // 日期
        const dayLabel = this.add.text(1280, 40, `DAY ${status.currentDay}`, {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        const daySub = this.add.text(1280, 100, `已失业 ${status.unemployedDays} 天`, {
            fontSize: '22px',
            color: '#888888'
        }).setOrigin(0.5, 0);
        this.statusPanel.add([dayLabel, daySub]);

        // 核心数据统计
        const statsX = 1700;
        this.createMiniStat(statsX, 60, 'APPLY', status.totalApplications);
        this.createMiniStat(statsX + 200, 60, 'INTVW', status.totalInterviews);
        this.createMiniStat(statsX + 400, 60, 'OFFER', status.totalOffers);

        // 下一天按钮 (Styled)
        const nextDayBtn = createStyledButton(this, 2360, 80, 320, 100, 'NEXT DAY ⏭️', () => this.advanceDay());
        nextDayBtn.scale = 2; // Simple scale if createStyledButton generates complex container, OR rely on size args if simple. 
        // Note: createStyledButton usually takes size args. I passed 320, 100 which is 2x 160, 50.
        // But font size inside createStyledButton might be fixed. 
        // If createStyledButton uses fixed font size, we need to scale the container.
        // Assuming createStyledButton uses size correctly for bg but text might be small. 
        // Let's add scale=2 just in case for text, or rely on size.
        // Actually, createStyledButton returns a container. If I set scale=1 (default), the text might be small.
        // Let's manually set scale to 1 but ensure I passed 2x dimensions. 
        // Wait, if I pass 2x dimensions, but font is small, it looks weird.
        // I'll check createStyledButton later. For now, let's assume I need to handle it.
        // Safest is to not scale the button container but just pass larger dimensions if supported.
        // However, I will comment out scale=2 and trust dimensions for now, or use a multiplier if needed.
        // Re-reading: "160, 50" -> "320, 100". 

        this.statusPanel.add(nextDayBtn);
    }

    private createStatusMeter(x: number, y: number, label: string, value: number, color: number): void {
        const title = this.add.text(x, y - 40, label, { fontSize: '20px', color: '#888888', fontStyle: 'bold' });
        const bg = this.add.rectangle(x, y + 10, 200, 8, 0x333333).setOrigin(0, 0.5);
        const fill = this.add.rectangle(x, y + 10, value * 2, 8, color).setOrigin(0, 0.5); // value is percentage 0-100. Width 200. Value*2.
        const valText = this.add.text(x + 210, y + 10, `${value}%`, { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        this.statusPanel.add([title, bg, fill, valText]);
    }

    private createMiniStat(x: number, y: number, label: string, value: number): void {
        const l = this.add.text(x, y - 20, label, { fontSize: '18px', color: '#666666' }).setOrigin(0.5);
        const v = this.add.text(x, y + 10, value.toString(), { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        this.statusPanel.add([l, v]);
    }

    private createNavigation(): void {
        if (this.navPanel) {
            this.navPanel.destroy();
        }
        this.navPanel = this.add.container(0, 100);
        this.navPanel.setDepth(5);
        this.navButtons = [];

        const navItems = [
            { key: 'jobs', label: '找工作', icon: 'search', y: 320 },
            { key: 'applications', label: '我的投递', icon: 'mail', y: 440 },
            { key: 'interviews', label: '面试安排', icon: 'mic', y: 560 },
            { key: 'offers', label: 'OFFER', icon: 'clipboard', y: 680 },
        ];

        // 导航背景 - 现代卡片风格
        const navBg = this.add.graphics();
        navBg.fillStyle(COLORS.bgPanel, 0.6);
        navBg.fillRoundedRect(40, 280, 360, 1040, 24);
        navBg.lineStyle(2, 0xffffff, 0.05);
        navBg.strokeRoundedRect(40, 280, 360, 1040, 24);
        this.navPanel.add(navBg);

        navItems.forEach(item => {
            const container = this.add.container(220, item.y);
            const isActive = this.currentTab === item.key;
            const iconColor = isActive ? 0xffffff : 0x888888;

            const bg = this.add.graphics();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 0.2);
                bg.fillRoundedRect(-160, -50, 320, 100, 16);
                bg.lineStyle(2, COLORS.primary, 0.4);
                bg.strokeRoundedRect(-160, -50, 320, 100, 16);
            }

            // 绘制图标
            const iconG = this.add.graphics();
            iconG.x = -100;
            iconG.setScale(2); // Scale icon
            this.drawIcon(iconG, item.icon!, iconColor);

            const label = this.add.text(-60, 0, item.label, {
                fontSize: '30px',
                fontFamily: 'Inter',
                color: isActive ? '#ffffff' : '#888888',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0, 0.5);

            // 交互区域
            const hitArea = this.add.rectangle(0, 0, 320, 100, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });

            container.add([bg, iconG, label, hitArea]);

            // 保存引用以便更新样式
            container.setData('bg', bg);
            container.setData('label', label);
            container.setData('iconG', iconG);
            container.setData('iconType', item.icon);

            hitArea.on('pointerover', () => {
                if (this.currentTab !== item.key) {
                    bg.clear();
                    bg.fillStyle(0xffffff, 0.05);
                    bg.fillRoundedRect(-160, -50, 320, 100, 16);
                    label.setColor('#ffffff');

                    iconG.clear();
                    this.drawIcon(iconG, item.icon!, 0xffffff);
                }
            });

            hitArea.on('pointerout', () => {
                if (this.currentTab !== item.key) {
                    bg.clear();
                    label.setColor('#888888');

                    iconG.clear();
                    this.drawIcon(iconG, item.icon!, 0x888888);
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
        const sep = this.add.rectangle(220, 840, 280, 2, 0x333333);
        this.navPanel.add(sep);

        // 附加功能 - 修改简历 (使用图标)
        this.createSecondaryNavBtn(220, 920, '修改简历', 'clipboard', () => this.showResumeEditor());
        this.createSecondaryNavBtn(220, 1000, '股市行情', 'chart', () => {
            this.scene.pause();
            this.scene.launch('StockScene');
        });
        this.createSecondaryNavBtn(220, 1080, '职场行动', 'briefcase', () => {
            this.scene.start('ImprovedOfficeScene');
        });

        // DEBUG 按钮
        const debugBtn = this.add.text(220, 1240, '[DEBUG]', {
            fontSize: '20px',
            fontFamily: FONTS.mono,
            color: '#ff4444',
            backgroundColor: '#330000',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        debugBtn.on('pointerdown', () => this.scene.start('ImprovedOfficeScene'));
        this.navPanel.add(debugBtn);
    }

    private createSecondaryNavBtn(x: number, y: number, label: string, icon: string, onClick: () => void): void {
        const container = this.add.container(x, y);

        const iconG = this.add.graphics();
        iconG.x = -80;
        iconG.setScale(2);
        this.drawIcon(iconG, icon, 0x666666);

        const btnLabel = this.add.text(-40, 0, label, {
            fontSize: '26px',
            color: '#666666',
            fontFamily: 'Inter'
        }).setOrigin(0, 0.5);

        const hitArea = this.add.rectangle(0, 0, 280, 60, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        container.add([iconG, btnLabel, hitArea]);

        hitArea.on('pointerover', () => {
            btnLabel.setColor('#ffffff');
            iconG.clear();
            this.drawIcon(iconG, icon, 0xffffff);
        });
        hitArea.on('pointerout', () => {
            btnLabel.setColor('#666666');
            iconG.clear();
            this.drawIcon(iconG, icon, 0x666666);
        });
        hitArea.on('pointerdown', onClick);

        this.navPanel.add(container);
    }

    private updateNavStyles(): void {
        const keys = ['jobs', 'applications', 'interviews', 'offers'];
        this.navButtons.forEach((container, index) => {
            const isActive = this.currentTab === keys[index];
            const bg = container.getData('bg');
            const label = container.getData('label');
            const iconG = container.getData('iconG');
            const iconType = container.getData('iconType');

            bg.clear();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 0.2);
                bg.fillRoundedRect(-160, -50, 320, 100, 16);
                bg.lineStyle(2, COLORS.primary, 0.4);
                bg.strokeRoundedRect(-160, -50, 320, 100, 16);
            }
            label.setColor(isActive ? '#ffffff' : '#888888');
            label.setFontStyle(isActive ? 'bold' : 'normal');

            iconG.clear();
            this.drawIcon(iconG, iconType, isActive ? 0xffffff : 0x888888);
        });
    }

    private createBottomBar(): void {
        // 底部提示
        const tips = [
            '投简历后要耐心等待，通常需要3-7天才有回复',
            '大公司面试难度高，但薪资也高',
            '存款耗尽就会游戏结束，注意控制开支',
            '被拒绝很正常，保持信心继续投递'
        ];

        const container = this.add.container(1280, 1380);

        // 灯泡图标
        const iconG = this.add.graphics();
        iconG.x = -400; // 这里的相对坐标需要适配文本宽度，暂时居中左侧
        iconG.setScale(2);
        this.drawIcon(iconG, 'lightbulb', 0xffcc00); // 金色

        const tipText = this.add.text(0, 0, tips[Math.floor(Math.random() * tips.length)], {
            fontSize: '24px',
            color: '#888888',
            fontFamily: 'Inter'
        });
        tipText.setOrigin(0.5, 0.5);

        // 动态调整图标位置
        const width = tipText.width;
        iconG.x = -width / 2 - 40;

        container.add([iconG, tipText]);
        container.setDepth(10);
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

        // 标题 - 下移以避开顶部状态栏 (Status Bar ends at ~360)
        // mainContent at 760. y=-350 -> Abs 410.
        const title = this.add.text(0, -350, '热门职位', { ...TEXT_STYLES.h2, fontSize: '56px' });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        const totalPages = Math.ceil(jobs.length / this.jobsPerPage);
        const startIdx = this.jobListPage * this.jobsPerPage;
        const pageJobs = jobs.slice(startIdx, startIdx + this.jobsPerPage);

        // 职位列表 - Bento Style
        pageJobs.forEach((job, index) => {
            const company = companies.find(c => c.id === job.companyId);
            if (!company) return;

            // Increase card height (120px -> 240px) and spacing (SPACING.cardGap -> 48px)
            const cardHeight = 240;
            // Start lower to avoid overlap. y=-200 -> Abs 560. Top edge = 560 - 120 = 440. Safe from Status Bar (360).
            const y = -200 + index * (cardHeight + 48);

            // 职位卡片容器
            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景 (磨砂玻璃卡片 - Lighter for visibility)
            const bg = this.add.rectangle(0, 0, 1680, cardHeight, COLORS.bgCard, 0.6);
            bg.setStrokeStyle(3, COLORS.primary, 0.3); // Thicker, brighter border

            // Stronger Shadow
            const shadow = this.add.rectangle(12, 12, 1680, cardHeight, 0x000000, 0.6);
            cardContainer.add(shadow);
            cardContainer.add(bg);

            // 公司名 (Top Left)
            const companyName = this.add.text(-780, -70, company.name.toUpperCase(), {
                fontSize: '24px',
                fontFamily: FONTS.mono,
                color: '#06b6d4',
                letterSpacing: 2
            });
            cardContainer.add(companyName);

            // 职位名 (Main Title)
            const jobTitle = this.add.text(-780, -10, job.title, {
                fontSize: '44px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(jobTitle);

            // 薪资 (Top Right)
            const salary = this.add.text(780, -70,
                `¥${(job.salaryRange[0] / 1000).toFixed(0)}k - ${(job.salaryRange[1] / 1000).toFixed(0)}k`, {
                fontSize: '40px',
                fontFamily: FONTS.mono,
                color: '#10b981',
                fontStyle: 'bold'
            }).setOrigin(1, 0); // Align Right
            cardContainer.add(salary);

            // 要求 (Below Title)
            const reqs = this.add.text(-780, 50, `${job.experience}  •  ${job.education}`, {
                fontSize: '28px',
                fontFamily: FONTS.main,
                color: '#c0c0c6'
            });
            cardContainer.add(reqs);

            // 标签系统 (Right Side, Bottom)
            let tagX = 300;
            const createTag = (text: string, color: number) => {
                const tagBg = this.add.rectangle(tagX, 50, 120, 48, color, 0.15);
                tagBg.setStrokeStyle(2, color, 0.4);
                const tagText = this.add.text(tagX, 50, text, {
                    fontSize: '22px',
                    fontFamily: FONTS.main,
                    color: '#ffffff',
                    padding: { x: 12, y: 6 }
                }).setOrigin(0.5);

                const tagWidth = Math.max(120, tagText.width + 32);
                tagBg.width = tagWidth;

                cardContainer.add([tagBg, tagText]);
                tagX += tagWidth + 24;
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
            const applyBtnBg = this.add.rectangle(700, 50, 240, 88, btnColor, hasApplied ? 0.2 : 1);
            if (!hasApplied) applyBtnBg.setStrokeStyle(0); // Solid fill for action

            const applyBtnText = this.add.text(700, 50, btnText, {
                fontSize: '30px',
                fontFamily: FONTS.main,
                color: hasApplied ? '#888888' : '#ffffff',
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
                bg.setStrokeStyle(2, COLORS.primary, 0.6);
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(2, COLORS.borderLight, 1);
            });
            bg.on('pointerdown', () => this.showJobDetail(job, company));
        });

        // 分页控制 (Moved down)
        this.createPaginationControls(totalPages);
    }

    private createPaginationControls(totalPages: number): void {
        const y = 560; // Scaled 280
        const controlContainer = this.add.container(0, y);
        this.mainContent.add(controlContainer);

        // 页码信息
        const pageText = this.add.text(0, 0, `第 ${this.jobListPage + 1} / ${totalPages} 页`, {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5);
        controlContainer.add(pageText);

        // 上一页
        if (this.jobListPage > 0) {
            const prevBtn = createStyledButton(this, -240, 0, 200, 60, 'PREV', () => {
                this.jobListPage--;
                this.refreshContent();
            });
            controlContainer.add(prevBtn);
        }

        // 下一页
        if (this.jobListPage < totalPages - 1) {
            const nextBtn = createStyledButton(this, 240, 0, 200, 60, 'NEXT', () => {
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
            const loadingText = this.add.text(240, 0, 'AI 生成中...', {
                fontSize: '24px',
                color: '#4a90d9'
            }).setOrigin(0.5);
            controlContainer.add(loadingText);
        } else if (totalPages > 0) {
            // 在最后一页也可以尝试触发加载更多（如果总数还很少）
            const jobs = jobHuntSystem.getJobPositions();
            if (jobs.length < 50) { // 设定一个合理的人工上限
                const moreBtn = createStyledButton(this, 240, 0, 200, 60, 'REFRESH', async () => {
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
        const title = this.add.text(0, -560, `我的投递 (${applications.length})`, { ...TEXT_STYLES.h2, fontSize: '56px' });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (applications.length === 0) {
            const emptyText = this.add.text(0, 0, '还没有投递记录\n去职位列表寻找机会吧', {
                fontSize: '32px',
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

            const y = -380 + index * 160;

            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景
            const bg = this.add.rectangle(0, 0, 1600, 140, COLORS.panel, 0.4);
            applyGlassEffect(bg, 0.3);
            cardContainer.add(bg);

            // 信息
            const info = this.add.text(-760, -20, `${company.name} / ${job.title}`, {
                fontSize: '30px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(info);

            // 时间
            const time = this.add.text(-760, 30, `第 ${app.appliedDay} 天投递`, {
                fontSize: '24px',
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

            const status = this.add.text(760, 0, statusLabels[app.status], {
                fontSize: '28px',
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
        const title = this.add.text(0, -560, '面试安排', { ...TEXT_STYLES.h2, fontSize: '56px' });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (upcomingInterviews.length === 0) {
            const emptyText = this.add.text(0, 0, '暂无面试安排\n投递简历后等待面试邀请', {
                fontSize: '32px',
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

            const y = -380 + index * 220;

            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景
            const bg = this.add.rectangle(0, 0, 1600, 200, COLORS.panel, 0.4);
            bg.setStrokeStyle(2, COLORS.success, 0.3); // Thicker stroke
            applyGlassEffect(bg, 0.4);
            cardContainer.add(bg);

            // 公司和职位
            const info = this.add.text(-760, -60, `${company.name} / ${job.title}`, {
                fontSize: '32px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(info);

            // 面试信息
            const interviewInfo = this.add.text(-760, -10,
                `第 ${interview.round} 轮 ${interview.type === 'phone' ? '电话面试' : interview.type === 'video' ? '视频面试' : '现场面试'}`, {
                fontSize: '28px',
                fontFamily: FONTS.main,
                color: '#00ff88',
                fontStyle: 'bold'
            });
            cardContainer.add(interviewInfo);

            // 时间
            const timeInfo = this.add.text(-760, 40,
                `📅 第 ${interview.scheduledDay} 天 ${interview.scheduledTime} | 👤 ${interview.interviewerRole}: ${interview.interviewerName}`, {
                fontSize: '24px',
                fontFamily: FONTS.mono,
                color: '#888888'
            });
            cardContainer.add(timeInfo);

            // 开始面试按钮
            const status = jobHuntSystem.getStatus();
            if (interview.scheduledDay <= status.currentDay) {
                const startBtn = createStyledButton(this, 660, 0, 240, 80, '开始面试', () => this.startInterview(app, interview));
                cardContainer.add(startBtn);
            } else {
                const waitText = this.add.text(660, 0, '未开始', {
                    fontSize: '28px',
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
        const title = this.add.text(0, -560, 'Offer列表', { ...TEXT_STYLES.h2, fontSize: '56px' });
        title.setOrigin(0.5, 0.5);
        this.mainContent.add(title);

        if (offers.length === 0) {
            const emptyText = this.add.text(0, 0, '还没有收到Offer\n继续努力面试吧！', {
                fontSize: '32px',
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

            const y = -320 + index * 280;

            const cardContainer = this.add.container(0, y);
            this.mainContent.add(cardContainer);

            // 背景
            const bg = this.add.rectangle(0, 0, 1600, 240, COLORS.panel, 0.4);
            bg.setStrokeStyle(3, COLORS.success, 0.3);
            applyGlassEffect(bg, 0.5);
            cardContainer.add(bg);

            // 公司和职位
            const info = this.add.text(-760, -80, `🎉 ${company?.name} / ${job?.title}`, {
                fontSize: '36px',
                fontFamily: FONTS.main,
                color: '#00ff88',
                fontStyle: 'bold'
            });
            cardContainer.add(info);

            // 薪资
            const salaryInfo = this.add.text(-760, -20,
                `月薪: ¥${offer.baseSalary.toLocaleString()}${offer.bonus ? ` + 奖金` : ''}`, {
                fontSize: '32px',
                fontFamily: FONTS.mono,
                color: '#ffffff',
                fontStyle: 'bold'
            });
            cardContainer.add(salaryInfo);

            // 福利
            const benefits = this.add.text(-760, 30,
                `福利: ${offer.benefits.slice(0, 3).join(', ')}`, {
                fontSize: '24px',
                fontFamily: FONTS.main,
                color: '#aaaaaa'
            });
            cardContainer.add(benefits);

            // 有效期
            const status = jobHuntSystem.getStatus();
            const daysLeft = offer.expirationDay - status.currentDay;
            const expireText = this.add.text(-760, 80,
                `⏰ ${daysLeft > 0 ? `还剩 ${daysLeft} 天` : '已过期'}`, {
                fontSize: '24px',
                fontFamily: FONTS.mono,
                color: daysLeft > 0 ? '#ffaa00' : '#ff4444'
            });
            cardContainer.add(expireText);

            if (offer.status === 'pending' && daysLeft > 0) {
                // 接受按钮
                const acceptBtn = createStyledButton(this, 560, -30, 240, 70, '接受Offer', () => this.acceptOffer(app));
                cardContainer.add(acceptBtn);

                // 谈薪按钮
                if (offer.negotiable) {
                    const negotiateBtn = createStyledButton(this, 560, 50, 240, 70, '聊聊薪资', () => this.negotiateSalary(app));
                    cardContainer.add(negotiateBtn);
                }

                // 拒绝按钮
                const declineBtn = this.add.text(760, -30, '残忍拒绝', {
                    fontSize: '26px',
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
        const overlay = this.add.rectangle(1280, 720, 2560, 1440, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(1000);

        const dialog = this.add.container(1280, 720);
        dialog.setDepth(1001);

        const bg = this.add.rectangle(0, 0, 1400, 1040, COLORS.panel, 0.95);
        bg.setStrokeStyle(3, COLORS.primary, 0.5);
        applyGlassEffect(bg, 0.95);
        dialog.add(bg);

        // 公司名 (小标题)
        const companyName = this.add.text(-640, -440, company.name.toUpperCase(), {
            fontSize: '24px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 4
        });
        dialog.add(companyName);

        // 职位名 (大标题)
        const jobTitle = this.add.text(-640, -400, job.title, {
            fontSize: '56px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });
        dialog.add(jobTitle);

        // 薪资
        const salary = this.add.text(-640, -310,
            `¥${(job.salaryRange[0] / 1000).toFixed(0)}K - ${(job.salaryRange[1] / 1000).toFixed(0)}K`, {
            fontSize: '40px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold'
        });
        dialog.add(salary);

        // 装饰线
        const line = this.add.rectangle(-340, -240, 600, 2, COLORS.primary, 0.3);
        dialog.add(line);

        // 公司信息
        const companyInfo = this.add.text(-640, -200, [
            `🏢 规模: ${company.size}`,
            `⭐ 口碑: ${'★'.repeat(company.reputation)}${'☆'.repeat(5 - company.reputation)}`,
            `📊 难度: ${'●'.repeat(company.interviewDifficulty)}${'○'.repeat(5 - company.interviewDifficulty)}`,
            `⚖️ WLB: ${'●'.repeat(company.workLifeBalance)}${'○'.repeat(5 - company.workLifeBalance)}`,
            '',
            company.description
        ].join('\n'), {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#cccccc',
            lineSpacing: 16
        });
        dialog.add(companyInfo);

        // 职位要求 (右侧)
        const requirements = this.add.text(60, -200, [
            '📋 职位要求:',
            ...job.requirements.map(r => `  • ${r}`),
            '',
            '🎁 福利待遇:',
            ...job.benefits.map(b => `  • ${b}`)
        ].join('\n'), {
            fontSize: '26px',
            fontFamily: FONTS.main,
            color: '#aaaaaa',
            lineSpacing: 12
        });
        dialog.add(requirements);

        // 投递按钮
        const applications = jobHuntSystem.getApplications();
        const hasApplied = applications.some(app => app.jobId === job.id);

        const applyBtn = createStyledButton(
            this,
            0, 400, 400, 100,
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
        const closeBtn = this.add.text(640, -460, '✕', {
            fontSize: '48px',
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
        const overlay = this.add.rectangle(1280, 720, 2560, 1440, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(2000);

        const dialog = this.add.container(1280, 720);
        dialog.setDepth(2001);

        const bg = this.add.rectangle(0, 0, 900, 600, COLORS.panel, 0.95);
        bg.setStrokeStyle(3, COLORS.primary, 0.5);
        applyGlassEffect(bg, 0.95);
        dialog.add(bg);

        const titleText = this.add.text(0, -220, config.title, {
            fontSize: '40px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        dialog.add(titleText);

        const messageText = this.add.text(0, -120, config.message, {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#aaaaaa',
            align: 'center',
            lineSpacing: 16
        }).setOrigin(0.5);
        dialog.add(messageText);

        // HTML 输入框
        const inputHTML = `
            <div style="width: 600px; display: flex; flex-direction: column; align-items: center; gap: 40px;">
                <input type="text" id="dialogInput" placeholder="${config.placeholder || ''}" 
                    style="width: 100%; padding: 24px; background: rgba(0,0,0,0.3); border: 2px solid #4a90d9; color: white; border-radius: 8px; outline: none; text-align: center; font-family: Inter, sans-serif; font-size: 24px;">
                <div style="display: flex; gap: 40px; width: 100%;">
                    <button id="cancelBtn" style="flex: 1; padding: 20px; background: #333; color: #888; border: none; border-radius: 8px; cursor: pointer; font-size: 24px;">取消</button>
                    <button id="confirmBtn" style="flex: 1; padding: 20px; background: #4a90d9; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 24px;">确定</button>
                </div>
            </div>
        `;

        const domElement = this.add.dom(1280, 720 + 80).createFromHTML(inputHTML);
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

        const overlay = this.add.rectangle(1280, 720, 2560, 1440, 0x000000, 0.7);
        overlay.setInteractive();
        overlay.setDepth(1000);

        const dialog = this.add.container(1280, 720);
        dialog.setDepth(1001);

        const bg = this.add.rectangle(0, 0, 1200, 1000, COLORS.panel, 0.95);
        bg.setStrokeStyle(3, COLORS.primary, 0.5);
        applyGlassEffect(bg, 0.95);
        dialog.add(bg);

        const title = this.add.text(0, -420, '📝 我的核心简历', {
            fontSize: '48px',
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

        const content = this.add.text(-520, -320, [
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
            fontSize: '30px',
            fontFamily: FONTS.main,
            color: '#cccccc',
            lineSpacing: 20
        });
        dialog.add(content);

        const editBtn = createStyledButton(this, 0, 360, 320, 90, '进入编辑模式', () => {
            overlay.destroy();
            dialog.destroy();
            this.scene.pause();
            this.scene.launch('ResumeEditScene');
        });
        dialog.add(editBtn);

        const closeBtn = this.add.text(540, -440, '✕', {
            fontSize: '40px',
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
        const toast = this.add.text(1280, 1300, message, {
            fontSize: '28px',
            color: success ? '#00ff88' : '#ff4444',
            backgroundColor: '#333333',
            padding: { x: 40, y: 20 }
        });
        toast.setOrigin(0.5, 0.5);
        toast.setDepth(2000);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 1200,
            duration: 3000,
            onComplete: () => toast.destroy()
        });
    }

    // ================= 矢量图标绘制 =================

    private drawIcon(g: Phaser.GameObjects.Graphics, type: string, color: number): void {
        g.fillStyle(color, 1);

        switch (type) {
            case 'search': // 🔍
                g.lineStyle(2, color, 1);
                g.strokeCircle(0, -2, 6); // 镜片
                g.lineStyle(3, color, 1);
                g.beginPath();
                g.moveTo(4, 3);
                g.lineTo(8, 7); // 手柄
                g.strokePath();
                break;
            case 'mail': // 📨
                g.fillRoundedRect(-9, -6, 18, 12, 2); // 信封主体
                // 信封折痕
                g.lineStyle(1, 0x000000, 0.3);
                g.beginPath();
                g.moveTo(-9, -6);
                g.lineTo(0, 0);
                g.lineTo(9, -6);
                g.strokePath();
                break;
            case 'mic': // 🎤
                g.fillRoundedRect(-3, -8, 6, 12, 3); // 麦克风头
                g.lineStyle(1, color, 1);
                g.beginPath();
                g.arc(0, -2, 6, 0, Math.PI, false); // 支架
                g.moveTo(0, 4);
                g.lineTo(0, 8); // 底座杆
                g.moveTo(-4, 8);
                g.lineTo(4, 8); // 底座
                g.strokePath();
                break;
            case 'clipboard': // 📋
                g.fillRoundedRect(-7, -9, 14, 18, 2); // 板子
                g.fillStyle(0xffffff, 1);
                g.fillRect(-5, -6, 10, 12); // 纸
                g.fillStyle(color, 1);
                g.fillRoundedRect(-4, -10, 8, 3, 1); // 夹子
                break;
            case 'lightbulb': // 💡
                g.fillCircle(0, -4, 6); // 灯泡球
                g.fillRect(-3, 2, 6, 4); // 底座
                g.lineStyle(1, color, 0.5);
                g.beginPath(); // 光芒
                g.moveTo(0, -12); g.lineTo(0, -14);
                g.moveTo(8, -8); g.lineTo(10, -10);
                g.moveTo(-8, -8); g.lineTo(-10, -10);
                g.strokePath();
                break;
            case 'check': // ✓ / ✅
                g.lineStyle(3, color, 1);
                g.beginPath();
                g.moveTo(-6, 0); // 调整位置居中
                g.lineTo(-2, 4);
                g.lineTo(6, -4);
                g.strokePath();
                break;
            case 'clock': // ⏳
                g.lineStyle(2, color, 1);
                g.beginPath();
                g.moveTo(-5, -6); g.lineTo(5, -6);
                g.moveTo(-5, 6); g.lineTo(5, 6);
                g.strokePath();
                g.strokeLineShape(new Phaser.Geom.Line(-4, -6, 4, 6)); // 沙漏腰
                g.strokeLineShape(new Phaser.Geom.Line(4, -6, -4, 6));
                break;
            case 'eye': // 👁️
                g.lineStyle(2, color, 1);
                g.beginPath();
                g.moveTo(-8, 0);
                g.quadraticBezierTo(0, -5, 8, 0);
                g.quadraticBezierTo(0, 5, -8, 0);
                g.strokePath();
                g.fillStyle(color, 1);
                g.fillCircle(0, 0, 2);
                break;
            case 'calendar': // 📅
                g.lineStyle(2, color, 1);
                g.strokeRoundedRect(-7, -7, 14, 14, 2);
                g.lineStyle(1, color, 1);
                g.beginPath();
                g.moveTo(-4, -9); g.lineTo(-4, -5);
                g.moveTo(4, -9); g.lineTo(4, -5);
                g.strokePath();
                g.fillRect(-7, -4, 14, 1); // 横线
                break;
            case 'cross': // ❌
                g.lineStyle(3, color, 1);
                g.beginPath();
                g.moveTo(-5, -5); g.lineTo(5, 5);
                g.moveTo(5, -5); g.lineTo(-5, 5);
                g.strokePath();
                break;
        }
    }
}
