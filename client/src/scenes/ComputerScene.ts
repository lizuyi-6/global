import Phaser from 'phaser';
import { gameState } from '../GameState';
import { createStyledButton, FONTS } from '../UIConfig';

export class ComputerScene extends Phaser.Scene {
    private desktopContainer!: Phaser.GameObjects.Container;
    private currentWindow: Phaser.GameObjects.Container | null = null;

    constructor() {
        super({ key: 'ComputerScene' });
    }

    create(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. 半透明背景遮罩
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
            .setInteractive()
            .on('pointerdown', () => {
                // 点击背景不关闭，必须点击关闭按钮
            });

        // 2. 电脑显示器边框 (模拟显示器)
        const monitorFrame = this.add.container(width / 2, height / 2);

        // 显示器外壳
        const frameW = 1400;
        const frameH = 900;
        const frame = this.add.rectangle(0, 0, frameW, frameH, 0x2d3436);
        frame.setStrokeStyle(4, 0x1a1a1a);
        monitorFrame.add(frame);

        // 屏幕区域
        const screenW = 1360;
        const screenH = 800; // Leaving space for bottom chin
        const screenBg = this.add.rectangle(0, -20, screenW, screenH, 0x000000); // Desktop BG
        monitorFrame.add(screenBg);

        // 屏幕内容容器
        this.desktopContainer = this.add.container(-screenW / 2, -screenH / 2 - 20);
        monitorFrame.add(this.desktopContainer);

        // 默认桌面背景 (Windows default blue-ish)
        const wallpaper = this.add.rectangle(screenW / 2, screenH / 2, screenW, screenH, 0x0068a7);
        this.desktopContainer.add(wallpaper);

        // 桌面图标
        this.createDesktopIcons();

        // 任务栏
        const taskbar = this.add.rectangle(screenW / 2, screenH - 20, screenW, 40, 0x1a1a1a);
        this.desktopContainer.add(taskbar);

        // Start 按钮
        const startBtn = this.add.rectangle(30, screenH - 20, 40, 30, 0xffffff);
        this.desktopContainer.add(startBtn);

        // 3. 关闭按钮 (离开电脑)
        const leaveBtn = createStyledButton(this, width / 2 + 600, height / 2 + 500, 200, 60, '离开电脑', () => {
            this.closeComputer();
        }, 'danger');
    }

    private createDesktopIcons(): void {
        // Mail / Work App
        this.createIcon(100, 100, '📧', '工作邮件', () => this.openMailApp());

        // My Computer
        this.createIcon(100, 220, '💻', '我的电脑', () => this.openMyComputer());

        // Trash
        this.createIcon(100, 340, '🗑️', '回收站', () => { });
    }

    private createIcon(x: number, y: number, emoji: string, label: string, onClick: () => void): void {
        const container = this.add.container(x, y);

        const hitArea = this.add.rectangle(0, 0, 80, 90, 0xffffff, 0.01).setInteractive({ useHandCursor: true });

        const icon = this.add.text(0, -15, emoji, { fontSize: '48px' }).setOrigin(0.5);
        const text = this.add.text(0, 35, label, {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            backgroundColor: '#00000000' // Transparent
        }).setOrigin(0.5);

        container.add([hitArea, icon, text]);
        this.desktopContainer.add(container);

        hitArea.on('pointerdown', onClick);
        hitArea.on('pointerover', () => {
            hitArea.setFillStyle(0xffffff, 0.2);
            text.setBackgroundColor('#004e7a');
        });
        hitArea.on('pointerout', () => {
            hitArea.setFillStyle(0xffffff, 0.01);
            text.setBackgroundColor('#00000000');
        });
    }

