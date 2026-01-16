import Phaser from 'phaser';
import { apiService } from '../APIService';
import { gameState } from '../GameState';
import { notificationManager } from '../NotificationManager';
import { COLORS, FONTS, applyGlassEffect } from '../UIConfig';
import { workplaceSystem } from '../WorkplaceSystem';

/**
 * 增强版办公室场景
 * 支持：
 * 1. 丰富的场景物品（水杯、键盘、鼠标、文件、同事...）
 * 2. AI驱动的自由指令输入
 * 3. 动态后果系统（影响职场关系、升职、被开除）
 */
export class ImprovedOfficeScene extends Phaser.Scene {
    private commandInput!: Phaser.GameObjects.DOMElement;
    private actionLog: string[] = [];
    private logDisplay!: Phaser.GameObjects.Text;

    // 场景物品
    private sceneObjects: Map<string, {
        sprite: Phaser.GameObjects.Text;
        name: string;
        description: string;
        canInteract: boolean;
    }> = new Map();

    // 同事关系
    private colleagues: Map<string, {
        name: string;
        sprite: Phaser.GameObjects.Text;
        relationship: number; // -100 到 100
        position: string;
    }> = new Map();

    // 玩家状态
    private playerMood: number = 50; // 0-100，心情指数
    private stressLevel: number = 30; // 0-100，压力指数
    private workProgress: number = 0; // 今日工作进度

    // UI 元素
    private statusPanel!: Phaser.GameObjects.Container;
    private commandPanel!: Phaser.GameObjects.Container;
    private playerSprite!: Phaser.GameObjects.Container;
    private playerBody!: Phaser.GameObjects.Graphics;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private worldContainer!: Phaser.GameObjects.Container;
    private worldX = 0;
    private worldY = 0;
    private isMoving = false;
    private moveTime = 0;

    constructor() {
        super({ key: 'ImprovedOfficeScene' });
    }

    create(): void {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e); // 深色背景

        // 创建世界容器
        this.worldContainer = this.add.container(640, 300);

        // 绘制地面（地毯质感）
        this.createIsometricFloor();

        // 绘制墙体
        this.createOfficeWalls();

        // 创建办公室环境
        this.createOfficeEnvironment();

        // 创建同事
        this.createColleagues();

        // 创建玩家 (像素小人)
        this.createPlayer();

