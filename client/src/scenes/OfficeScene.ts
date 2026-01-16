import Phaser from 'phaser';
import { apiService } from '../APIService';
import { gameState } from '../GameState';
import type { WorkplaceEvent } from '../WorkplaceSystem';
import { POSITIONS, workplaceSystem } from '../WorkplaceSystem';

/**
 * 等距坐标转换工具
 */
class IsoUtils {
    static TILE_WIDTH = 64;
    static TILE_HEIGHT = 32;

    /**
     * 将网格坐标转换为屏幕坐标
     */
    static gridToScreen(gridX: number, gridY: number, offsetX = 0, offsetY = 0): { x: number; y: number } {
        return {
            x: (gridX - gridY) * (this.TILE_WIDTH / 2) + offsetX,
            y: (gridX + gridY) * (this.TILE_HEIGHT / 2) + offsetY
        };
    }

    /**
     * 将屏幕坐标转换为网格坐标
     */
    static screenToGrid(screenX: number, screenY: number, offsetX = 0, offsetY = 0): { x: number; y: number } {
        const adjustedX = screenX - offsetX;
        const adjustedY = screenY - offsetY;
        return {
            x: Math.floor((adjustedX / (this.TILE_WIDTH / 2) + adjustedY / (this.TILE_HEIGHT / 2)) / 2),
            y: Math.floor((adjustedY / (this.TILE_HEIGHT / 2) - adjustedX / (this.TILE_WIDTH / 2)) / 2)
        };
    }
}

/**
 * 办公室主场景
 */