    private openMailApp(): void {
        if (this.currentWindow) {
            this.currentWindow.destroy();
        }

        const winW = 1000;
        const winH = 700;
        const winX = 1360 / 2;
        const winY = 800 / 2;

        const windowContainer = this.add.container(winX, winY);
        this.currentWindow = windowContainer;
        this.desktopContainer.add(windowContainer);

        // Window Frame
        const bg = this.add.rectangle(0, 0, winW, winH, 0xffffff);
        bg.setStrokeStyle(1, 0xcccccc);
        windowContainer.add(bg);

        // Check if no tasks
        const tasks = gameState.getTodayTasks();

        // Header
        const header = this.add.rectangle(0, -winH / 2 + 20, winW, 40, 0x0068a7);
        const title = this.add.text(-winW / 2 + 10, -winH / 2 + 20, '收件箱 - 今日任务', { fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0.5);
        const closeBtn = this.add.text(winW / 2 - 20, -winH / 2 + 20, 'X', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            windowContainer.destroy();
            this.currentWindow = null;
        });
        windowContainer.add([header, title, closeBtn]);

        // Task List
        if (tasks.length === 0) {
            const noTask = this.add.text(0, 0, '暂无新邮件 (任务)', { fontSize: '24px', color: '#000000' }).setOrigin(0.5);
            windowContainer.add(noTask);
        } else {
            tasks.forEach((task, index) => {
                const itemY = -winH / 2 + 80 + index * 100;

                const itemBg = this.add.rectangle(0, itemY, winW - 40, 80, 0xf0f0f0);
                itemBg.setInteractive({ useHandCursor: true });
                windowContainer.add(itemBg);

                const itemTitle = this.add.text(-winW / 2 + 40, itemY - 20, `[未读] ${task.title}`, { fontSize: '20px', color: '#000000', fontStyle: 'bold' });
                const itemDesc = this.add.text(-winW / 2 + 40, itemY + 10, `${task.description} | 报酬: ¥${task.reward}`, { fontSize: '14px', color: '#666666' });
                const actionBtn = this.add.text(winW / 2 - 100, itemY, '开始处理 >', { fontSize: '16px', color: '#0068a7', fontStyle: 'bold' }).setOrigin(0.5);

                windowContainer.add([itemTitle, itemDesc, actionBtn]);

                itemBg.on('pointerover', () => itemBg.setFillStyle(0xe0e0e0));
                itemBg.on('pointerout', () => itemBg.setFillStyle(0xf0f0f0));
                itemBg.on('pointerdown', () => {
                    this.scene.launch('TaskGameScene', {
                        task: task,
                        gameType: task.type === 'coding' ? 'typing'
                            : task.type === 'meeting' ? 'sorting'
                                : task.type === 'report' ? 'memory'
                                    : 'clicking'
                    });
                    this.closeComputer(); // Close computer when starting task
                    this.scene.pause('ImprovedOfficeScene');
                });
            });
        }
    }
}

    private openMyComputer(): void {
    if(this.currentWindow) {
    this.currentWindow.destroy();
}

const winW = 800;
const winH = 600;
const winX = 1360 / 2;
const winY = 800 / 2;

const windowContainer = this.add.container(winX, winY);
this.currentWindow = windowContainer;
this.desktopContainer.add(windowContainer);

// Window Frame (Glass Effect)
const bg = this.add.rectangle(0, 0, winW, winH, 0xf0f2f5);
bg.setStrokeStyle(1, 0xcccccc);
windowContainer.add(bg);

// Header
const header = this.add.rectangle(0, -winH / 2 + 20, winW, 40, 0x0068a7);
const title = this.add.text(-winW / 2 + 10, -winH / 2 + 20, '我的电脑 - 属性', { fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0.5);
const closeBtn = this.add.text(winW / 2 - 20, -winH / 2 + 20, 'X', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
closeBtn.on('pointerdown', () => {
    windowContainer.destroy();
    this.currentWindow = null;
});
windowContainer.add([header, title, closeBtn]);

// Content
const player = gameState.getPlayer();
const account = gameState.getAccount();

// 1. Sidebar
const sidebar = this.add.rectangle(-winW / 2 + 100, 20, 200, winH - 40, 0xffffff);
windowContainer.add(sidebar);

const avatar = this.add.circle(-winW / 2 + 100, -100, 60, 0x0068a7);
const avatarText = this.add.text(-winW / 2 + 100, -100, player.name.charAt(0), { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
windowContainer.add([avatar, avatarText]);

// 2. Info Grid
const startX = 50;
const startY = -150;
const lineHeight = 50;

const infos = [
    { label: '姓名', value: player.name },
    { label: '职位', value: player.position },
    { label: '月薪', value: `¥${player.salary}` },
    { label: '入职天数', value: `${player.day} 天` },
    { label: '总资产', value: `¥${account.totalAssets.toLocaleString()}` },
    { label: '----------------', value: '' }, // Divider
    { label: '沟通能力', value: `${player.skills.communication}` },
    { label: '技术能力', value: `${player.skills.technical}` },
    { label: '管理能力', value: `${player.skills.management}` }
];

infos.forEach((info, index) => {
    const y = startY + index * lineHeight;
    const label = this.add.text(startX, y, info.label + ':', { fontSize: '20px', color: '#666666', fontStyle: 'bold' });
    const value = this.add.text(startX + 150, y, info.value, { fontSize: '20px', color: '#000000' });
    windowContainer.add([label, value]);
});
    }

    private closeComputer(): void {
    this.scene.stop();
    this.scene.resume('ImprovedOfficeScene');
}
}
