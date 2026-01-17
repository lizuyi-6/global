import Phaser from 'phaser';
import { gameState } from '../GameState';
import { jobHuntSystem } from '../JobHuntSystem';
import { COLORS, FONTS, createStyledButton } from '../UIConfig';

/**
 * 现代风格着陆页 - 与 HTML 模板一致的设计语言
 * 参考: generated-page.html
 */
export class LandingScene extends Phaser.Scene {
    private floatingOrbs: Phaser.GameObjects.Arc[] = [];
    private gridGraphics?: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: 'LandingScene' });
    }

    create(): void {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // 纯黑背景
        this.add.rectangle(centerX, centerY, width, height, COLORS.bg);

        // 网格背景
        this.createGridBackground(width, height);

        // 渐变光晕
        this.createGradientGlows(width, height);

        // 浮动光球
        this.createFloatingOrbs(width, height);

        // 顶部装饰线
        this.createTopAccent(width);

        // 导航栏
        this.createNavBar(width);

        // Hero 区域
        this.createHeroSection(centerX, height);

        // 游戏界面预览 (3D 卡片)
        this.createGamePreview(centerX, height);

        // 入场动画
        this.playEntranceAnimations();

        // 监听窗口变化
        this.scale.on('resize', this.handleResize, this);
    }

    private handleResize(): void {
        this.scene.restart();
    }

    /**
     * 创建网格背景 - 与 HTML 模板一致
     */
    private createGridBackground(width: number, height: number): void {
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.setAlpha(0.3);

        const gridSize = 40;
        this.gridGraphics.lineStyle(1, 0xffffff, 0.02);

        // 垂直线
        for (let x = 0; x <= width; x += gridSize) {
            this.gridGraphics.moveTo(x, 0);
            this.gridGraphics.lineTo(x, height);
        }

        // 水平线
        for (let y = 0; y <= height; y += gridSize) {
            this.gridGraphics.moveTo(0, y);
            this.gridGraphics.lineTo(width, y);
        }

        this.gridGraphics.strokePath();

        // 渐变遮罩效果 - 中心可见，边缘淡出
        const mask = this.add.graphics();
        mask.fillStyle(COLORS.bg, 1);
        mask.fillRect(0, 0, width * 0.15, height);
        mask.fillRect(width * 0.85, 0, width * 0.15, height);
        mask.fillRect(0, 0, width, height * 0.1);
        mask.fillRect(0, height * 0.9, width, height * 0.1);
        mask.setAlpha(0.8);
    }

    /**
     * 创建渐变光晕
     */
    private createGradientGlows(width: number, height: number): void {
        const glowGraphics = this.add.graphics();

        // 顶部左侧 - 靛蓝光晕
        glowGraphics.fillStyle(COLORS.primary, 0.08);
        glowGraphics.fillCircle(width * 0.3, -50, 350);

        // 顶部右侧 - 紫色光晕
        glowGraphics.fillStyle(COLORS.secondary, 0.06);
        glowGraphics.fillCircle(width * 0.7, 100, 300);

        // 底部 - 靛蓝光晕
        glowGraphics.fillStyle(COLORS.primary, 0.05);
        glowGraphics.fillCircle(width * 0.5, height + 100, 400);

        // 呼吸动画
        this.tweens.add({
            targets: glowGraphics,
            alpha: { from: 1, to: 0.7 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 创建浮动光球
     */
    private createFloatingOrbs(width: number, height: number): void {
        const orbConfigs = [
            { x: width * 0.1, y: height * 0.3, size: 60, color: COLORS.primary, alpha: 0.04 },
            { x: width * 0.9, y: height * 0.2, size: 80, color: COLORS.secondary, alpha: 0.03 },
            { x: width * 0.15, y: height * 0.75, size: 50, color: COLORS.accent, alpha: 0.05 },
            { x: width * 0.85, y: height * 0.7, size: 70, color: COLORS.primary, alpha: 0.03 }
        ];

        orbConfigs.forEach((config, i) => {
            const orb = this.add.circle(config.x, config.y, config.size, config.color, config.alpha);
            this.floatingOrbs.push(orb);

            this.tweens.add({
                targets: orb,
                x: config.x + Phaser.Math.Between(-25, 25),
                y: config.y + Phaser.Math.Between(-15, 15),
                duration: 5000 + i * 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    /**
     * 顶部装饰渐变线
     */
    private createTopAccent(width: number): void {
        const line = this.add.graphics();
        line.fillGradientStyle(0x000000, COLORS.primary, COLORS.primary, 0x000000, 0, 0.3, 0.3, 0);
        line.fillRect(0, 0, width, 1);
    }

    /**
     * 导航栏 - 简约风格
     */
    private createNavBar(width: number): void {
        const navContainer = this.add.container(0, 0);
        navContainer.setAlpha(0);
        navContainer.setData('entrance', true);

        // 背景
        const navBg = this.add.rectangle(width / 2, 28, width, 56, COLORS.bg, 0.7);
        
        // 底部边框线
        const borderLine = this.add.rectangle(width / 2, 56, width, 1, 0xffffff, 0.05);

        // Logo
        const logoBg = this.add.graphics();
        logoBg.fillStyle(COLORS.primary, 0.15);
        logoBg.fillRoundedRect(20, 14, 28, 28, 6);
        logoBg.lineStyle(1, 0xffffff, 0.1);
        logoBg.strokeRoundedRect(20, 14, 28, 28, 6);

        const logoText = this.add.text(34, 28, '💼', {
            fontSize: '14px'
        }).setOrigin(0.5);

        const brandText = this.add.text(58, 28, 'CAREER', {
            fontSize: '12px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const brandSuffix = this.add.text(brandText.x + brandText.width + 2, 28, 'LIFE', {
            fontSize: '12px',
            fontFamily: FONTS.main,
            color: '#71717a'
        }).setOrigin(0, 0.5);

        // 右侧按钮
        const playBtn = createStyledButton(this, width - 70, 28, 90, 32, 'Play Demo', () => {
            this.startGame();
        }, 'primary');

        navContainer.add([navBg, borderLine, logoBg, logoText, brandText, brandSuffix, playBtn]);
    }

    /**
     * Hero 区域
     */
    private createHeroSection(centerX: number, height: number): void {
        const heroContainer = this.add.container(centerX, height * 0.28);
        heroContainer.setAlpha(0);
        heroContainer.setData('entrance', true);
        heroContainer.setData('delay', 100);

        // 版本标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(COLORS.primary, 0.1);
        tagBg.fillRoundedRect(-65, -90, 130, 24, 12);
        tagBg.lineStyle(1, COLORS.primary, 0.2);
        tagBg.strokeRoundedRect(-65, -90, 130, 24, 12);

        // 脉冲点
        const pulseCircle = this.add.circle(-50, -78, 4, COLORS.primary, 1);
        this.tweens.add({
            targets: pulseCircle,
            alpha: { from: 1, to: 0.4 },
            scale: { from: 1, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        const tagText = this.add.text(5, -78, 'Version 0.9 Beta', {
            fontSize: '10px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        // 主标题
        const title1 = this.add.text(0, -30, 'Simulate Reality.', {
            fontSize: '42px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 渐变副标题
        const title2 = this.add.text(0, 20, 'Master the Workplace.', {
            fontSize: '42px',
            fontFamily: FONTS.main,
            color: '#a1a1aa',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 描述文字
        const desc = this.add.text(0, 75, '职场人生 (Career Life) 是一款由 AI 驱动的职场模拟游戏。\n在动态、非线性的环境中体验求职、办公室政治与财富积累。', {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: '#71717a',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // 按钮组
        const btnContainer = this.add.container(0, 150);

        const hasSave = gameState.hasSaveData();
        const resume = jobHuntSystem.getResume();
        const hasCustomResume = resume.name !== '求职者' || hasSave;

        if (hasCustomResume) {
            const continueBtn = createStyledButton(this, -80, 0, 140, 44, 'Continue', () => {
                this.transitionTo('JobHuntScene');
            }, 'primary');

            const newBtn = createStyledButton(this, 80, 0, 140, 44, 'New Game', () => {
                jobHuntSystem.reset();
                gameState.resetGame();
                this.transitionTo('ResumeEditScene');
            }, 'outline');

            btnContainer.add([continueBtn, newBtn]);
        } else {
            const startBtn = createStyledButton(this, 0, 0, 160, 48, 'Start Simulation', () => {
                this.transitionTo('ResumeEditScene');
            }, 'primary');

            btnContainer.add(startBtn);
        }

        heroContainer.add([tagBg, pulseCircle, tagText, title1, title2, desc, btnContainer]);
    }

    /**
     * 游戏界面预览卡片 - 3D 透视效果
     */
    private createGamePreview(centerX: number, height: number): void {
        const previewContainer = this.add.container(centerX, height * 0.72);
        previewContainer.setAlpha(0);
        previewContainer.setData('entrance', true);
        previewContainer.setData('delay', 300);

        const cardWidth = 700;
        const cardHeight = 200;

        // 卡片背景
        const cardBg = this.add.graphics();
        cardBg.fillStyle(COLORS.bgPanel, 1);
        cardBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 16);
        cardBg.lineStyle(1, 0xffffff, 0.08);
        cardBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 16);

        // 窗口栏
        const windowBar = this.add.graphics();
        windowBar.fillStyle(0x0f0f11, 1);
        windowBar.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, 32, { tl: 16, tr: 16, bl: 0, br: 0 });
        
        // 窗口按钮
        const dot1 = this.add.circle(-cardWidth/2 + 20, -cardHeight/2 + 16, 5, 0x3f3f46, 0.5);
        const dot2 = this.add.circle(-cardWidth/2 + 36, -cardHeight/2 + 16, 5, 0x3f3f46, 0.5);
        const dot3 = this.add.circle(-cardWidth/2 + 52, -cardHeight/2 + 16, 5, 0x3f3f46, 0.5);

        // 状态文字
        const statusText = this.add.text(cardWidth/2 - 25, -cardHeight/2 + 16, 'AI_ENGINE: ACTIVE', {
            fontSize: '10px',
            fontFamily: FONTS.mono,
            color: '#6366f1'
        }).setOrigin(1, 0.5);

        // 游戏模拟内容区
        const contentY = -cardHeight/2 + 60;

        // 左侧 - 角色信息
        const avatarBg = this.add.graphics();
        avatarBg.fillStyle(COLORS.primary, 0.1);
        avatarBg.fillRoundedRect(-cardWidth/2 + 20, contentY, 40, 40, 8);
        avatarBg.lineStyle(1, COLORS.primary, 0.2);
        avatarBg.strokeRoundedRect(-cardWidth/2 + 20, contentY, 40, 40, 8);

        const avatarIcon = this.add.text(-cardWidth/2 + 40, contentY + 20, '👤', {
            fontSize: '18px'
        }).setOrigin(0.5);

        const roleTitle = this.add.text(-cardWidth/2 + 70, contentY + 10, 'Intern', {
            fontSize: '12px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });

        const roleLevel = this.add.text(-cardWidth/2 + 70, contentY + 26, 'Level 1', {
            fontSize: '10px',
            fontFamily: FONTS.main,
            color: '#71717a'
        });

        // 状态条
        this.createMiniProgressBar(previewContainer, -cardWidth/2 + 25, contentY + 55, 100, 'Energy', 0.85, COLORS.success);
        this.createMiniProgressBar(previewContainer, -cardWidth/2 + 25, contentY + 78, 100, 'Stress', 0.42, COLORS.warning);

        // 中间 - 对话框
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0xffffff, 0.02);
        dialogBg.fillRoundedRect(-150, contentY, 300, 100, 12);
        dialogBg.lineStyle(1, 0xffffff, 0.05);
        dialogBg.strokeRoundedRect(-150, contentY, 300, 100, 12);

        const npcName = this.add.text(-140, contentY + 12, 'Manager David', {
            fontSize: '10px',
            fontFamily: FONTS.main,
            color: '#6366f1',
            fontStyle: 'bold'
        });

        const dialogText = this.add.text(-140, contentY + 30, '"The board is considering you\nfor the Senior Lead position..."', {
            fontSize: '11px',
            fontFamily: FONTS.main,
            color: '#a1a1aa',
            lineSpacing: 4
        });

        // 选项按钮
        const opt1Bg = this.add.graphics();
        opt1Bg.fillStyle(0xffffff, 0.03);
        opt1Bg.fillRoundedRect(-140, contentY + 70, 130, 24, 4);
        opt1Bg.lineStyle(1, 0xffffff, 0.08);
        opt1Bg.strokeRoundedRect(-140, contentY + 70, 130, 24, 4);

        const opt1Text = this.add.text(-75, contentY + 82, 'Accept Task', {
            fontSize: '10px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        const opt2Bg = this.add.graphics();
        opt2Bg.fillStyle(0xffffff, 0.03);
        opt2Bg.fillRoundedRect(0, contentY + 70, 130, 24, 4);
        opt2Bg.lineStyle(1, 0xffffff, 0.08);
        opt2Bg.strokeRoundedRect(0, contentY + 70, 130, 24, 4);

        const opt2Text = this.add.text(65, contentY + 82, 'Decline Politely', {
            fontSize: '10px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        // 右侧 - 股市
        const stockTitle = this.add.text(cardWidth/2 - 130, contentY, 'Market Ticker', {
            fontSize: '10px',
            fontFamily: FONTS.main,
            color: '#71717a'
        });

        this.createMiniStockItem(previewContainer, cardWidth/2 - 130, contentY + 25, 'TECH', 124.50, -2.4, COLORS.danger);
        this.createMiniStockItem(previewContainer, cardWidth/2 - 130, contentY + 55, 'AI-X', 45.20, 12.8, COLORS.success);

        // 底部光晕
        const bottomGlow = this.add.graphics();
        bottomGlow.fillStyle(COLORS.primary, 0.15);
        bottomGlow.fillCircle(0, cardHeight/2 + 50, 200);

        previewContainer.add([
            bottomGlow, cardBg, windowBar, dot1, dot2, dot3, statusText,
            avatarBg, avatarIcon, roleTitle, roleLevel,
            dialogBg, npcName, dialogText, opt1Bg, opt1Text, opt2Bg, opt2Text,
            stockTitle
        ]);
    }

    /**
     * 迷你进度条
     */
    private createMiniProgressBar(
        container: Phaser.GameObjects.Container,
        x: number, y: number, width: number,
        label: string, progress: number, color: number
    ): void {
        const labelText = this.add.text(x, y, label, {
            fontSize: '9px',
            fontFamily: FONTS.main,
            color: '#71717a'
        });

        const valueText = this.add.text(x + width, y, `${Math.round(progress * 100)}%`, {
            fontSize: '9px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(1, 0);

        const barBg = this.add.rectangle(x + width/2, y + 14, width, 4, 0x27272a);
        const barFill = this.add.rectangle(x + (width * progress)/2, y + 14, width * progress, 4, color);
        barFill.setOrigin(0, 0.5);
        barFill.x = x;

        container.add([labelText, valueText, barBg, barFill]);
    }

    /**
     * 迷你股票项
     */
    private createMiniStockItem(
        container: Phaser.GameObjects.Container,
        x: number, y: number,
        symbol: string, price: number, change: number, color: number
    ): void {
        const itemBg = this.add.graphics();
        itemBg.fillStyle(0xffffff, 0.02);
        itemBg.fillRoundedRect(x, y, 110, 26, 4);
        itemBg.lineStyle(1, 0xffffff, 0.05);
        itemBg.strokeRoundedRect(x, y, 110, 26, 4);

        const indicator = this.add.rectangle(x + 4, y + 13, 2, 18, color);

        const symbolText = this.add.text(x + 12, y + 8, symbol, {
            fontSize: '9px',
            fontFamily: FONTS.main,
            color: '#a1a1aa',
            fontStyle: 'bold'
        });

        const priceText = this.add.text(x + 100, y + 8, price.toFixed(2), {
            fontSize: '9px',
            fontFamily: FONTS.mono,
            color: '#a1a1aa'
        }).setOrigin(1, 0);

        const changeText = this.add.text(x + 100, y + 18, `${change > 0 ? '+' : ''}${change.toFixed(1)}%`, {
            fontSize: '8px',
            fontFamily: FONTS.mono,
            color: change > 0 ? '#10b981' : '#ef4444'
        }).setOrigin(1, 0);

        container.add([itemBg, indicator, symbolText, priceText, changeText]);
    }

    /**
     * 入场动画
     */
    private playEntranceAnimations(): void {
        const entranceElements = this.children.list.filter(
            (child): child is Phaser.GameObjects.Container =>
                child instanceof Phaser.GameObjects.Container && child.getData('entrance') === true
        );

        entranceElements.forEach((element) => {
            const delay = element.getData('delay') || 0;
            const startY = element.y + 20;
            element.y = startY;

            this.tweens.add({
                targets: element,
                alpha: 1,
                y: startY - 20,
                duration: 600,
                delay: delay,
                ease: 'Power3.easeOut'
            });
        });
    }

    /**
     * 开始游戏
     */
    private startGame(): void {
        const hasSave = gameState.hasSaveData();
        const resume = jobHuntSystem.getResume();
        const hasCustomResume = resume.name !== '求职者' || hasSave;

        if (hasCustomResume) {
            this.transitionTo('JobHuntScene');
        } else {
            this.transitionTo('ResumeEditScene');
        }
    }

    /**
     * 场景过渡
     */
    private transitionTo(sceneName: string): void {
        this.scale.off('resize', this.handleResize, this);

        const { width, height } = this.scale;
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
        overlay.setDepth(1000);

        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 400,
            ease: 'Power2.easeIn',
            onComplete: () => {
                this.scene.start(sceneName);
            }
        });
    }
}
