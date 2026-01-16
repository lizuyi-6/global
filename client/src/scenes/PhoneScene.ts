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
        // 半透明遮罩
        this.overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);
        this.overlay.setInteractive();

        // 装饰性网格 (在遮罩层之上，但在手机之下)
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

        // 手机容器
        this.phoneContainer = this.add.container(640, 360);

        // 绘制手机外壳
        this.drawPhone();

        // 显示主界面
        this.showHomeScreen();

        // 关闭按钮
        this.overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 点击手机外部区域关闭
            if (pointer.x < 440 || pointer.x > 840 || pointer.y < 100 || pointer.y > 620) {
                this.closePhone();
            }
        });
    }

    /** 绘制手机外壳 */
    private drawPhone(): void {
        // 手机外框
        const phoneBody = this.add.graphics();
        phoneBody.fillStyle(0x0a0a0f, 1);
        phoneBody.fillRoundedRect(-200, -260, 400, 520, 24);
        phoneBody.lineStyle(2, COLORS.primary, 0.3);
        phoneBody.strokeRoundedRect(-200, -260, 400, 520, 24);
        this.phoneContainer.add(phoneBody);

        // 屏幕区域 (磨砂玻璃)
        const screenRect = this.add.rectangle(0, 0, 380, 480, COLORS.panel, 0.8);
        applyGlassEffect(screenRect, 0.8);
        this.phoneContainer.add(screenRect);

        // 顶部状态栏
        const statusBar = this.add.rectangle(0, -225, 360, 20, 0x000000, 0.3);
        this.phoneContainer.add(statusBar);

        // 时间显示
        const timeText = this.add.text(0, -225, gameState.getFormattedTime(), {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#888888'
        });
        timeText.setOrigin(0.5, 0.5);
        this.phoneContainer.add(timeText);

        // Home 键 (电容式风格)
        const homeButton = this.add.circle(0, 240, 15, 0x333333, 0.5);
        homeButton.setStrokeStyle(1, 0xffffff, 0.2);
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
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = -110 + col * 110;
            const y = -120 + row * 110;

            const iconContainer = this.add.container(x, y);
            iconContainer.setData('appIcon', true);
            this.phoneContainer.add(iconContainer);

            // 图标背景
            const iconBg = this.add.rectangle(0, 0, 70, 70, 0xffffff, 0.05);
            iconBg.setStrokeStyle(1, 0xffffff, 0.1);
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

            const iconText = this.add.text(0, -5, app.icon, { fontSize: '28px' }).setOrigin(0.5);
            const nameText = this.add.text(0, 30, app.name, { fontSize: '10px', fontFamily: FONTS.mono, color: '#888888' }).setOrigin(0.5);
            iconContainer.add([iconText, nameText]);
        });

        // 底部资金显示
        const account = gameState.getAccount();
        const moneyBox = this.add.container(0, 180);
        moneyBox.setData('appIcon', true);
        this.phoneContainer.add(moneyBox);

        const moneyLabel = this.add.text(0, -15, 'AVAILABLE BALANCE', { fontSize: '9px', fontFamily: FONTS.mono, color: '#666666' }).setOrigin(0.5);
        const moneyValue = this.add.text(0, 5, `¥${account.cash.toLocaleString()}`, { fontSize: '18px', fontFamily: FONTS.mono, color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5);
        moneyBox.add([moneyLabel, moneyValue]);
    }

    /** 清除应用内容 */
    private clearAppContent(): void {
        // 移除所有带 appIcon 标记的元素
        this.phoneContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
            if (child.getData && child.getData('appIcon')) {
                child.destroy();
            }
        });
        // 移除所有标记为 appContent 的元素
        this.phoneContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
            if (child.getData && child.getData('appContent')) {
                child.destroy();
            }
        });
    }

    /** 显示联系人 */
    showContacts(): void {
        this.clearAppContent();
        this.currentApp = 'contacts';

        // 标题
        const title = this.add.text(0, -200, '联系人', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        // 联系人列表
        const contacts = ['张经理', '李同事', '王前辈'];
        contacts.forEach((name, index) => {
            const y = -120 + index * 80;
            const rel = gameState.getRelationship(name);

            // 联系人卡片
            const card = this.add.rectangle(0, y, 350, 60, 0x3a3a4a);
            card.setInteractive({ useHandCursor: true });
            card.on('pointerover', () => card.setFillStyle(0x4a4a5a));
            card.on('pointerout', () => card.setFillStyle(0x3a3a4a));
            card.on('pointerdown', () => this.callContact(name));
            card.setData('appContent', true);
            this.phoneContainer.add(card);

            // 头像
            const avatar = this.add.circle(-140, y, 20, name === '张经理' ? 0xd94a4a : name === '李同事' ? 0x4ad94a : 0x4a4ad9);
            avatar.setData('appContent', true);
            this.phoneContainer.add(avatar);

            // 名字
            const nameText = this.add.text(-100, y - 10, name, {
                fontSize: '16px',
                color: '#ffffff'
            });
            nameText.setData('appContent', true);
            this.phoneContainer.add(nameText);

            // 好感度
            const favText = this.add.text(-100, y + 12, `好感度: ${rel?.favorability ?? 0}`, {
                fontSize: '12px',
                color: rel && rel.favorability > 0 ? '#00ff88' : rel && rel.favorability < 0 ? '#ff4444' : '#888888'
            });
            favText.setData('appContent', true);
            this.phoneContainer.add(favText);

            // 通话按钮
            const callBtn = this.add.text(140, y, '📞', {
                fontSize: '24px'
            });
            callBtn.setOrigin(0.5, 0.5);
            callBtn.setData('appContent', true);
            this.phoneContainer.add(callBtn);
        });

        // 返回按钮
        this.addBackButton();
    }

    /** 打电话给联系人 */
    private callContact(name: string): void {
        // 关闭手机，回到办公室场景并触发对话
        this.scene.get('ImprovedOfficeScene').events.emit('startChat', name);
        this.closePhone();
    }

    /** 显示任务列表 */
    showTasks(): void {
        this.clearAppContent();
        this.currentApp = 'tasks';

        // 标题
        const title = this.add.text(0, -200, '今日任务', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        const tasks = gameState.getTodayTasks();

        if (tasks.length === 0) {
            const noTask = this.add.text(0, 0, '暂无任务\n点击电脑获取新任务', {
                fontSize: '16px',
                color: '#888888',
                align: 'center'
            });
            noTask.setOrigin(0.5, 0.5);
            noTask.setData('appContent', true);
            this.phoneContainer.add(noTask);
        } else {
            tasks.forEach((task, index) => {
                const y = -120 + index * 90;

                // 任务卡片
                const card = this.add.rectangle(0, y, 350, 70, 0x3a3a4a);
                card.setData('appContent', true);
                this.phoneContainer.add(card);

                // 任务标题
                const taskTitle = this.add.text(-160, y - 15, task.title, {
                    fontSize: '14px',
                    color: '#ffffff'
                });
                taskTitle.setData('appContent', true);
                this.phoneContainer.add(taskTitle);

                // 进度条背景
                const progressBg = this.add.rectangle(-30, y + 15, 200, 10, 0x222222);
                progressBg.setData('appContent', true);
                this.phoneContainer.add(progressBg);

                // 进度条
                const progressFill = this.add.rectangle(-130 + task.progress, y + 15, task.progress * 2, 10, 0x00ff88);
                progressFill.setOrigin(0, 0.5);
                progressFill.setData('appContent', true);
                this.phoneContainer.add(progressFill);

                // 奖励
                const rewardText = this.add.text(140, y, `¥${task.reward}`, {
                    fontSize: '14px',
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

        // 标题
        const title = this.add.text(0, -200, '我的账户', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        // 总资产卡片
        const assetCard = this.add.rectangle(0, -100, 350, 100, 0x2a4a6a);
        assetCard.setData('appContent', true);
        this.phoneContainer.add(assetCard);

        const assetLabel = this.add.text(0, -130, '总资产', {
            fontSize: '14px',
            color: '#aaaaaa'
        });
        assetLabel.setOrigin(0.5, 0.5);
        assetLabel.setData('appContent', true);
        this.phoneContainer.add(assetLabel);

        const assetValue = this.add.text(0, -90, `¥${account.totalAssets.toFixed(2)}`, {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        assetValue.setOrigin(0.5, 0.5);
        assetValue.setData('appContent', true);
        this.phoneContainer.add(assetValue);

        // 详细信息
        const details = [
            { label: '可用现金', value: `¥${account.cash.toFixed(2)}`, color: '#ffffff' },
            { label: '股票市值', value: `¥${account.stockValue.toFixed(2)}`, color: '#ffffff' },
            { label: '今日盈亏', value: `${account.todayProfit >= 0 ? '+' : ''}¥${account.todayProfit.toFixed(2)}`, color: account.todayProfit >= 0 ? '#00ff88' : '#ff4444' },
            { label: '累计盈亏', value: `${account.totalProfit >= 0 ? '+' : ''}¥${account.totalProfit.toFixed(2)}`, color: account.totalProfit >= 0 ? '#00ff88' : '#ff4444' },
            { label: '月薪', value: `¥${player.salary}`, color: '#ffcc00' },
        ];

        details.forEach((item, index) => {
            const y = 0 + index * 40;

            const label = this.add.text(-150, y, item.label, {
                fontSize: '14px',
                color: '#888888'
            });
            label.setData('appContent', true);
            this.phoneContainer.add(label);

            const value = this.add.text(150, y, item.value, {
                fontSize: '14px',
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

        const title = this.add.text(0, -200, '设置', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setData('appContent', true);
        this.phoneContainer.add(title);

        const player = gameState.getPlayer();

        // 玩家名字
        const nameLabel = this.add.text(-150, -100, '玩家名称:', {
            fontSize: '14px',
            color: '#888888'
        });
        nameLabel.setData('appContent', true);
        this.phoneContainer.add(nameLabel);

        const nameValue = this.add.text(100, -100, player.name, {
            fontSize: '14px',
            color: '#ffffff'
        });
        nameValue.setOrigin(1, 0);
        nameValue.setData('appContent', true);
        this.phoneContainer.add(nameValue);

        // 重置游戏按钮
        const resetBtn = this.add.rectangle(0, 100, 200, 40, 0xaa3333);
        resetBtn.setInteractive({ useHandCursor: true });
        resetBtn.on('pointerover', () => resetBtn.setFillStyle(0xcc4444));
        resetBtn.on('pointerout', () => resetBtn.setFillStyle(0xaa3333));
        resetBtn.on('pointerdown', () => {
            if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
                gameState.resetGame();
                this.closePhone();
                this.scene.get('ImprovedOfficeScene').scene.restart();
            }
        });
        resetBtn.setData('appContent', true);
        this.phoneContainer.add(resetBtn);

        const resetText = this.add.text(0, 100, '重置游戏', {
            fontSize: '16px',
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

        // 显示保存成功提示
        const toast = this.add.text(640, 600, '游戏已保存!', {
            fontSize: '18px',
            color: '#00ff88',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        toast.setOrigin(0.5, 0.5);
        toast.setDepth(10000);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 550,
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
        const backBtn = this.add.text(-170, -200, '←', {
            fontSize: '24px',
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