        // 标题容器
        const header = this.add.container(640, 60);
        const titleText = this.add.text(0, -15, '🏢 赛博办公室 (2.5D RPG)', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 25, 'ISOMETRIC RPG MODE / WASD TO MOVE / SPACE TO INTERACT', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        }).setOrigin(0.5);
        header.add([titleText, subTitleText]);
        header.setDepth(5000);

        // 输入控制
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.input.keyboard!.addKeys('W,A,S,D');

        // 创建状态栏
        this.createStatusPanel();

        // 创建指令输入框
        this.createCommandInput();

        // 创建行为日志
        this.createActionLog();

        // 提示
        this.showWelcomeMessage();

        // 监听事件
        this.events.on('startChat', (npcName: string) => {
            this.showChatDialog(npcName);
        });
    }

    /**
     * 笛卡尔坐标转等距坐标 (Isometric)
     */
    private cartToIso(x: number, y: number): { x: number, y: number } {
        return {
            x: (x - y),
            y: (x + y) / 2
        };
    }

    /**
     * 创建等距地面 (地毯质感)
     */
    private createIsometricFloor(): void {
        const floorGraphics = this.add.graphics();

        const gridSize = 10; // 缩小网格数量，使空间更紧凑
        const tileSize = 80; // 增大单个瓷砖大小，配合紧凑布局

        for (let x = -gridSize; x < gridSize; x++) {
            for (let y = -gridSize; y < gridSize; y++) {
                const iso = this.cartToIso(x * tileSize, y * tileSize);
                const p1 = this.cartToIso((x + 1) * tileSize, y * tileSize);
                const p2 = this.cartToIso((x + 1) * tileSize, (y + 1) * tileSize);
                const p3 = this.cartToIso(x * tileSize, (y + 1) * tileSize);

                // 交替颜色营造地毯纹理
                const color = ((x + y) % 2 === 0) ? 0x2c3e50 : 0x34495e;
                floorGraphics.fillStyle(color, 1);
                floorGraphics.beginPath();
                floorGraphics.moveTo(iso.x, iso.y);
                floorGraphics.lineTo(p1.x, p1.y);
                floorGraphics.lineTo(p2.x, p2.y);
                floorGraphics.lineTo(p3.x, p3.y);
                floorGraphics.closePath();
                floorGraphics.fillPath();

                // 网格线
                floorGraphics.lineStyle(1, 0x4a90d9, 0.1);
                floorGraphics.strokePath();
            }
        }
        this.worldContainer.add(floorGraphics);
        floorGraphics.setDepth(-10000);
    }

    /**
     * 创建办公室墙体
     */
    private createOfficeWalls(): void {
        const wallGraphics = this.add.graphics();
        const gridSize = 12;
        const tileSize = 60;
        const wallHeight = 100;

        // 后方左墙
        for (let x = -gridSize; x < gridSize; x++) {
            const p1 = this.cartToIso(x * tileSize, -gridSize * tileSize);
            const p2 = this.cartToIso((x + 1) * tileSize, -gridSize * tileSize);

            wallGraphics.fillStyle(0x1a2533, 1);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y);
            wallGraphics.lineTo(p2.x, p2.y);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight);
            wallGraphics.lineTo(p1.x, p1.y - wallHeight);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            wallGraphics.lineStyle(1, 0x4a90d9, 0.2);
            wallGraphics.strokePath();
        }

        // 后方右墙
        for (let y = -gridSize; y < gridSize; y++) {
            const p1 = this.cartToIso(gridSize * tileSize, y * tileSize);
            const p2 = this.cartToIso(gridSize * tileSize, (y + 1) * tileSize);

            wallGraphics.fillStyle(0x243345, 1);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y);
            wallGraphics.lineTo(p2.x, p2.y);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight);
            wallGraphics.lineTo(p1.x, p1.y - wallHeight);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            wallGraphics.lineStyle(1, 0x4a90d9, 0.2);
            wallGraphics.strokePath();
        }

        this.worldContainer.add(wallGraphics);
        wallGraphics.setDepth(-5000);
    }

    private createPlayer(): void {
        this.playerSprite = this.add.container(0, 0);
        this.worldContainer.add(this.playerSprite);

        // 创建像素风格小人 (Soul Knight 风格)
        this.playerBody = this.add.graphics();
        this.drawPixelMan(this.playerBody, 0x00ff88);
        this.playerSprite.add(this.playerBody);

        // 名字标签
        const nameLabel = this.add.text(0, -60, 'YOU', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        this.playerSprite.add(nameLabel);
    }

    /**
     * 绘制更像人的像素角色 (带细节)
     */
    private drawPixelMan(g: Phaser.GameObjects.Graphics, color: number): void {
        g.clear();

        // 影子
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(0, 0, 30, 12);

        // 腿部
        g.fillStyle(0x333333, 1);
        g.fillRect(-8, -10, 6, 10);
        g.fillRect(2, -10, 6, 10);

        // 身体 (西装)
        g.fillStyle(color, 1);
        g.fillRect(-12, -35, 24, 25);
        
        // 衬衫领带
        g.fillStyle(0xffffff, 1);
        g.fillRect(-3, -35, 6, 12);
        g.fillStyle(0xff4444, 1);
        g.fillRect(-1, -30, 2, 8);

        // 头部
        g.fillStyle(0xffdbac, 1);
        g.fillRect(-12, -55, 24, 20); 

        // 眼睛
        g.fillStyle(0xffffff, 1);
        g.fillRect(-7, -48, 5, 5);
        g.fillRect(3, -48, 5, 5);
        g.fillStyle(0x000000, 1);
        g.fillRect(-5, -46, 3, 3);
        g.fillRect(5, -46, 3, 3);

        // 头发
        g.fillStyle(0x222222, 1);
        g.fillRect(-14, -58, 28, 8);
        g.fillRect(-14, -50, 4, 12);
        g.fillRect(10, -50, 4, 12);
    }

    update(time: number): void {
        if (!this.playerSprite) return;

        const speed = 4;
        let dx = 0;
        let dy = 0;

        const keys = this.input.keyboard!.addKeys('W,A,S,D') as any;

        if (this.cursors.left.isDown || keys.A.isDown) dx -= speed;
        if (this.cursors.right.isDown || keys.D.isDown) dx += speed;
        if (this.cursors.up.isDown || keys.W.isDown) dy -= speed;
        if (this.cursors.down.isDown || keys.S.isDown) dy += speed;

        this.isMoving = (dx !== 0 || dy !== 0);

        if (this.isMoving) {
            this.moveTime += 0.15;
            // 走路动画：轻微左右晃动和上下起伏
            this.playerBody.y = Math.sin(this.moveTime * 10) * 1;
            this.playerBody.angle = Math.sin(this.moveTime * 10) * 3;

            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            this.worldX += dx;
            this.worldY += dy;

            // 朝向
            if (dx < 0) this.playerBody.scaleX = -1;
            else if (dx > 0) this.playerBody.scaleX = 1;
        } else {
            this.moveTime += 0.05;
            this.playerBody.y = Math.sin(this.moveTime * 2) * 1;
            this.playerBody.scaleY = 1 + Math.sin(this.moveTime * 2) * 0.01;
            this.playerBody.angle = 0;
        }

        // 限制在办公室内 (更紧凑的边界)
        const limitX = 400;
        const limitY = 400;
        this.worldX = Phaser.Math.Clamp(this.worldX, -limitX, limitX);
        this.worldY = Phaser.Math.Clamp(this.worldY, -limitY, limitY);

        const iso = this.cartToIso(this.worldX, this.worldY);
        this.playerSprite.setPosition(iso.x, iso.y);
        this.playerSprite.setDepth(iso.y + 2000); // 深度排序基础

        // 镜头跟随平滑化
        const targetCamX = 640 - iso.x;
        const targetCamY = 300 - iso.y;
        this.worldContainer.x += (targetCamX - this.worldContainer.x) * 0.1;
        this.worldContainer.y += (targetCamY - this.worldContainer.y) * 0.1;

        // 碰撞/交互检测
        this.sceneObjects.forEach((obj, id) => {
            const dist = Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, obj.sprite.x, obj.sprite.y);
            if (dist < 60) {
                obj.sprite.setAlpha(1);
            } else {
                obj.sprite.setAlpha(0.8);
            }
        });

        // 同事动画
        this.colleagues.forEach(col => {
            col.sprite.scaleY = 1 + Math.sin(time / 1000 + col.sprite.x) * 0.02;
        });
    }

    /**
     * 创建办公室环境（丰富的场景物品）
     */
    private createOfficeEnvironment(): void {
        // 创建更紧凑的工位布局
        const spacingX = 180;
        const spacingY = 150;

        // 第一排工位
        this.createWorkStation(-spacingX, -spacingY, 'YOUR DESK');
        this.createWorkStation(0, -spacingY, 'TEAM A-1');
        this.createWorkStation(spacingX, -spacingY, 'TEAM A-2');

        // 第二排工位 (距离更近)
        this.createWorkStation(-spacingX, 0, 'TEAM B-1');
        this.createWorkStation(0, 0, 'TEAM B-2');
        this.createWorkStation(spacingX, 0, 'TEAM B-3');

        // 第三排工位
        this.createWorkStation(-spacingX, spacingY, 'TEAM C-1');
        this.createWorkStation(0, spacingY, 'TEAM C-2');
        this.createWorkStation(spacingX, spacingY, 'TEAM C-3');

        // 老板办公室/高级工位 (位于前方中心)
        this.createWorkStation(0, -350, 'BOSS OFFICE');
        this.createIsoObject(0, -420, '🚩', 'boss_flag', '公司旗帜', '代表公司的荣誉');

        // 公共设施 (移到更靠近中心的位置)
        this.createIsoObject(-350, -350, '🥤', 'water', '饮水机', '办公室的八卦中心');
        this.createIsoObject(350, -350, '🪴', 'plant1', '大绿植', '净化空气的龟背竹');
        this.createIsoObject(350, 350, '🖨️', 'printer', '打印机', '经常卡纸的老古董');
        this.createIsoObject(-350, 350, '🛋️', 'sofa', '休息区', '短暂逃离工作的避风港');
    }

    /**
     * 创建一个工位组合
     */
    private createWorkStation(x: number, y: number, label: string): void {
        // 绘制工位隔断
        const deskGraphics = this.add.graphics();
        const iso = this.cartToIso(x, y);

        // 桌面
        const p1 = this.cartToIso(x - 60, y - 40);
        const p2 = this.cartToIso(x + 60, y - 40);
        const p3 = this.cartToIso(x + 60, y + 40);
        const p4 = this.cartToIso(x - 60, y + 40);

        deskGraphics.fillStyle(0x444444, 1);
        deskGraphics.beginPath();
        deskGraphics.moveTo(p1.x, p1.y);
        deskGraphics.lineTo(p2.x, p2.y);
        deskGraphics.lineTo(p3.x, p3.y);
        deskGraphics.lineTo(p4.x, p4.y);
        deskGraphics.closePath();
        deskGraphics.fillPath();
        deskGraphics.lineStyle(2, 0x666666);
        deskGraphics.strokePath();

        this.worldContainer.add(deskGraphics);
        deskGraphics.setDepth(iso.y + 900);

        // 放置物品
        this.createIsoObject(x - 20, y - 10, '💻', `comp_${x}_${y}`, `${label} 电脑`, '正在运行代码...');
        this.createIsoObject(x + 20, y + 10, '☕', `cup_${x}_${y}`, '咖啡杯', '熬夜必备');
    }

    private createIsoObject(worldX: number, worldY: number, icon: string, id: string, name: string, description: string): void {
        const iso = this.cartToIso(worldX, worldY);

        const container = this.add.container(iso.x, iso.y);

        // 影子
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.2);
        shadow.fillEllipse(0, 0, 20, 10);
        container.add(shadow);

        const text = this.add.text(0, 0, icon, {
            fontSize: '32px'
        }).setOrigin(0.5, 0.9);
        container.add(text);

        container.setDepth(iso.y + 1000);
        container.setInteractive(new Phaser.Geom.Rectangle(-20, -30, 40, 40), Phaser.Geom.Rectangle.Contains);
        container.input!.cursor = 'pointer';

        this.worldContainer.add(container);

        // 悬停显示名称
        container.on('pointerover', () => {
            text.setScale(1.2);
            const tooltip = this.add.text(0, -60, name, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5);
            tooltip.setDepth(20000);
            container.setData('tooltip', tooltip);
            container.add(tooltip);
        });

        container.on('pointerout', () => {
            text.setScale(1);
            const tooltip = container.getData('tooltip');
            if (tooltip) tooltip.destroy();
        });

        container.on('pointerdown', () => {
            this.showObjectDetail(name, description);
        });

        this.sceneObjects.set(id, {
            sprite: container as any,
            name,
            description,
            canInteract: true
        });
    }

    /**
     * 创建同事
     */
    private createColleagues(): void {
        const colleagues = [
            { name: '王老板', color: 0x000000, wx: 60, wy: -350, position: '公司创始人', relationship: 10 },
            { name: '张经理', color: 0xff4444, wx: 60, wy: -150, position: '项目经理', relationship: 20 },
            { name: '李同事', color: 0x4488ff, wx: 60, wy: 0, position: '前端开发', relationship: 50 },
            { name: '王测试', color: 0xffaa00, wx: 60, wy: 150, position: '测试工程师', relationship: 40 },
            { name: '赵行政', color: 0xff66cc, wx: -300, wy: 350, position: '行政主管', relationship: 60 }
        ];

        colleagues.forEach(col => {
            const iso = this.cartToIso(col.wx, col.wy);
            const container = this.add.container(iso.x, iso.y);

            const body = this.add.graphics();
            this.drawPixelMan(body, col.color);
            container.add(body);

            container.setDepth(iso.y + 1000);
            container.setInteractive(new Phaser.Geom.Rectangle(-20, -40, 40, 50), Phaser.Geom.Rectangle.Contains);
            container.input!.cursor = 'pointer';

            this.worldContainer.add(container);

            // 悬停显示关系
            container.on('pointerover', () => {
                container.setScale(1.2);
                const relationText = col.relationship >= 60 ? '😊关系好' :
                    col.relationship >= 30 ? '😐一般' : '😒关系差';
                const tooltip = this.add.text(0, -70, `${col.name} (${col.position})\n${relationText}`, {
                    fontSize: '12px',
                    color: '#ffffff',
                    backgroundColor: '#000000aa',
                    padding: { x: 8, y: 4 },
                    align: 'center'
                }).setOrigin(0.5);
                tooltip.setDepth(20000);
                container.setData('tooltip', tooltip);
                container.add(tooltip);
            });

            container.on('pointerout', () => {
                container.setScale(1);
                const tooltip = container.getData('tooltip');
                if (tooltip) tooltip.destroy();
            });

            // 点击对话
            container.on('pointerdown', () => {
                this.showChatDialog(col.name);
            });

            this.colleagues.set(col.name, {
                name: col.name,
                sprite: container as any, // 保持类型兼容
                relationship: col.relationship,
                position: col.position
            });
        });
    }

    /**
     * 创建状态栏
     */
    private createStatusPanel(): void {
        this.statusPanel = this.add.container(100, 500);

        const bg = this.add.rectangle(0, 0, 300, 180, COLORS.panel, 0.8);
        bg.setStrokeStyle(1, COLORS.primary, 0.3);
        bg.setOrigin(0, 0);
        applyGlassEffect(bg, 0.8);
        this.statusPanel.add(bg);

        const title = this.add.text(15, 15, 'SYSTEM STATUS / 实时状态', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        this.statusPanel.add(title);

        this.statusPanel.setDepth(1000);
        this.updateStatusDisplay();
    }

    /**
     * 更新状态显示
     */
    private updateStatusDisplay(): void {
        // 清除旧文本
        this.statusPanel.iterate((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Text && child.y > 10) {
                child.destroy();
            }
        });

        const moodColor = this.playerMood >= 60 ? '#00ff88' : this.playerMood >= 30 ? '#ffaa00' : '#ff4444';
        const stressColor = this.stressLevel >= 70 ? '#ff4444' : this.stressLevel >= 40 ? '#ffaa00' : '#00ff88';

        const stats = [
            { label: '心情', value: this.playerMood, color: moodColor },
            { label: '压力', value: this.stressLevel, color: stressColor },
            { label: '工作进度', value: this.workProgress, color: '#4a90d9' }
        ];

        stats.forEach((stat, index) => {
            const y = 40 + index * 40;

            const label = this.add.text(10, y, `${stat.label}:`, {
                fontSize: '14px',
                color: '#cccccc'
            });
            this.statusPanel.add(label);

            const value = this.add.text(100, y, `${stat.value}`, {
                fontSize: '14px',
                color: stat.color,
                fontStyle: 'bold'
            });
            this.statusPanel.add(value);

            // 进度条
            const barBg = this.add.rectangle(150, y + 8, 130, 12, 0x333333);
            barBg.setOrigin(0, 0.5);
            this.statusPanel.add(barBg);

            const bar = this.add.rectangle(150, y + 8, stat.value * 1.3, 12, parseInt(stat.color.replace('#', '0x')));
            bar.setOrigin(0, 0.5);
            this.statusPanel.add(bar);
        });
    }

    /**
     * 创建指令输入框（永久显示）
     */
    private createCommandInput(): void {
        this.commandPanel = this.add.container(440, 600);

        const bg = this.add.rectangle(0, 0, 800, 100, COLORS.panel, 0.9);
        bg.setStrokeStyle(1, COLORS.primary, 0.3);
        bg.setOrigin(0, 0);
        applyGlassEffect(bg, 0.9);
        this.commandPanel.add(bg);

        const title = this.add.text(15, 12, 'COMMAND INTERFACE / 执行指令', {
            fontSize: '11px',
            fontFamily: FONTS.mono,
            color: '#888888'
        });
        this.commandPanel.add(title);

        // 创建输入框+提交按钮（使用HTML）
        const inputHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" id="commandInput" 
                       placeholder="TRY: '砸向同事' / '拿起水杯喝水' / '疯狂加班'..."
                       style="width: 600px; 
                              padding: 12px; 
                              font-size: 14px; 
                              background: rgba(0,0,0,0.3); 
                              color: #ffffff; 
                              border: 1px solid #4a90d9; 
                              border-radius: 4px;
                              outline: none;
                              font-family: Inter, sans-serif;" />
                <button id="commandSubmit"
                        style="width: 100px;
                               padding: 12px;
                               font-size: 14px;
                               background: #4a90d9;
                               color: #ffffff;
                               border: none;
                               border-radius: 4px;
                               cursor: pointer;
                               font-weight: bold;
                               font-family: Inter, sans-serif;">
                    EXECUTE
                </button>
            </div>
        `;

        const input = this.add.dom(440 + 400, 600 + 60, 'div').createFromHTML(inputHTML);
        // 不要把 DOM 元素放入 Container，这会导致缩放和坐标错位
        // this.commandPanel.add(input);
        input.setDepth(2000);

        // 延迟绑定事件，确保DOM已渲染
        this.time.delayedCall(100, () => {
            const inputElement = document.getElementById('commandInput') as HTMLInputElement;
            const submitBtn = document.getElementById('commandSubmit') as HTMLButtonElement;

            inputElement?.addEventListener('focus', () => {
                this.input.keyboard!.enabled = false;
            });
            inputElement?.addEventListener('blur', () => {
                this.input.keyboard!.enabled = true;
            });

            const handleSubmit = () => {
                if (inputElement) {
                    const command = inputElement.value.trim();
                    if (command) {
                        this.processCommand(command);
                        inputElement.value = '';
                    }
                }
            };

            // 回车键提交
            if (inputElement) {
                inputElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        handleSubmit();
                    }
                });
            } else {
                console.error('输入框元素未找到');
            }

            // 按钮点击提交
            if (submitBtn) {
                submitBtn.addEventListener('click', handleSubmit);
                // 按钮悬停效果
                submitBtn.addEventListener('mouseenter', () => {
                    submitBtn.style.background = '#5aa0e9';
                });
                submitBtn.addEventListener('mouseleave', () => {
                    submitBtn.style.background = '#4a90d9';
                });
            }
        });

        this.commandPanel.setDepth(2000);
    }

    /**
     * 创建行为日志
     */
    private createActionLog(): void {
        const logBg = this.add.rectangle(1130, 500, 280, 180, COLORS.panel, 0.6);
        logBg.setStrokeStyle(1, 0xffffff, 0.1);
        logBg.setOrigin(1, 0);
        applyGlassEffect(logBg, 0.6);

        const logTitle = this.add.text(865, 515, 'ACTION LOG / 行为日志', {
            fontSize: '10px',
            fontFamily: FONTS.mono,
            color: '#666666'
        });

        this.logDisplay = this.add.text(865, 545, '', {
            fontSize: '12px',
            fontFamily: FONTS.main,
            color: '#cccccc',
            wordWrap: { width: 250 },
            lineSpacing: 6
        });
    }

    /**
     * 处理玩家指令（AI驱动）
     */
    private async processCommand(command: string): Promise<void> {
        this.addLog(`你: ${command}`);

        // 显示“思考中”
        const thinkingText = this.add.text(640, 360, '判断后果中...', {
            fontSize: '18px',
            color: '#ffaa00',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(10000);

        // 延迟模拟思考时间
        await new Promise(resolve => setTimeout(resolve, 500));

        thinkingText.destroy();

        // 使用简单规则处理（等AI接口完善后再替换）
        this.processWithSimpleRules(command);
    }

    /**
     * 构建上下文信息
     */
    private buildContext(): string {
        let context = `心情: ${this.playerMood}, 压力: ${this.stressLevel}, 工作进度: ${this.workProgress}\n`;
        context += `同事关系:\n`;
        this.colleagues.forEach((col, name) => {
            context += `  ${name}(${col.position}): ${col.relationship}\n`;
        });
        context += `\n可见物品: `;
        context += Array.from(this.sceneObjects.keys()).join(', ');
        return context;
    }

    /**
     * 解析AI响应
     */
    private parseAIResponse(response: string): any {
        try {
            // 尝试从响应中提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败:', e);
        }

        // 默认返回
        return {
            feasible: true,
            description: response.substring(0, 100),
            consequences: '这个行为产生了一些影响...',
            changes: { mood: 0, stress: 0, workProgress: 0, relationships: {} },
            severity: 'normal'
        };
    }

    /**
     * 应用后果
     */
    private applyConsequences(result: any): void {
        // 显示行为描述
        this.addLog(`结果: ${result.description}`);

        if (!result.feasible) {
            this.addLog('系统: 这个行为无法执行！');
            return;
        }

        // 应用数值变化
        if (result.changes) {
            if (result.changes.mood) {
                this.playerMood = Math.max(0, Math.min(100, this.playerMood + result.changes.mood));
            }
            if (result.changes.stress) {
                this.stressLevel = Math.max(0, Math.min(100, this.stressLevel + result.changes.stress));
            }
            if (result.changes.workProgress) {
                this.workProgress = Math.max(0, Math.min(100, this.workProgress + result.changes.workProgress));
            }

            // 更新同事关系
            if (result.changes.relationships) {
                Object.entries(result.changes.relationships).forEach(([name, change]: [string, any]) => {
                    const colleague = this.colleagues.get(name);
                    if (colleague) {
                        colleague.relationship = Math.max(-100, Math.min(100, colleague.relationship + change));
                    }
                });
            }
        }

        // 显示后果
        this.addLog(`后果: ${result.consequences}`);

        // 根据严重性显示通知
        if (result.severity === 'critical') {
            notificationManager.error('严重后果', result.consequences, 8000);
        } else if (result.severity === 'warning') {
            notificationManager.warning('警告', result.consequences, 6000);
        }

        // 更新UI
        this.updateStatusDisplay();

        // 检查触发条件
        this.checkTriggers();
    }

    /**
     * 简单规则处理（替代AI）
     */
    private processWithSimpleRules(command: string): void {
        const lower = command.toLowerCase();

        if (lower.includes('工作') || lower.includes('代码') || lower.includes('电脑')) {
            this.playerMood -= 5;
            this.stressLevel += 5;
            this.workProgress += 10;
            this.addLog('你努力工作了一会儿...');
        } else if (lower.includes('摸鱼') || lower.includes('刷手机') || lower.includes('休息')) {
            this.playerMood += 10;
            this.stressLevel -= 5;
            this.workProgress -= 5;
            this.addLog('你偷偷摸鱼放松了一下...');
        } else if (lower.includes('砸') || lower.includes('攻击') || lower.includes('打')) {
            this.playerMood -= 20;
            this.stressLevel += 30;
            this.addLog('你做出了极端行为！！！');
            notificationManager.error('严重警告', '暴力行为可能导致被开除！', 10000);
        } else {
            this.addLog('你尝试了一些事情...');
        }

        this.updateStatusDisplay();
    }

    /**
     * 检查触发条件（升职、被开除等）
     */
    private checkTriggers(): void {
        // 工作进度满 → 升职机会
        if (this.workProgress >= 100) {
            notificationManager.success('恭喜', '你完成了今天的工作！老板注意到你了...', 8000);
            this.workProgress = 0;
        }

        // 压力过大 → 崩溃
        if (this.stressLevel >= 100) {
            notificationManager.error('压力爆表', '你精神崩溃了，需要休息！', 10000);
            this.stressLevel = 50;
            this.playerMood = 20;
        }

        // 心情过低 → 离职倾向
        if (this.playerMood <= 10) {
            notificationManager.warning('警告', '你的心情极度低落，考虑离职吗？', 8000);
        }
    }

    /**
     * 添加日志
     */
    private addLog(text: string): void {
        this.actionLog.unshift(text);
        if (this.actionLog.length > 8) {
            this.actionLog.pop();
        }
        this.logDisplay.setText(this.actionLog.join('\n'));
    }

    /**
     * 显示对话弹窗
     */
    private showChatDialog(npcName: string): void {
        const colleague = this.colleagues.get(npcName);
        const player = gameState.getPlayer();
        const workplace = workplaceSystem.getStatus();

        // 创建遮罩容器
        const chatContainer = this.add.container(640, 360);
        chatContainer.setDepth(10000);

        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
        overlay.setInteractive();
        chatContainer.add(overlay);

        const dialogBg = this.add.rectangle(0, 0, 800, 450, COLORS.panel, 0.95);
        applyGlassEffect(dialogBg);
        chatContainer.add(dialogBg);

        // 标题
        const title = this.add.text(0, -190, ` 与 ${npcName} 对话中...`, {
            fontSize: '24px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        chatContainer.add(title);

        const divider = this.add.rectangle(0, -150, 740, 1, 0x4a90d9, 0.3);
        chatContainer.add(divider);

        // 回复展示区域
        const responseBg = this.add.rectangle(0, -30, 740, 200, 0xffffff, 0.05);
        chatContainer.add(responseBg);

        const responseText = this.add.text(0, -30, `${npcName}: "你好，有什么事吗？"`, {
            fontSize: '18px',
            fontFamily: FONTS.main,
            color: '#e0e0e0',
            wordWrap: { width: 700 },
            lineSpacing: 8
        }).setOrigin(0.5);
        chatContainer.add(responseText);

        // HTML 输入区域
        const inputHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px; width: 740px;">
                <textarea id="chatInput" 
                          placeholder="输入你想说的话 (Ctrl+Enter 提交)..."
                          style="width: 100%; 
                                 height: 80px;
                                 padding: 12px; 
                                 font-size: 14px; 
                                 background: rgba(255,255,255,0.05); 
                                 color: #ffffff; 
                                 border: 1px solid #4a90d9; 
                                 border-radius: 4px;
                                 outline: none;
                                 resize: none;
                                 font-family: Inter, sans-serif;
                                 box-sizing: border-box;"></textarea>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="chatSubmit"
                            style="padding: 10px 30px;
                                   background: #4a90d9;
                                   color: #ffffff;
                                   border: none;
                                   border-radius: 4px;
                                   cursor: pointer;
                                   font-weight: bold;">
                        SEND MESSAGE
                    </button>
                    <button id="chatClose"
                            style="padding: 10px 30px;
                                   background: rgba(255,255,255,0.1);
                                   color: #ffffff;
                                   border: none;
                                   border-radius: 4px;
                                   cursor: pointer;">
                        CLOSE
                    </button>
                </div>
            </div>
        `;

        const domElement = this.add.dom(640, 360 + 140, 'div').createFromHTML(inputHTML);
        // 不要放入 container
        // chatContainer.add(domElement);
        domElement.setDepth(10001);

        this.time.delayedCall(100, () => {
            const input = document.getElementById('chatInput') as HTMLTextAreaElement;
            const submitBtn = document.getElementById('chatSubmit') as HTMLButtonElement;
            const closeBtn = document.getElementById('chatClose') as HTMLButtonElement;

            input?.focus();

            input?.addEventListener('focus', () => {
                this.input.keyboard!.enabled = false;
            });
            input?.addEventListener('blur', () => {
                this.input.keyboard!.enabled = true;
            });

            const handleSend = () => {
                const message = input.value.trim();
                if (!message) return;

                responseText.setText('正在思考...');
                input.value = '';
                input.disabled = true;
                submitBtn.disabled = true;

                apiService.chatWithNPC(
                    npcName,
                    message,
                    { name: player.name, position: player.position, day: player.day },
                    {
                        kpi: workplace.performance.kpiScore,
                        stress: workplace.stress,
                        reputation: workplace.reputation,
                        faction: workplace.currentFaction
                    }
                ).then(result => {
                    responseText.setText(`${npcName}: "${result.npc_response}"`);

                    if (result.relationship_change !== 0) {
                        gameState.updateRelationship(npcName, result.relationship_change);
                        notificationManager.info('关系变化', `${npcName} 对你的好感 ${result.relationship_change > 0 ? '+' : ''}${result.relationship_change}`, 4000);
                    }

                    input.disabled = false;
                    submitBtn.disabled = false;
                    input.focus();
                }).catch(err => {
                    responseText.setText('系统: 通讯中断，请重试。');
                    input.disabled = false;
                    submitBtn.disabled = false;
                });
            };

            submitBtn?.addEventListener('click', handleSend);
            closeBtn?.addEventListener('click', () => {
                chatContainer.destroy();
                domElement.destroy(); // 销毁 DOM
            });
            input?.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') handleSend();
                if (e.key === 'Escape') {
                    chatContainer.destroy();
                    domElement.destroy(); // 销毁 DOM
                }
            });
        });
    }

    /**
     * 显示物品详情
     */
    private showObjectDetail(name: string, description: string): void {
        const detail = this.add.text(640, 360, `${name}\n\n${description}`, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000dd',
            padding: { x: 20, y: 15 },
            align: 'center',
            wordWrap: { width: 400 }
        }).setOrigin(0.5).setDepth(9999);

        this.time.delayedCall(2000, () => detail.destroy());
    }

    /**
     * 显示欢迎信息
     */
    private showWelcomeMessage(): void {
        this.addLog('欢迎来到职场！');
        this.addLog('你可以在下方输入任何想做的事...');
        this.addLog('点击物品查看详情');
        this.addLog('系统: AI会判断你行为的后果');
    }
}
