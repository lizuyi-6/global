import Phaser from 'phaser';
import { gameState } from '../GameState';

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
        phoneBody.fillStyle(0x1a1a1a, 1);
        phoneBody.fillRoundedRect(-200, -260, 400, 520, 20);
        phoneBody.lineStyle(2, 0x333333, 1);
        phoneBody.strokeRoundedRect(-200, -260, 400, 520, 20);
        this.phoneContainer.add(phoneBody);

        // 屏幕区域
        const screen = this.add.graphics();
        screen.fillStyle(0x2a2a3a, 1);
        screen.fillRoundedRect(-190, -240, 380, 480, 10);
        this.phoneContainer.add(screen);

        // 顶部状态栏
        const statusBar = this.add.rectangle(0, -230, 370, 30, 0x1a1a2a);
        this.phoneContainer.add(statusBar);

        // 时间显示
        const timeText = this.add.text(0, -230, gameState.getFormattedTime(), {
            fontSize: '14px',
            color: '#ffffff'
        });
        timeText.setOrigin(0.5, 0.5);
        this.phoneContainer.add(timeText);

        // Home 键
        const homeButton = this.add.circle(0, 240, 20, 0x333333);
        homeButton.setInteractive({ useHandCursor: true });
        homeButton.on('pointerdown', () => this.showHomeScreen());
        this.phoneContainer.add(homeButton);
    }

    /** 显示主界面 */
    showHomeScreen(): void {
        this.clearAppContent();
        this.currentApp = 'home';

        const apps = [
            { icon: '📱', name: '联系人', action: () => this.showContacts() },
            { icon: '📈', name: '股票', action: () => this.openStockApp() },
            { icon: '📋', name: '任务', action: () => this.showTasks() },
            { icon: '💰', name: '账户', action: () => this.showAccount() },
            { icon: '⚙️', name: '设置', action: () => this.showSettings() },
            { icon: '💾', name: '存档', action: () => this.saveGame() },
        ];

        // 绘制应用图标
        apps.forEach((app, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = -120 + col * 120;
            const y = -150 + row * 120;

            // 图标背景
            const iconBg = this.add.rectangle(x, y, 70, 70, 0x3a3a4a, 1);
            iconBg.setInteractive({ useHandCursor: true });
            iconBg.on('pointerover', () => iconBg.setFillStyle(0x4a4a5a));
            iconBg.on('pointerout', () => iconBg.setFillStyle(0x3a3a4a));
            iconBg.on('pointerdown', app.action);
            iconBg.setData('appIcon', true);
            this.phoneContainer.add(iconBg);

            // 图标
            const iconText = this.add.text(x, y - 10, app.icon, {
                fontSize: '28px'
            });
            iconText.setOrigin(0.5, 0.5);
            iconText.setData('appIcon', true);
            this.phoneContainer.add(iconText);

            // 名称
            const nameText = this.add.text(x, y + 25, app.name, {
                fontSize: '12px',
                color: '#ffffff'
            });
            nameText.setOrigin(0.5, 0.5);
            nameText.setData('appIcon', true);
            this.phoneContainer.add(nameText);
        });

        // 底部资金显示
        const account = gameState.getAccount();
        const moneyText = this.add.text(0, 180, `可用资金: ¥${account.cash.toFixed(2)}`, {
            fontSize: '14px',
            color: '#00ff88'
        });
        moneyText.setOrigin(0.5, 0.5);
        moneyText.setData('appIcon', true);
        this.phoneContainer.add(moneyText);
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
        this.scene.get('OfficeScene').events.emit('startChat', name);
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
                this.scene.get('OfficeScene').scene.restart();
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
        this.scene.resume('OfficeScene');
    }
}