export class OfficeScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

    // 场景偏移量（将地图居中显示）
    private mapOffsetX = 640;
    private mapOffsetY = 200;

    // 地图尺寸
    private mapWidth = 10;
    private mapHeight = 10;

    // 玩家网格位置
    private playerGridX = 2;
    private playerGridY = 2;

    // NPC 列表
    private npcs: Phaser.GameObjects.Sprite[] = [];

    // 可交互物品
    private interactables: Map<string, Phaser.GameObjects.Sprite> = new Map();

    // UI 元素
    private instructionText!: Phaser.GameObjects.Text;
    private statusBar!: Phaser.GameObjects.Text;
    private phoneKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'OfficeScene' });
    }

    create(): void {
        // 创建等距地板
        this.createFloor();

        // 创建办公家具
        this.createFurniture();

        // 创建玩家
        this.createPlayer();

        // 创建 NPC 同事
        this.createNPCs();

        // 设置输入控制
        this.setupInput();

        // 创建 UI
        this.createUI();

        // 设置相机
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // 监听游戏事件
        this.setupGameEvents();

        // 启动游戏时间
        gameState.startTime();
    }

    /**
     * 创建等距地板
     */
    private createFloor(): void {
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const pos = IsoUtils.gridToScreen(x, y, this.mapOffsetX, this.mapOffsetY);
                const tile = this.add.sprite(pos.x, pos.y, 'floor_tile');
                tile.setOrigin(0.5, 0.5);
                // 添加轻微颜色变化让地板更有层次
                if ((x + y) % 2 === 0) {
                    tile.setTint(0xf0f0f0);
                }
            }
        }
    }

    /**
     * 创建办公家具
     */
    private createFurniture(): void {
        // 办公桌布局（网格坐标）
        const deskPositions = [
            { x: 3, y: 2 },
            { x: 3, y: 4 },
            { x: 3, y: 6 },
            { x: 6, y: 2 },
            { x: 6, y: 4 },
            { x: 6, y: 6 },
        ];

        deskPositions.forEach((deskPos, index) => {
            const pos = IsoUtils.gridToScreen(deskPos.x, deskPos.y, this.mapOffsetX, this.mapOffsetY);

            // 椅子（在桌子前面）
            const chairPos = IsoUtils.gridToScreen(deskPos.x - 1, deskPos.y, this.mapOffsetX, this.mapOffsetY);
            const chair = this.add.sprite(chairPos.x, chairPos.y - 10, 'chair');
            chair.setOrigin(0.5, 1);
            chair.setDepth(chairPos.y);

            // 办公桌
            const desk = this.add.sprite(pos.x, pos.y - 8, 'desk');
            desk.setOrigin(0.5, 1);
            desk.setDepth(pos.y);

            // 电脑（在桌子上）
            const computer = this.add.sprite(pos.x, pos.y - 40, 'computer');
            computer.setOrigin(0.5, 1);
            computer.setDepth(pos.y + 1);
            computer.setInteractive({ useHandCursor: true });
            computer.setData('type', 'computer');
            computer.setData('deskIndex', index);

            // 存储可交互物品
            this.interactables.set(`computer_${index}`, computer);

            // 电脑点击事件
            computer.on('pointerdown', () => {
                this.onComputerClick(index);
            });

            // 悬停效果
            computer.on('pointerover', () => {
                computer.setTint(0x88ff88);
            });
            computer.on('pointerout', () => {
                computer.clearTint();
            });
        });
    }

    /**
     * 创建玩家
     */
    private createPlayer(): void {
        const pos = IsoUtils.gridToScreen(this.playerGridX, this.playerGridY, this.mapOffsetX, this.mapOffsetY);
        this.player = this.add.sprite(pos.x, pos.y - 16, 'player');
        this.player.setOrigin(0.5, 1);
        this.player.setDepth(pos.y + 100); // 确保玩家在家具上层

        // 添加玩家名字标签
        const player = gameState.getPlayer();
        const nameTag = this.add.text(pos.x, pos.y - 50, player.name, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#333333aa',
            padding: { x: 4, y: 2 }
        });
        nameTag.setOrigin(0.5, 1);
        nameTag.setDepth(10000);
        this.player.setData('nameTag', nameTag);
    }

    /**
     * 创建 NPC 同事
     */
    private createNPCs(): void {
        const npcData = [
            { x: 2, y: 4, name: '张经理' },
            { x: 5, y: 3, name: '李同事' },
            { x: 7, y: 5, name: '王前辈' },
        ];

        npcData.forEach((data) => {
            const pos = IsoUtils.gridToScreen(data.x, data.y, this.mapOffsetX, this.mapOffsetY);
            const npc = this.add.sprite(pos.x, pos.y - 16, 'npc');
            npc.setOrigin(0.5, 1);
            npc.setDepth(pos.y + 100);
            npc.setInteractive({ useHandCursor: true });
            npc.setData('name', data.name);
            npc.setData('gridX', data.x);
            npc.setData('gridY', data.y);

            // NPC 名字标签
            const nameTag = this.add.text(pos.x, pos.y - 50, data.name, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#aa3333aa',
                padding: { x: 4, y: 2 }
            });
            nameTag.setOrigin(0.5, 1);
            nameTag.setDepth(10000);
            npc.setData('nameTag', nameTag);

            // 点击 NPC 交互
            npc.on('pointerdown', () => {
                this.onNPCClick(data.name);
            });

            // 悬停效果
            npc.on('pointerover', () => {
                npc.setTint(0xffff88);
            });
            npc.on('pointerout', () => {
                npc.clearTint();
            });

            this.npcs.push(npc);
        });
    }

    /**
     * 设置输入控制
     */
    private setupInput(): void {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            // P 键打开手机
            this.phoneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        }

        // 点击地面移动
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 检查是否点击在空白区域
            const clickedObjects = this.input.hitTestPointer(pointer);
            if (clickedObjects.length === 0) {
                const gridPos = IsoUtils.screenToGrid(pointer.x, pointer.y, this.mapOffsetX, this.mapOffsetY);
                if (gridPos.x >= 0 && gridPos.x < this.mapWidth && gridPos.y >= 0 && gridPos.y < this.mapHeight) {
                    this.movePlayerTo(gridPos.x, gridPos.y);
                }
            }
        });
    }

    /**
     * 设置游戏事件监听
     */
    private setupGameEvents(): void {
        // 监听时间变化
        gameState.on('time_tick', () => {
            this.updateStatusBar();
            // 每小时有概率触发事件
            const time = gameState.getGameTime();
            if (time.minute === 0 && Math.random() < 0.15) {
                this.tryTriggerWorkplaceEvent();
            }
        });

        // 监听金钱变化
        gameState.on('money_changed', (data: { amount: number; reason: string }) => {
            this.showToast(`${data.amount >= 0 ? '+' : ''}¥${data.amount.toFixed(2)} (${data.reason})`, data.amount >= 0);
            this.updateStatusBar();
        });

        // 监听开始对话事件（从手机发起）
        this.events.on('startChat', (npcName: string) => {
            this.onNPCClick(npcName);
        });

        // 监听新的一天开始
        gameState.on('day_start', () => {
            this.onDayStart();
        });

        // 从事件场景返回
        this.events.on('resume', () => {
            this.updateStatusBar();
        });
    }

    /**
     * 新的一天开始
     */
    private onDayStart(): void {
        const status = workplaceSystem.getStatus();
        const time = gameState.getGameTime();

        // 检查晋升
        const promotionCheck = workplaceSystem.checkPromotion(time.day);
        if (promotionCheck.canPromote) {
            this.showPromotionOpportunity();
        }

        // 重置每日任务
        this.generateDailyTasks();

        // 压力自然恢复
        workplaceSystem.updateStress(-5);

        // 有概率触发事件
        if (Math.random() < 0.4) {
            this.time.delayedCall(2000, () => {
                this.tryTriggerWorkplaceEvent();
            });
        }
    }

    /**
     * 尝试触发职场事件
     */
    private tryTriggerWorkplaceEvent(): void {
        const time = gameState.getGameTime();
        const relationships = new Map<string, number>();

        // 收集关系数据
        ['张经理', '李同事', '王前辈'].forEach(name => {
            const rel = gameState.getRelationship(name);
            relationships.set(name, rel?.favorability ?? 0);
        });

        const event = workplaceSystem.triggerRandomEvent(time.day, relationships);
        if (event) {
            this.showWorkplaceEvent(event);
        }
    }

    /**
     * 显示职场事件
     */
    private showWorkplaceEvent(event: WorkplaceEvent): void {
        this.scene.pause();
        this.scene.launch('WorkplaceEventScene', { event });
    }

    /**
     * 显示晋升机会
     */
    private showPromotionOpportunity(): void {
        const status = workplaceSystem.getStatus();
        const nextLevel = status.position.level + 1;
        const nextPosition = POSITIONS.find(p => p.level === nextLevel);

        if (!nextPosition) return;

        // 创建晋升弹窗
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setScrollFactor(0);
        overlay.setDepth(9998);
        overlay.setInteractive();

        const dialogBg = this.add.rectangle(640, 360, 600, 400, 0x1a3a1a);
        dialogBg.setScrollFactor(0);
        dialogBg.setDepth(9999);
        dialogBg.setStrokeStyle(3, 0x00ff88);

        const items: Phaser.GameObjects.GameObject[] = [overlay, dialogBg];

        const title = this.add.text(640, 200, '🎉 晋升机会', {
            fontSize: '28px',
            color: '#00ff88',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setScrollFactor(0);
        title.setDepth(10000);
        items.push(title);

        const content = this.add.text(640, 300, [
            `恭喜！你有机会晋升为「${nextPosition.title}」`,
            '',
            `当前职位: ${status.position.title}`,
            `新职位薪资: ¥${nextPosition.salary}`,
            `影响力提升: ${status.position.influence} → ${nextPosition.influence}`
        ].join('\n'), {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        });
        content.setOrigin(0.5, 0.5);
        content.setScrollFactor(0);
        content.setDepth(10000);
        items.push(content);

        const acceptBtn = this.add.text(520, 450, '接受晋升', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#006600',
            padding: { x: 20, y: 10 }
        });
        acceptBtn.setOrigin(0.5, 0.5);
        acceptBtn.setScrollFactor(0);
        acceptBtn.setDepth(10000);
        acceptBtn.setInteractive({ useHandCursor: true });
        acceptBtn.on('pointerdown', () => {
            workplaceSystem.promote();
            gameState.getPlayer().position = nextPosition.title;
            gameState.getPlayer().salary = nextPosition.salary;
            this.showToast(`🎉 恭喜晋升为 ${nextPosition.title}!`, true);
            items.forEach(item => item.destroy());
            this.updateStatusBar();
        });
        items.push(acceptBtn);

        const declineBtn = this.add.text(760, 450, '暂时不需要', {
            fontSize: '16px',
            color: '#888888',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        declineBtn.setOrigin(0.5, 0.5);
        declineBtn.setScrollFactor(0);
        declineBtn.setDepth(10000);
        declineBtn.setInteractive({ useHandCursor: true });
        declineBtn.on('pointerdown', () => {
            items.forEach(item => item.destroy());
        });
        items.push(declineBtn);
    }

    /**
     * 创建 UI
     */
    private createUI(): void {
        // 操作说明
        this.instructionText = this.add.text(10, 10, [
            '【操作说明】',
            'WASD / 方向键：移动',
            'P 键：打开手机',
            '点击电脑：查看任务',
            '点击同事：对话'
        ].join('\n'), {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 10 }
        });
        this.instructionText.setScrollFactor(0);
        this.instructionText.setDepth(10000);

        // 状态栏
        this.statusBar = this.add.text(10, 680, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333333dd',
            padding: { x: 10, y: 5 }
        });
        this.statusBar.setScrollFactor(0);
        this.statusBar.setDepth(10000);
        this.updateStatusBar();

        // 手机按钮
        const phoneBtn = this.add.text(1200, 680, '📱 手机 (P)', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 15, y: 8 }
        });
        phoneBtn.setScrollFactor(0);
        phoneBtn.setDepth(10000);
        phoneBtn.setInteractive({ useHandCursor: true });
        phoneBtn.on('pointerdown', () => this.openPhone());
    }

    /**
     * 更新状态栏
     */
    private updateStatusBar(): void {
        const account = gameState.getAccount();
        const player = gameState.getPlayer();
        const time = gameState.getFormattedTime();
        const workplace = workplaceSystem.getStatus();

        // 压力颜色
        let stressColor = '';
        if (workplace.stress >= 80) stressColor = '🔴';
        else if (workplace.stress >= 50) stressColor = '🟡';
        else stressColor = '🟢';

        this.statusBar.setText(
            `💰 ¥${account.cash.toFixed(0)} | 📈 ¥${account.stockValue.toFixed(0)} | ` +
            `👤 ${workplace.position.title} | 📊 KPI:${workplace.performance.kpiScore} | ` +
            `${stressColor} 压力:${workplace.stress} | ⏰ ${time}`
        );
    }

    /**
     * 打开手机
     */
    private openPhone(): void {
        this.scene.pause();
        this.scene.launch('PhoneScene');
    }

    /**
     * 显示提示
     */
    private showToast(message: string, success: boolean = true): void {
        const toast = this.add.text(640, 100, message, {
            fontSize: '16px',
            color: success ? '#00ff88' : '#ff4444',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        toast.setOrigin(0.5, 0.5);
        toast.setScrollFactor(0);
        toast.setDepth(10001);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 50,
            duration: 2000,
            onComplete: () => toast.destroy()
        });
    }

    /**
     * 移动玩家到指定网格位置
     */
    private movePlayerTo(gridX: number, gridY: number): void {
        this.playerGridX = gridX;
        this.playerGridY = gridY;

        const pos = IsoUtils.gridToScreen(gridX, gridY, this.mapOffsetX, this.mapOffsetY);

        // 使用 tween 平滑移动
        this.tweens.add({
            targets: this.player,
            x: pos.x,
            y: pos.y - 16,
            duration: 300,
            ease: 'Power2',
            onUpdate: () => {
                // 更新深度排序
                this.player.setDepth(this.player.y + 100);
                // 更新名字标签位置
                const nameTag = this.player.getData('nameTag') as Phaser.GameObjects.Text;
                if (nameTag) {
                    nameTag.setPosition(this.player.x, this.player.y - 34);
                }
            }
        });
    }

    /**
     * 电脑点击事件
     */
    private onComputerClick(deskIndex: number): void {
        console.log(`点击了第 ${deskIndex + 1} 号工位的电脑`);

        // 检查是否是玩家的工位（第一个）
        if (deskIndex === 0) {
            this.showTaskMenu();
        } else {
            this.showDialog('同事的电脑', '这是别人的工位，不能随便用哦~');
        }
    }

    /**
     * 显示任务菜单
     */
    private showTaskMenu(): void {
        // 确保有任务
        let tasks = gameState.getTodayTasks();
        if (tasks.length === 0) {
            // 添加默认任务
            this.generateDailyTasks();
            tasks = gameState.getTodayTasks();
        }

        // 创建任务菜单弹窗
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);
        overlay.setScrollFactor(0);
        overlay.setDepth(9998);
        overlay.setInteractive();

        const menuBg = this.add.rectangle(640, 360, 600, 500, 0x2a2a3a);
        menuBg.setScrollFactor(0);
        menuBg.setDepth(9999);
        menuBg.setStrokeStyle(2, 0x4a90d9);

        const title = this.add.text(640, 150, '工作电脑 - 今日任务', {
            fontSize: '24px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        title.setScrollFactor(0);
        title.setDepth(10000);

        const menuItems: Phaser.GameObjects.GameObject[] = [overlay, menuBg, title];

        // 显示任务列表
        tasks.forEach((task, index) => {
            const y = 220 + index * 100;

            const taskCard = this.add.rectangle(640, y, 550, 80, 0x3a3a4a);
            taskCard.setScrollFactor(0);
            taskCard.setDepth(9999);
            taskCard.setInteractive({ useHandCursor: true });
            menuItems.push(taskCard);

            const taskTitle = this.add.text(400, y - 15, task.title, {
                fontSize: '16px',
                color: '#ffffff'
            });
            taskTitle.setScrollFactor(0);
            taskTitle.setDepth(10000);
            menuItems.push(taskTitle);

            const taskInfo = this.add.text(400, y + 10, `难度: ${task.difficulty} | 奖励: ¥${task.reward} | 进度: ${task.progress}%`, {
                fontSize: '12px',
                color: '#888888'
            });
            taskInfo.setScrollFactor(0);
            taskInfo.setDepth(10000);
            menuItems.push(taskInfo);

            const startBtn = this.add.text(820, y, task.progress >= 100 ? '已完成' : '开始', {
                fontSize: '14px',
                color: task.progress >= 100 ? '#888888' : '#00ff88',
                backgroundColor: task.progress >= 100 ? '#333333' : '#224422',
                padding: { x: 15, y: 8 }
            });
            startBtn.setOrigin(0.5, 0.5);
            startBtn.setScrollFactor(0);
            startBtn.setDepth(10000);
            if (task.progress < 100) {
                startBtn.setInteractive({ useHandCursor: true });
                startBtn.on('pointerdown', () => {
                    // 关闭菜单并启动游戏
                    menuItems.forEach(item => item.destroy());
                    this.startTaskGame(task);
                });
            }
            menuItems.push(startBtn);
        });

        // 关闭按钮
        const closeBtn = this.add.text(640, 550, '[ 关闭 ]', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 30, y: 10 }
        });
        closeBtn.setOrigin(0.5, 0.5);
        closeBtn.setScrollFactor(0);
        closeBtn.setDepth(10000);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            menuItems.forEach(item => item.destroy());
            closeBtn.destroy();
        });
        menuItems.push(closeBtn);

        overlay.on('pointerdown', () => {
            menuItems.forEach(item => item.destroy());
        });
    }

    /**
     * 生成每日任务
     */
    private generateDailyTasks(): void {
        const taskTemplates = [
            { title: '完成季度报告', type: 'document' as const, difficulty: 'medium' as const, reward: 200 },
            { title: '回复客户邮件', type: 'communication' as const, difficulty: 'easy' as const, reward: 100 },
            { title: '整理项目文档', type: 'document' as const, difficulty: 'easy' as const, reward: 80 },
            { title: '参加部门会议', type: 'meeting' as const, difficulty: 'medium' as const, reward: 150 },
        ];

        // 随机选择3个任务
        const shuffled = [...taskTemplates].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 3);

        selected.forEach((template, index) => {
            gameState.addTask({
                id: `task_day${gameState.getGameTime().day}_${index}`,
                title: template.title,
                description: '',
                type: template.type,
                difficulty: template.difficulty,
                reward: template.reward,
                deadline: '18:00',
                status: 'pending',
                progress: 0
            });
        });
    }

    /**
     * 启动任务小游戏
     */
    private startTaskGame(task: { id: string; title: string; type: string; difficulty: string; reward: number }): void {
        // 根据任务类型选择游戏
        let gameType: 'typing' | 'sorting' | 'memory' | 'clicking' = 'typing';

        switch (task.type) {
            case 'document':
                gameType = 'typing';
                break;
            case 'communication':
                gameType = 'memory';
                break;
            case 'meeting':
                gameType = 'sorting';
                break;
            default:
                gameType = 'clicking';
        }

        this.scene.pause();
        this.scene.launch('TaskGameScene', { task, gameType });
    }

    /**
     * NPC 点击事件
     */
    private onNPCClick(npcName: string): void {
        console.log(`点击了 ${npcName}`);
        this.showChatDialog(npcName);
    }

    /**
     * 显示聊天对话框 - AI 驱动
     */
    private showChatDialog(npcName: string): void {
        const relationship = gameState.getRelationship(npcName);
        const player = gameState.getPlayer();
        const workplace = workplaceSystem.getStatus();

        // 创建对话框
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);
        overlay.setScrollFactor(0);
        overlay.setDepth(9998);
        overlay.setInteractive();

        const dialogBg = this.add.rectangle(640, 360, 750, 550, 0x1a1a2a);
        dialogBg.setScrollFactor(0);
        dialogBg.setDepth(9999);
        dialogBg.setStrokeStyle(2, 0x4a90d9);

        const dialogItems: Phaser.GameObjects.GameObject[] = [overlay, dialogBg];

        // NPC 信息
        const npcTitle = this.add.text(640, 120, npcName, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        npcTitle.setOrigin(0.5, 0.5);
        npcTitle.setScrollFactor(0);
        npcTitle.setDepth(10000);
        dialogItems.push(npcTitle);

        // 好感度显示
        const favColor = relationship && relationship.favorability > 0 ? '#00ff88' :
            relationship && relationship.favorability < 0 ? '#ff4444' : '#888888';
        const favText = this.add.text(640, 150, `❤️ 好感度: ${relationship?.favorability ?? 0}`, {
            fontSize: '14px',
            color: favColor
        });
        favText.setOrigin(0.5, 0.5);
        favText.setScrollFactor(0);
        favText.setDepth(10000);
        dialogItems.push(favText);

        // 对话历史区域
        const chatArea = this.add.rectangle(640, 320, 680, 250, 0x2a2a3a);
        chatArea.setScrollFactor(0);
        chatArea.setDepth(9999);
        dialogItems.push(chatArea);

        // NPC 对话内容
        const responseText = this.add.text(640, 320, '正在思考...', {
            fontSize: '15px',
            color: '#cccccc',
            wordWrap: { width: 640 },
            align: 'center',
            lineSpacing: 6
        });
        responseText.setOrigin(0.5, 0.5);
        responseText.setScrollFactor(0);
        responseText.setDepth(10000);
        dialogItems.push(responseText);

        // 加载 AI 初始问候
        this.loadAIGreeting(npcName, responseText, player, workplace);

        // 快捷对话选项
        const quickOptions = this.getQuickChatOptions(npcName);
        quickOptions.forEach((option, index) => {
            const x = 380 + (index % 2) * 260;
            const y = 480 + Math.floor(index / 2) * 45;

            const optionBtn = this.add.text(x, y, option.text, {
                fontSize: '13px',
                color: '#4a90d9',
                backgroundColor: '#3a3a4a',
                padding: { x: 12, y: 6 }
            });
            optionBtn.setOrigin(0.5, 0.5);
            optionBtn.setScrollFactor(0);
            optionBtn.setDepth(10000);
            optionBtn.setInteractive({ useHandCursor: true });

            optionBtn.on('pointerover', () => optionBtn.setStyle({ backgroundColor: '#4a4a5a' }));
            optionBtn.on('pointerout', () => optionBtn.setStyle({ backgroundColor: '#3a3a4a' }));
            optionBtn.on('pointerdown', async () => {
                // 显示加载
                responseText.setText('正在思考...');

                // 调用 AI
                const result = await apiService.chatWithNPC(
                    npcName,
                    option.text,
                    { name: player.name, position: player.position, day: player.day },
                    {
                        kpi: workplace.performance.kpiScore,
                        stress: workplace.stress,
                        reputation: workplace.reputation,
                        faction: workplace.currentFaction
                    }
                );

                // 更新对话内容
                responseText.setText(result.npc_response);

                // 更新关系
                if (result.relationship_change !== 0) {
                    gameState.updateRelationship(npcName, result.relationship_change);
                    favText.setText(`❤️ 好感度: ${(relationship?.favorability ?? 0) + result.relationship_change}`);

                    const feedback = result.relationship_change > 0 ?
                        `❤️ ${npcName}对你的好感度提升了!` :
                        `💔 ${npcName}对你的好感度下降了...`;
                    this.showToast(feedback, result.relationship_change > 0);
                }
            });

            dialogItems.push(optionBtn);
        });

        // 自定义输入按钮
        const customBtn = this.add.text(640, 570, '💬 自由对话', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 20, y: 8 }
        });
        customBtn.setOrigin(0.5, 0.5);
        customBtn.setScrollFactor(0);
        customBtn.setDepth(10000);
        customBtn.setInteractive({ useHandCursor: true });
        customBtn.on('pointerdown', () => {
            this.showCustomInputDialog(npcName, responseText, dialogItems, favText, player, workplace);
        });
        dialogItems.push(customBtn);

        // 关闭按钮
        const closeBtn = this.add.text(640, 620, '[ 结束对话 ]', {
            fontSize: '14px',
            color: '#888888'
        });
        closeBtn.setOrigin(0.5, 0.5);
        closeBtn.setScrollFactor(0);
        closeBtn.setDepth(10000);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            dialogItems.forEach(item => item.destroy());
        });
        dialogItems.push(closeBtn);

        overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 只有点击背景时关闭
            if (pointer.y < 100 || pointer.y > 650) {
                dialogItems.forEach(item => item.destroy());
            }
        });
    }

    /**
     * 加载 AI 初始问候
     */
    private async loadAIGreeting(
        npcName: string,
        responseText: Phaser.GameObjects.Text,
        player: { name: string; position: string; day: number },
        workplace: { performance: { kpiScore: number }; stress: number; reputation: number; currentFaction: string | null }
    ): Promise<void> {
        try {
            const result = await apiService.chatWithNPC(
                npcName,
                '你好',
                { name: player.name, position: player.position, day: player.day },
                {
                    kpi: workplace.performance.kpiScore,
                    stress: workplace.stress,
                    reputation: workplace.reputation,
                    faction: workplace.currentFaction
                }
            );
            responseText.setText(result.npc_response);
        } catch {
            responseText.setText(this.getNPCResponse(npcName, 0));
        }
    }

    /**
     * 显示自定义输入对话框
     */
    private showCustomInputDialog(
        npcName: string,
        responseText: Phaser.GameObjects.Text,
        parentItems: Phaser.GameObjects.GameObject[],
        favText: Phaser.GameObjects.Text,
        player: { name: string; position: string; day: number },
        workplace: { performance: { kpiScore: number }; stress: number; reputation: number; currentFaction: string | null }
    ): void {
        // 使用浏览器原生 prompt
        const userInput = prompt('输入你想说的话：');
        if (!userInput || userInput.trim() === '') return;

        responseText.setText('正在思考...');

        // 调用 AI
        apiService.chatWithNPC(
            npcName,
            userInput,
            { name: player.name, position: player.position, day: player.day },
            {
                kpi: workplace.performance.kpiScore,
                stress: workplace.stress,
                reputation: workplace.reputation,
                faction: workplace.currentFaction
            }
        ).then(result => {
            responseText.setText(result.npc_response);

            if (result.relationship_change !== 0) {
                const relationship = gameState.getRelationship(npcName);
                gameState.updateRelationship(npcName, result.relationship_change);
                favText.setText(`❤️ 好感度: ${(relationship?.favorability ?? 0) + result.relationship_change}`);

                const feedback = result.relationship_change > 0 ?
                    `❤️ ${npcName}对你的好感度提升了!` :
                    `💔 ${npcName}对你的好感度下降了...`;
                this.showToast(feedback, result.relationship_change > 0);
            }
        });
    }

    /**
     * 获取快捷对话选项
     */
    private getQuickChatOptions(npcName: string): Array<{ text: string }> {
        const options: { [key: string]: Array<{ text: string }> } = {
            '张经理': [
                { text: '汇报工作进度' },
                { text: '请教工作问题' },
                { text: '问问晋升机会' },
                { text: '表忠心' }
            ],
            '李同事': [
                { text: '一起吃午饭' },
                { text: '打听公司八卦' },
                { text: '抱怨工作' },
                { text: '问问谁好相处' }
            ],
            '王前辈': [
                { text: '请教职场经验' },
                { text: '请教技术问题' },
                { text: '问问公司内幕' },
                { text: '表达感谢' }
            ]
        };
        return options[npcName] || options['李同事'];
    }

    /**
     * 获取 NPC 回复
     */
    private getNPCResponse(npcName: string, favorability: number): string {
        const responses: { [key: string]: { [key: string]: string[] } } = {
            '张经理': {
                positive: [
                    '工作进展不错，继续保持。',
                    '最近表现很好，有潜力。',
                    '有什么想法可以给我提。'
                ],
                neutral: [
                    '有什么事吗？',
                    '记得按时完成工作。',
                    '下周有个重要项目，提前准备一下。'
                ],
                negative: [
                    '工作要上心一点。',
                    '最近表现一般，需要加强。',
                    '别总是来打扰我。'
                ]
            },
            '李同事': {
                positive: [
                    '嘿！朋友！中午一起吃饭吗？',
                    '告诉你个小道消息，张经理最近心情不错~',
                    '有什么不懂的尽管问我！'
                ],
                neutral: [
                    '你好啊，新来的！',
                    '这个任务我之前做过，要帮忙吗？',
                    '公司食堂的红烧肉不错，推荐你试试。'
                ],
                negative: [
                    '啊，你好。',
                    '我有点忙，回头再说。',
                    '嗯...有事吗？'
                ]
            },
            '王前辈': {
                positive: [
                    '年轻人，不错，有前途。',
                    '有什么不懂的尽管问，我当年也是这么过来的。',
                    '这个问题嘛...就像种树，先把根扎稳。'
                ],
                neutral: [
                    '慢慢来，不要急。',
                    '职场路很长，保持耐心。',
                    '有事可以找我聊聊。'
                ],
                negative: [
                    '年轻人要沉稳一点。',
                    '工作要认真对待。',
                    '嗯。'
                ]
            }
        };

        const npcResponses = responses[npcName] || responses['李同事'];
        let category = 'neutral';
        if (favorability > 20) category = 'positive';
        else if (favorability < -20) category = 'negative';

        const categoryResponses = npcResponses[category];
        return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
    }

    /**
     * 获取对话选项
     */
    private getDialogOptions(npcName: string): Array<{ text: string; relationshipChange: number }> {
        const options: { [key: string]: Array<{ text: string; relationshipChange: number }> } = {
            '张经理': [
                { text: '汇报工作进度', relationshipChange: 2 },
                { text: '请教工作问题', relationshipChange: 1 },
                { text: '随便聊聊', relationshipChange: -1 }
            ],
            '李同事': [
                { text: '一起吃午饭', relationshipChange: 3 },
                { text: '请教工作问题', relationshipChange: 2 },
                { text: '说八卦', relationshipChange: 1 }
            ],
            '王前辈': [
                { text: '请教职场经验', relationshipChange: 3 },
                { text: '请教技术问题', relationshipChange: 2 },
                { text: '闲聊', relationshipChange: 0 }
            ]
        };

        return options[npcName] || options['李同事'];
    }

    /**
     * 显示对话框
     */
    private showDialog(title: string, content: string): void {
        // 创建半透明背景
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5);
        overlay.setScrollFactor(0);
        overlay.setDepth(9998);
        overlay.setInteractive();

        // 对话框背景
        const dialogBg = this.add.rectangle(640, 360, 500, 300, 0x2d2d2d);
        dialogBg.setScrollFactor(0);
        dialogBg.setDepth(9999);
        dialogBg.setStrokeStyle(2, 0x4a90d9);

        // 标题
        const titleText = this.add.text(640, 230, title, {
            fontSize: '20px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5, 0.5);
        titleText.setScrollFactor(0);
        titleText.setDepth(10000);

        // 内容
        const contentText = this.add.text(640, 360, content, {
            fontSize: '14px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 450 }
        });
        contentText.setOrigin(0.5, 0.5);
        contentText.setScrollFactor(0);
        contentText.setDepth(10000);

        // 关闭按钮
        const closeBtn = this.add.text(640, 470, '[ 关闭 ]', {
            fontSize: '16px',
            color: '#88ff88',
            backgroundColor: '#333333',
            padding: { x: 20, y: 8 }
        });
        closeBtn.setOrigin(0.5, 0.5);
        closeBtn.setScrollFactor(0);
        closeBtn.setDepth(10000);
        closeBtn.setInteractive({ useHandCursor: true });

        // 关闭对话框
        const closeDialog = () => {
            overlay.destroy();
            dialogBg.destroy();
            titleText.destroy();
            contentText.destroy();
            closeBtn.destroy();
        };

        closeBtn.on('pointerdown', closeDialog);
        overlay.on('pointerdown', closeDialog);
    }

    update(): void {
        // 键盘移动
        if (this.cursors && this.wasd) {
            let dx = 0;
            let dy = 0;

            if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
                dy = -1;
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
                dy = 1;
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
                dx = -1;
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
                dx = 1;
            }

            if (dx !== 0 || dy !== 0) {
                const newX = this.playerGridX + dx;
                const newY = this.playerGridY + dy;

                // 边界检查
                if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight) {
                    this.movePlayerTo(newX, newY);
                }
            }

            // P 键打开手机
            if (this.phoneKey && Phaser.Input.Keyboard.JustDown(this.phoneKey)) {
                this.openPhone();
            }
        }
    }
}
