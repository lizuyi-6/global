import Phaser from 'phaser';
import { gameState } from '../GameState';
import { COLORS, FONTS, applyGlassEffect } from '../UIConfig';

/**
 * 手机界面场景
 * 包含联系人、理财入口、任务列表等
 */
export class PhoneScene extends Phaser.Scene {
    private overlay!: Phaser.GameObjects.Rectangle;
    private phoneContainer!: Phaser.GameObjects.Container;
    private currentApp: string = 'home';

    constructor() {
        super({ key: 'PhoneScene' });
    }

    create(): void {
        // 半透明遮罩 - 2560x1440
        this.overlay = this.add.rectangle(1280, 720, 2560, 1440, 0x000000, 0.7);
        this.overlay.setInteractive();
        this.overlay.setDepth(50000);

        // 装饰性网格
        const deco = this.add.graphics();
        deco.setDepth(50001);
        deco.lineStyle(2, COLORS.primary, 0.1);
        for (let i = 0; i < 2560; i += 80) { // Step 40->80
            deco.moveTo(i, 0);
            deco.lineTo(i, 1440);
        }
        for (let i = 0; i < 1440; i += 80) {
            deco.moveTo(0, i);
            deco.lineTo(2560, i);
        }
        deco.strokePath();

        // 手机容器 - 1280, 720 center
        this.phoneContainer = this.add.container(1280, 720);
        this.phoneContainer.setDepth(50100);
        this.phoneContainer.setScale(1.3); // Scale up by 30%

        // 绘制手机外壳
        this.drawPhone();

        // 显示主界面
        this.showHomeScreen();

        // 关闭按钮
        this.overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 点击手机外部区域关闭. Phone Width ~800. X range 880-1680. Y range 200-1240.
            if (pointer.x < 880 || pointer.x > 1680 || pointer.y < 200 || pointer.y > 1240) {
                this.closePhone();
            }
        });
    }

    /** 绘制手机外壳 */
    private drawPhone(): void {
        // 手机外框 - 400x520 -> 800x1040
        const phoneBody = this.add.graphics();
        phoneBody.fillStyle(0x0a0a0f, 1);
        phoneBody.fillRoundedRect(-400, -520, 800, 1040, 48); // r 24->48
        phoneBody.lineStyle(4, COLORS.primary, 0.3); // line 2->4
        phoneBody.strokeRoundedRect(-400, -520, 800, 1040, 48);
        this.phoneContainer.add(phoneBody);

        // 屏幕区域 (磨砂玻璃) - 380x480 -> 760x960
        const screenRect = this.add.rectangle(0, 0, 760, 960, COLORS.panel, 0.8);
        applyGlassEffect(screenRect, 0.8);
        this.phoneContainer.add(screenRect);

        // 顶部状态栏 - w 360->720, h 20->40, y -225->-450
        const statusBar = this.add.rectangle(0, -450, 720, 40, 0x000000, 0.3);
        this.phoneContainer.add(statusBar);

        // 时间显示
        const timeText = this.add.text(0, -450, gameState.getFormattedTime(), {
            fontSize: '24px', // 12->24
            fontFamily: FONTS.mono,
            color: '#888888'
        });
        timeText.setOrigin(0.5, 0.5);
        this.phoneContainer.add(timeText);

        // Home 键 - r 15->30, y 240->480
        const homeButton = this.add.circle(0, 480, 30, 0x333333, 0.5);
        homeButton.setStrokeStyle(2, 0xffffff, 0.2);
        homeButton.setInteractive({ useHandCursor: true });
        homeButton.on('pointerdown', () => this.showHomeScreen());
        this.phoneContainer.add(homeButton);
    }

    /** 显示主界面 */
    showHomeScreen(): void {
        this.clearAppContent();
        this.currentApp = 'home';

        const apps = [
            { icon: '👥', name: 'CONTACTS', action: () => this.showContacts() },
            { icon: '📈', name: 'EXCHANGE', action: () => this.openStockApp() },
            { icon: '📋', name: 'TASKS', action: () => this.showTasks() },
            { icon: '💎', name: 'WALLET', action: () => this.showAccount() },
            { icon: '⚙️', name: 'SYSTEM', action: () => this.showSettings() },
            { icon: '💾', name: 'BACKUP', action: () => this.saveGame() },
        ];

        // 绘制应用图标
        apps.forEach((app, index) => {
            // col 3. x start -110->-220. step 110->220. y start -120->-240. step 110->220.
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = -220 + col * 220;
            const y = -240 + row * 220;

            const iconContainer = this.add.container(x, y);
            iconContainer.setData('appIcon', true);
            this.phoneContainer.add(iconContainer);

            // 图标背景 - 70->140
            const iconBg = this.add.rectangle(0, 0, 140, 140, 0xffffff, 0.05);
            iconBg.setStrokeStyle(2, 0xffffff, 0.1);
            iconBg.setInteractive({ useHandCursor: true });

            iconBg.on('pointerover', () => {
                iconBg.setFillStyle(0xffffff, 0.1);
                this.tweens.add({ targets: iconContainer, scale: 1.1, duration: 100 });
            });
            iconBg.on('pointerout', () => {
                iconBg.setFillStyle(0xffffff, 0.05);
                this.tweens.add({ targets: iconContainer, scale: 1, duration: 100 });
            });
            iconBg.on('pointerdown', app.action);
            iconContainer.add(iconBg);

            const iconText = this.add.text(0, -10, app.icon, { fontSize: '56px' }).setOrigin(0.5); // 28->56
            const nameText = this.add.text(0, 60, app.name, { fontSize: '20px', fontFamily: FONTS.mono, color: '#888888' }).setOrigin(0.5); // 10->20, y 30->60
            iconContainer.add([iconText, nameText]);
        });

        // 底部资金显示 - y 180->360
        const account = gameState.getAccount();
        const moneyBox = this.add.container(0, 360);
        moneyBox.setData('appIcon', true);
        this.phoneContainer.add(moneyBox);

        const moneyLabel = this.add.text(0, -30, 'AVAILABLE BALANCE', { fontSize: '18px', fontFamily: FONTS.mono, color: '#666666' }).setOrigin(0.5);
        const moneyValue = this.add.text(0, 10, `¥${account.cash.toLocaleString()}`, { fontSize: '36px', fontFamily: FONTS.mono, color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5);
        moneyBox.add([moneyLabel, moneyValue]);
    }

    /** 清除应用内容 */
    private clearAppContent(): void {
        const toDestroy = this.phoneContainer.list.filter(child =>
            child.getData && (child.getData('appIcon') || child.getData('appContent'))
        );
        toDestroy.forEach(child => child.destroy());
    }

    /** 显示联系人 */
    showContacts(): void {
        this.clearAppContent();
        this.currentApp = 'contacts';

        // 标题 - y -200->-400
        const title = this.add.text(0, -400, '联系人', {
            fontSize: '40px', // 20->40
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        const contacts = ['张经理', '李同事', '王前辈'];
        contacts.forEach((name, index) => {
            const y = -240 + index * 160; // -120->-240, step 80->160
            const rel = gameState.getRelationship(name);

            // 联系人卡片 - w 350->700, h 60->120
            const card = this.add.rectangle(0, y, 700, 120, COLORS.bgCard);
            card.setInteractive({ useHandCursor: true });
            card.on('pointerover', () => card.setFillStyle(COLORS.panelOverlay));
            card.on('pointerout', () => card.setFillStyle(COLORS.bgCard));
            card.on('pointerdown', () => this.callContact(name));
            card.setData('appContent', true);
            this.phoneContainer.add(card);

            // 头像 - x -140->-280, r 20->40
            const avatar = this.add.circle(-280, y, 40, name === '张经理' ? 0xd94a4a : name === '李同事' ? 0x4ad94a : 0x4a4ad9);
            avatar.setData('appContent', true);
            this.phoneContainer.add(avatar);

            // 名字
            const nameText = this.add.text(-200, y - 20, name, {
                fontSize: '32px', // 16->32
                color: '#ffffff'
            });
            nameText.setData('appContent', true);
            this.phoneContainer.add(nameText);

            // 好感度
            const favText = this.add.text(-200, y + 24, `好感度: ${rel?.favorability ?? 0}`, {
                fontSize: '24px', // 12->24
                color: rel && rel.favorability > 0 ? '#00ff88' : rel && rel.favorability < 0 ? '#ff4444' : '#888888'
            });
            favText.setData('appContent', true);
            this.phoneContainer.add(favText);

            // 通话按钮
            const callBtn = this.add.text(280, y, '📞', { // 140->280
                fontSize: '48px' // 24->48
            });
            callBtn.setOrigin(0.5, 0.5);
            callBtn.setData('appContent', true);
            this.phoneContainer.add(callBtn);
        });

        this.addBackButton();
    }

    /** 打电话给联系人 */
    private callContact(name: string): void {
        this.scene.get('ImprovedOfficeScene').events.emit('startChat', name);
        this.closePhone();
    }

    /** 显示任务列表 */
    showTasks(): void {
        this.clearAppContent();
        this.currentApp = 'tasks';

        const title = this.add.text(0, -400, '今日任务', {
            fontSize: '40px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        const tasks = gameState.getTodayTasks();

        if (tasks.length === 0) {
            const noTask = this.add.text(0, 0, '暂无任务\n点击电脑获取新任务', {
                fontSize: '32px',
                color: '#888888',
                align: 'center'
            });
            noTask.setOrigin(0.5, 0.5);
            noTask.setData('appContent', true);
            this.phoneContainer.add(noTask);
        } else {
            tasks.forEach((task, index) => {
                const y = -240 + index * 180;

                const card = this.add.rectangle(0, y, 700, 140, COLORS.bgCard);
                card.setData('appContent', true);
                card.setInteractive({ useHandCursor: true });
                this.phoneContainer.add(card);

                // Task Interaction
                card.on('pointerover', () => card.setFillStyle(COLORS.panelOverlay));
                card.on('pointerout', () => card.setFillStyle(COLORS.bgCard));
                card.on('pointerdown', () => {
                    this.closePhone();
                    this.scene.launch('TaskGameScene', {
                        task: task,
                        gameType: task.type === 'coding' ? 'typing'
                            : task.type === 'meeting' ? 'sorting'
                                : task.type === 'report' ? 'memory'
                                    : 'clicking'
                    });
                    this.scene.pause('ImprovedOfficeScene');
                });

                const taskTitle = this.add.text(-320, y - 30, task.title, {
                    fontSize: '28px',
                    color: '#ffffff'
                });
                taskTitle.setData('appContent', true);
                this.phoneContainer.add(taskTitle);

                const progressBg = this.add.rectangle(-60, y + 30, 400, 20, COLORS.borderSubtle);
                progressBg.setData('appContent', true);
                this.phoneContainer.add(progressBg);

                const progressFill = this.add.rectangle(-260 + task.progress * 2, y + 30, task.progress * 4, 20, COLORS.success);
                progressFill.setOrigin(0, 0.5);
                progressFill.setData('appContent', true);
                this.phoneContainer.add(progressFill);

                const rewardText = this.add.text(280, y, `¥${task.reward}`, {
                    fontSize: '28px',
                    color: '#ffcc00'
                });
                rewardText.setOrigin(0.5, 0.5);
                rewardText.setData('appContent', true);
                this.phoneContainer.add(rewardText);
            });
        }

        this.addBackButton();
    }

    /** 显示账户信息 */
    showAccount(): void {
        this.clearAppContent();
        this.currentApp = 'account';

        const account = gameState.getAccount();
        const player = gameState.getPlayer();

        const title = this.add.text(0, -400, '我的账户', {
            fontSize: '40px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        const assetCard = this.add.rectangle(0, -200, 700, 200, COLORS.primary, 0.2);
        assetCard.setData('appContent', true);
        this.phoneContainer.add(assetCard);

        const assetLabel = this.add.text(0, -260, '总资产', {
            fontSize: '28px',
            color: '#aaaaaa'
        });
        assetLabel.setOrigin(0.5, 0.5);
        assetLabel.setData('appContent', true);
        this.phoneContainer.add(assetLabel);

        const assetValue = this.add.text(0, -180, `¥${account.totalAssets.toFixed(2)}`, {
            fontSize: '56px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        assetValue.setOrigin(0.5, 0.5);
        assetValue.setData('appContent', true);
        this.phoneContainer.add(assetValue);

        const details = [
            { label: '可用现金', value: `¥${account.cash.toFixed(2)}`, color: '#ffffff' },
            { label: '股票市值', value: `¥${account.stockValue.toFixed(2)}`, color: '#ffffff' },
            { label: '今日盈亏', value: `${account.todayProfit >= 0 ? '+' : ''}¥${account.todayProfit.toFixed(2)}`, color: account.todayProfit >= 0 ? '#00ff88' : '#ff4444' },
            { label: '累计盈亏', value: `${account.totalProfit >= 0 ? '+' : ''}¥${account.totalProfit.toFixed(2)}`, color: account.totalProfit >= 0 ? '#00ff88' : '#ff4444' },
            { label: '月薪', value: `¥${player.salary}`, color: '#ffcc00' },
        ];

        details.forEach((item, index) => {
            const y = 0 + index * 80;

            const label = this.add.text(-300, y, item.label, {
                fontSize: '28px',
                color: '#888888'
            });
            label.setData('appContent', true);
            this.phoneContainer.add(label);

            const value = this.add.text(300, y, item.value, {
                fontSize: '28px',
                color: item.color
            });
            value.setOrigin(1, 0);
            value.setData('appContent', true);
            this.phoneContainer.add(value);
        });

        this.addBackButton();
    }

    /** 显示设置 */
    showSettings(): void {
        this.clearAppContent();
        this.currentApp = 'settings';

        const title = this.add.text(0, -400, '设置', {
            fontSize: '40px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        const player = gameState.getPlayer();

        const nameLabel = this.add.text(-300, -200, '玩家名称:', {
            fontSize: '28px',
            color: '#888888'
        });
        nameLabel.setData('appContent', true);
        this.phoneContainer.add(nameLabel);

        const nameValue = this.add.text(200, -200, player.name, {
            fontSize: '28px',
            color: '#ffffff'
        });
        nameValue.setOrigin(1, 0);
        nameValue.setData('appContent', true);
        this.phoneContainer.add(nameValue);

        const resetBtn = this.add.rectangle(0, 200, 400, 80, COLORS.danger);
        resetBtn.setInteractive({ useHandCursor: true });
        resetBtn.on('pointerover', () => resetBtn.setFillStyle(0xf87171));
        resetBtn.on('pointerout', () => resetBtn.setFillStyle(COLORS.danger));
        resetBtn.on('pointerdown', () => {
            if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
                gameState.resetGame();
                this.closePhone();
                this.scene.get('ImprovedOfficeScene').scene.restart();
            }
        });
        resetBtn.setData('appContent', true);
        this.phoneContainer.add(resetBtn);

        const resetText = this.add.text(0, 200, '重置游戏', {
            fontSize: '32px',
            color: '#ffffff'
        });
        resetText.setOrigin(0.5, 0.5);
        resetText.setData('appContent', true);
        this.phoneContainer.add(resetText);

        this.addBackButton();
    }

    /** 保存游戏 */
    private saveGame(): void {
        gameState.saveGame();

        // 2K compatible toast
        const toast = this.add.text(1280, 1200, '游戏已保存!', {
            fontSize: '36px',
            color: '#00ff88',
            backgroundColor: '#333333',
            padding: { x: 40, y: 20 }
        });
        toast.setOrigin(0.5, 0.5);
        toast.setDepth(10000);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 1100,
            duration: 1500,
            onComplete: () => toast.destroy()
        });
    }

    /** 打开股票应用 */
    private openStockApp(): void {
        this.scene.launch('StockScene');
        this.scene.pause();
    }

    /** 添加返回按钮 */
    private addBackButton(): void {
        const backBtn = this.add.text(-340, -400, '←', {
            fontSize: '48px',
            color: '#ffffff'
        });
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.showHomeScreen());
        backBtn.setData('appContent', true);
        this.phoneContainer.add(backBtn);
    }

    /** 关闭手机 */
    closePhone(): void {
        this.scene.stop();
        this.scene.resume('ImprovedOfficeScene');
    }
}
