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
        // 获取响应式布局参数
        const { centerX, centerY, width, height } = this.getLayoutInfo();

        // 背景
        this.add.rectangle(centerX, centerY, width, height, 0x1a1a2e); // 深色背景

        // 创建世界容器 (相对于屏幕中心)
        this.worldContainer = this.add.container(centerX, centerY - 60);

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
        const header = this.add.container(centerX, 60);
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

        // 监听胜利事件
        gameState.on('game_win', (data: any) => {
            console.log('[Office] Game Win Triggered:', data);
            this.scene.start('GameOverScene', { success: true, reason: data.reason });
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
     * 创建等距地面 (地毯质感 - 高清重绘)
     */
    private createIsometricFloor(): void {
        const floorGraphics = this.add.graphics();

        const gridSize = 10;
        const tileSize = 80;

        for (let x = -gridSize; x < gridSize; x++) {
            for (let y = -gridSize; y < gridSize; y++) {
                const iso = this.cartToIso(x * tileSize, y * tileSize);
                const p1 = this.cartToIso((x + 1) * tileSize, y * tileSize);
                const p2 = this.cartToIso((x + 1) * tileSize, (y + 1) * tileSize);
                const p3 = this.cartToIso(x * tileSize, (y + 1) * tileSize);

                // 交替颜色营造地毯纹理 - 使用更高级的蓝灰色调
                const isAlt = (x + y) % 2 === 0;
                const baseColor = isAlt ? 0x2c3e50 : 0x34495e;

                // 1. 基础填充
                floorGraphics.fillStyle(baseColor, 1);
                floorGraphics.beginPath();
                floorGraphics.moveTo(iso.x, iso.y);
                floorGraphics.lineTo(p1.x, p1.y);
                floorGraphics.lineTo(p2.x, p2.y);
                floorGraphics.lineTo(p3.x, p3.y);
                floorGraphics.closePath();
                floorGraphics.fillPath();

                // 2. 边缘高光 (模拟地毯接缝反射)
                floorGraphics.lineStyle(1, 0xffffff, 0.05);
                floorGraphics.beginPath();
                floorGraphics.moveTo(iso.x, iso.y);
                floorGraphics.lineTo(p1.x, p1.y);
                floorGraphics.strokePath();

                // 3. 内部纹理 (简单的躁点模拟)
                if (Math.random() > 0.5) {
                    floorGraphics.fillStyle(0xffffff, 0.03);
                    floorGraphics.fillCircle(iso.x, iso.y + 20, 2);
                }
            }
        }
        this.worldContainer.add(floorGraphics);
        floorGraphics.setDepth(-10000);
    }

    /**
     * 创建办公室墙体 (高清重绘)
     */
    private createOfficeWalls(): void {
        const wallGraphics = this.add.graphics();
        const gridSize = 12;
        const tileSize = 60;
        const wallHeight = 120; // 增高墙体

        // 墙体颜色
        const wallColorLeft = 0x1f2937;
        const wallColorRight = 0x111827; // 稍微深一点作为阴影面
        const baseboardColor = 0x000000; // 踢脚线
        const trimColor = 0x374151; // 顶部装饰条

        // 后方左墙
        for (let x = -gridSize; x < gridSize; x++) {
            const p1 = this.cartToIso(x * tileSize, -gridSize * tileSize);
            const p2 = this.cartToIso((x + 1) * tileSize, -gridSize * tileSize);

            // 主墙面
            wallGraphics.fillStyle(wallColorLeft, 1);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y);
            wallGraphics.lineTo(p2.x, p2.y);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight);
            wallGraphics.lineTo(p1.x, p1.y - wallHeight);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            // 踢脚线 (底部 10px)
            wallGraphics.fillStyle(baseboardColor, 0.5);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y);
            wallGraphics.lineTo(p2.x, p2.y);
            wallGraphics.lineTo(p2.x, p2.y - 12);
            wallGraphics.lineTo(p1.x, p1.y - 12);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            // 顶部装饰 (顶部 5px)
            wallGraphics.fillStyle(trimColor, 1);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y - wallHeight);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight + 6);
            wallGraphics.lineTo(p1.x, p1.y - wallHeight + 6);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            // 墙面细节 (每隔几块画个分割线)
            if (x % 4 === 0) {
                wallGraphics.lineStyle(1, 0xffffff, 0.05);
                wallGraphics.beginPath();
                wallGraphics.moveTo(p1.x, p1.y - 12);
                wallGraphics.lineTo(p1.x, p1.y - wallHeight + 6);
                wallGraphics.strokePath();
            }
        }

        // 后方右墙
        for (let y = -gridSize; y < gridSize; y++) {
            const p1 = this.cartToIso(gridSize * tileSize, y * tileSize);
            const p2 = this.cartToIso(gridSize * tileSize, (y + 1) * tileSize);

            // 主墙面
            wallGraphics.fillStyle(wallColorRight, 1);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y);
            wallGraphics.lineTo(p2.x, p2.y);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight);
            wallGraphics.lineTo(p1.x, p1.y - wallHeight);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            // 踢脚线
            wallGraphics.fillStyle(baseboardColor, 0.5);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y);
            wallGraphics.lineTo(p2.x, p2.y);
            wallGraphics.lineTo(p2.x, p2.y - 12);
            wallGraphics.lineTo(p1.x, p1.y - 12);
            wallGraphics.closePath();
            wallGraphics.fillPath();

            // 顶部装饰
            wallGraphics.fillStyle(trimColor, 1);
            wallGraphics.beginPath();
            wallGraphics.moveTo(p1.x, p1.y - wallHeight);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight);
            wallGraphics.lineTo(p2.x, p2.y - wallHeight + 6);
            wallGraphics.lineTo(p1.x, p1.y - wallHeight + 6);
            wallGraphics.closePath();
            wallGraphics.fillPath();
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
    /**
     * 绘制更像人的角色 (矢量风格 - 高清重绘)
     */
    private drawPixelMan(g: Phaser.GameObjects.Graphics, color: number): void {
        g.clear();

        // 影子 (Reduced opacity)
        g.fillStyle(0x000000, 0.1); // 0.2 -> 0.1
        g.fillEllipse(0, 0, 30, 10);

        // 身体 (西装) - 使用圆角矩形代替方块
        g.fillStyle(color, 1);
        g.fillRoundedRect(-12, -38, 24, 28, 4);

        // 衬衫
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(-4, -38, 8, 12, 2);

        // 领带
        g.fillStyle(0xff4444, 1);
        g.beginPath();
        g.moveTo(0, -36);
        g.lineTo(2, -28);
        g.lineTo(0, -24);
        g.lineTo(-2, -28);
        g.closePath();
        g.fillPath();

        // 头部 - 圆形
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(0, -48, 10);

        // 眼睛
        g.fillStyle(0xffffff, 1);
        g.fillCircle(-4, -48, 3);
        g.fillCircle(4, -48, 3);
        g.fillStyle(0x000000, 1);
        g.fillCircle(-4, -48, 1.5);
        g.fillCircle(4, -48, 1.5);

        // 头发 (简单的刘海)
        g.fillStyle(0x2d3436, 1);
        g.beginPath();
        g.arc(0, -48, 10.5, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
        g.fillPath();

        // 腿 - 圆角
        g.fillStyle(0x2d3436, 1);
        g.fillRoundedRect(-8, -12, 6, 12, 2);
        g.fillRoundedRect(2, -12, 6, 12, 2);
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

        // 第一排工位 - 玩家工位高亮
        this.createWorkStation(-spacingX, -spacingY, '我的工位', true); // 玩家工位，高亮
        this.createWorkStation(0, -spacingY, '李同事的工位', false);
        this.createWorkStation(spacingX, -spacingY, '王测试的工位', false);

        // 第二排工位 (距离更近)
        this.createWorkStation(-spacingX, 0, '张经理的工位', false);
        this.createWorkStation(0, 0, '空工位A', false);
        this.createWorkStation(spacingX, 0, '空工位B', false);

        // 第三排工位
        this.createWorkStation(-spacingX, spacingY, '赵行政的工位', false);
        this.createWorkStation(0, spacingY, '空工位C', false);
        this.createWorkStation(spacingX, spacingY, '休息区', false);

        // 老板办公室/高级工位 (位于前方中心)
        this.createWorkStation(0, -350, '王老板的办公室', false);
        this.createIsoObject(0, -420, 'flag', '公司旗帜', '代表公司的荣誉');

        // 公共设施 - 使用唯一中文名称
        this.createIsoObject(-350, -350, 'water', '饮水机', '办公室的八卦中心');
        this.createIsoObject(350, -350, 'plant', '大绿植', '净化空气的龟背竹');
        this.createIsoObject(350, 350, 'printer', '打印机', '经常卡纸的老古董');
        this.createIsoObject(-350, 350, 'sofa', '休息沙发', '短暂逃离工作的避风港');

        // 桌上物品 - 唯一命名
        this.createIsoObject(-spacingX - 30, -spacingY - 20, 'cup', '我的咖啡杯', '你的咖啡杯，还有半杯');
        this.createIsoObject(0 - 30, -spacingY - 20, 'cup', '李同事的咖啡杯', '李同事的咖啡杯');
        this.createIsoObject(-spacingX + 40, 0 - 20, 'cup', '张经理的水杯', '张经理专用保温杯');
    }

    /**
     * 创建一个工位组合 (高清重绘)
     */
    private createWorkStation(x: number, y: number, label: string, isPlayerDesk: boolean = false): void {
        const deskGraphics = this.add.graphics();
        const iso = this.cartToIso(x, y);

        // 桌面参数
        const deskW = 120;
        const deskH = 80;
        const thickness = 6;

        // 玩家工位高亮光环
        if (isPlayerDesk) {
            deskGraphics.fillStyle(0x00ff88, 0.15);
            deskGraphics.fillEllipse(0, 30, deskW * 1.5, deskH * 1.2);
            // 脉动动画效果
            const pulseGlow = this.add.graphics();
            pulseGlow.fillStyle(0x00ff88, 0.1);
            pulseGlow.fillEllipse(0, 30, deskW * 1.3, deskH);
            pulseGlow.x = iso.x;
            pulseGlow.y = iso.y;
            this.worldContainer.add(pulseGlow);
            pulseGlow.setDepth(iso.y + 899);
            this.tweens.add({
                targets: pulseGlow,
                alpha: { from: 0.3, to: 0.1 },
                scale: { from: 1, to: 1.2 },
                duration: 1500,
                yoyo: true,
                repeat: -1
            });
        }

        // 投影
        deskGraphics.fillStyle(0x000000, 0.2);
        const shadowIso = this.cartToIso(x, y);
        deskGraphics.fillEllipse(0, 50, deskW * 1.2, deskH * 0.8);

        // 桌面 (木纹)
        // 顶面 - 需要手动计算等距投影的四个点，或者使用简化的绘制
        // 这里使用路径绘制等距矩形
        const p1 = this.cartToIso(x - 60, y - 40);
        const p2 = this.cartToIso(x + 60, y - 40);
        const p3 = this.cartToIso(x + 60, y + 40);
        const p4 = this.cartToIso(x - 60, y + 40);

        // 桌面侧边 (厚度)
        deskGraphics.fillStyle(0x2d3436, 1); // 深色底座/阴影
        deskGraphics.beginPath();
        deskGraphics.moveTo(p4.x, p4.y);
        deskGraphics.lineTo(p3.x, p3.y);
        deskGraphics.lineTo(p3.x, p3.y + thickness + 30); // 腿的高度
        deskGraphics.lineTo(p4.x, p4.y + thickness + 30);
        deskGraphics.closePath();
        deskGraphics.fillPath();

        // 桌面厚度
        deskGraphics.fillStyle(isPlayerDesk ? 0x2d6a4f : 0x636e72, 1); // 玩家工位用绿色边
        deskGraphics.beginPath();
        deskGraphics.moveTo(p4.x, p4.y);
        deskGraphics.lineTo(p3.x, p3.y);
        deskGraphics.lineTo(p3.x, p3.y + thickness);
        deskGraphics.lineTo(p2.x, p2.y + thickness); // 修正：透视逻辑
        deskGraphics.lineTo(p4.x, p4.y + thickness);
        deskGraphics.closePath();
        deskGraphics.fillPath();

        // 桌面顶面 (圆角效果难做，用颜色区分)
        deskGraphics.fillStyle(isPlayerDesk ? 0x1b4332 : 0x444444, 1); // 玩家工位用深绿色
        deskGraphics.beginPath();
        deskGraphics.moveTo(p1.x, p1.y);
        deskGraphics.lineTo(p2.x, p2.y);
        deskGraphics.lineTo(p3.x, p3.y);
        deskGraphics.lineTo(p4.x, p4.y);
        deskGraphics.closePath();
        deskGraphics.fillPath();

        // 桌面高光边缘
        deskGraphics.lineStyle(isPlayerDesk ? 2 : 1, isPlayerDesk ? 0x00ff88 : 0x666666, isPlayerDesk ? 0.8 : 0.5);
        deskGraphics.strokePath();

        this.worldContainer.add(deskGraphics);
        deskGraphics.setDepth(iso.y + 900);

        // 放置物品
        this.createIsoObject(x - 20, y - 10, 'comp', `comp_${x}_${y}`, `${label} 电脑`, '点击打开任务列表');
        this.createIsoObject(x + 20, y + 10, 'cup', `cup_${x}_${y}`, '咖啡杯', '熬夜必备');

        // 玩家工位提示 (引导交互)
        if (isPlayerDesk) {
            const hintContainer = this.add.container(iso.x - 20, iso.y - 120);

            // 箭头
            const arrow = this.add.text(0, 0, '⬇️', { fontSize: '32px' }).setOrigin(0.5);

            // 标签
            const labelText = this.add.text(0, -35, '接收任务', {
                fontSize: '16px',
                fontFamily: FONTS.main,
                color: '#ffffff',
                backgroundColor: '#0068a7',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5);

            // 提示背景 glow
            const glow = this.add.graphics();
            glow.fillStyle(0x0068a7, 0.3);
            glow.fillCircle(0, -35, 40);

            hintContainer.add([glow, arrow, labelText]);
            this.worldContainer.add(hintContainer);
            hintContainer.setDepth(iso.y + 20000); // 确保在最上层

            // 上下浮动动画
            this.tweens.add({
                targets: hintContainer,
                y: hintContainer.y - 15,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // 光晕脉冲
            this.tweens.add({
                targets: glow,
                alpha: 0.1,
                scale: 1.2,
                duration: 1200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    private createIsoObject(worldX: number, worldY: number, type: string, id: string, name: string, description: string): void {
        const iso = this.cartToIso(worldX, worldY);
        const container = this.add.container(iso.x, iso.y);

        // 影子 (Reduced opacity to avoid black artifacts)
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.1); // 0.2 -> 0.1
        shadow.fillEllipse(0, 0, 30, 15);
        container.add(shadow);

        // 根据类型绘制不同的矢量图形
        const g = this.add.graphics();
        container.add(g);

        switch (type) {
            case 'water': // 饮水机
                this.drawWaterCooler(g);
                break;
            case 'plant1': // 绿植
            case 'plant':
                this.drawPlant(g);
                break;
            case 'printer': // 打印机
                this.drawPrinter(g);
                break;
            case 'sofa': // 沙发
                this.drawSofa(g);
                break;
            case 'boss_flag': // 旗帜
                this.drawFlag(g);
                break;
            case 'comp': // 电脑 (作为独立物品时)
                this.drawComputer(g);
                // 添加交互：点击打开任务列表
                container.setInteractive(new Phaser.Geom.Rectangle(-20, -20, 40, 40), Phaser.Geom.Rectangle.Contains);
                container.on('pointerdown', () => {
                    this.scene.launch('ComputerScene');
                    this.scene.pause();
                });
                break;
            case 'cup': // 杯子
                this.drawCup(g);
                break;
            default:
                // 默认使用原来的 Emoji (如果没有对应的绘图函数)
                if (type.length < 5) { // 假设短字符串是 Emoji
                    const text = this.add.text(0, 0, type, { fontSize: '32px' }).setOrigin(0.5, 0.9);
                    container.add(text);
                } else {
                    // 默认方块
                    g.fillStyle(0xffffff, 1);
                    g.fillRoundedRect(-15, -30, 30, 30, 4);
                }
                break;
        }

        container.setDepth(iso.y + 1000);
        container.setInteractive(new Phaser.Geom.Rectangle(-20, -60, 40, 60), Phaser.Geom.Rectangle.Contains);
        container.input!.cursor = 'pointer';

        this.worldContainer.add(container);

        // 悬停显示名称
        container.on('pointerover', () => {
            container.setScale(1.1);
            const tooltip = this.add.text(0, -70, name, {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 8, y: 4 },
                fontFamily: 'Inter, sans-serif'
            }).setOrigin(0.5);
            tooltip.setDepth(9999);
            container.add(tooltip);
            container.setData('tooltip', tooltip);
        });

        container.on('pointerout', () => {
            container.setScale(1);
            const tooltip = container.getData('tooltip');
            if (tooltip) tooltip.destroy();
        });

        // 保存引用 - 使用中文名称作为 key，方便命令匹配
        if (!this.sceneObjects.has(name)) {
            this.sceneObjects.set(name, {
                sprite: container as any,
                name,
                description,
                canInteract: true
            });
        }
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
    /**
     * 创建状态栏
     */
    private createStatusPanel(): void {
        // Move to Bottom Left (Fixed 2K coordinates: x=40, y=1440 - 300 - 40 = 1100)
        this.statusPanel = this.add.container(40, 1100);

        // Increase size from 300x240 -> 400x300
        const bg = this.add.rectangle(0, 0, 400, 300, COLORS.panel, 0.8);
        bg.setStrokeStyle(1, COLORS.primary, 0.3);
        bg.setOrigin(0, 0);
        applyGlassEffect(bg, 0.8);
        this.statusPanel.add(bg);

        // Increase title font size 12px -> 18px
        const title = this.add.text(20, 20, 'SYSTEM STATUS / 实时状态', {
            fontSize: '18px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        this.statusPanel.add(title);

        // 手机按钮 - Increase size and font
        // Pos: 300, 250 (adjusted for wider panel)
        const phoneBtn = this.add.rectangle(320, 250, 120, 50, 0x00aa55, 1);
        phoneBtn.setStrokeStyle(2, 0x00ff88, 1);
        phoneBtn.setInteractive({ useHandCursor: true });
        this.statusPanel.add(phoneBtn);

        const phoneBtnText = this.add.text(320, 250, '📱手机', {
            fontSize: '20px', // 14px -> 20px
            color: '#ffffff',
            fontFamily: FONTS.primary
        }).setOrigin(0.5);
        this.statusPanel.add(phoneBtnText);

        phoneBtn.on('pointerover', () => phoneBtn.setFillStyle(0x00cc66));
        phoneBtn.on('pointerout', () => phoneBtn.setFillStyle(0x00aa55));
        phoneBtn.on('pointerdown', () => this.openPhone());

        this.statusPanel.setDepth(1000);
        this.updateStatusDisplay();
    }

    /**
     * 打开手机界面
     */
    private openPhone(): void {
        console.log('[Office] Opening phone scene');
        this.scene.launch('PhoneScene');
        this.scene.pause();
    }

    /**
     * 更新状态显示
     */
    private updateStatusDisplay(): void {
        // 清除旧文本（但保留按钮相关元素）
        this.statusPanel.iterate((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Text && child.y > 40 && child.y < 240) {
                child.destroy();
            }
            if (child instanceof Phaser.GameObjects.Rectangle && child.y > 40 && child.y < 240) {
                child.destroy();
            }
        });

        const moodColor = this.playerMood >= 60 ? '#00ff88' : this.playerMood >= 30 ? '#ffaa00' : '#ff4444';
        const stressColor = this.stressLevel >= 70 ? '#ff4444' : this.stressLevel >= 40 ? '#ffaa00' : '#00ff88';

        // 获取现金余额
        const account = gameState.getAccount();
        const cashColor = account.cash > 0 ? '#00ff88' : '#ff4444';

        const stats = [
            { label: '💰 现金', value: Math.floor(account.cash), unit: '¥', color: cashColor, max: 100000 },
            { label: '😊 心情', value: this.playerMood, unit: '', color: moodColor, max: 100 },
            { label: '😰 压力', value: this.stressLevel, unit: '', color: stressColor, max: 100 },
            { label: '📊 工作', value: this.workProgress, unit: '%', color: '#4a90d9', max: 100 }
        ];

        stats.forEach((stat, index) => {
            const y = 60 + index * 45; // Spacing increased

            const label = this.add.text(20, y, stat.label, {
                fontSize: '18px', // 13px -> 18px
                color: '#cccccc'
            });
            this.statusPanel.add(label);

            const valueText = stat.unit === '¥'
                ? `${stat.unit}${stat.value.toLocaleString()}`
                : `${stat.value}${stat.unit}`;
            const value = this.add.text(140, y, valueText, {
                fontSize: '18px', // 13px -> 18px
                color: stat.color,
                fontStyle: 'bold'
            });
            this.statusPanel.add(value);

            // 进度条（现金不显示进度条）
            if (stat.unit !== '¥') {
                const barBg = this.add.rectangle(230, y + 10, 140, 14, 0x333333); // Wider, taller bar
                barBg.setOrigin(0, 0.5);
                this.statusPanel.add(barBg);

                const barWidth = Math.min(stat.value / stat.max * 140, 140);
                const bar = this.add.rectangle(230, y + 10, barWidth, 14, parseInt(stat.color.replace('#', '0x')));
                bar.setOrigin(0, 0.5);
                this.statusPanel.add(bar);
            }
        });
    }

    /**
     * 创建指令输入框（永久显示）
     */
    /**
     * 创建指令输入框（永久显示 - Fixed Overlay）
     */
    private createCommandInput(): void {
        // Create a dedicated container for the command input attached to document.body
        // This ensures it bypasses any Phaser canvas transformations and stays fixed to the viewport
        const container = document.createElement('div');
        container.id = 'command-input-container';

        // Responsive CSS using VW/VH units
        const styles = `
            position: fixed;
            bottom: 5vh;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 1vw;
            align-items: center;
            background: rgba(26, 26, 32, 0.9);
            padding: 1.5vw;
            border-radius: 1.2vw;
            border: 2px solid rgba(74, 144, 217, 0.5);
            backdrop-filter: blur(10px);
            box-shadow: 0 1vh 3vh rgba(0,0,0,0.5);
            z-index: 20000;
            pointer-events: auto;
        `;
        container.style.cssText = styles;

        container.innerHTML = `
            <div style="color: #4a90d9; font-weight: bold; font-family: monospace; margin-right: 0.5vw; font-size: 1.5vw;">>_</div>
            <input type="text" id="commandInput" 
                   placeholder="输入指令: '拿水杯砸向同事', '努力工作'..."
                   style="width: 40vw; 
                          padding: 1vw; 
                          font-size: 1.2vw; 
                          background: rgba(0,0,0,0.3); 
                          color: #ffffff; 
                          border: 1px solid rgba(255,255,255,0.1); 
                          border-radius: 0.6vw;
                          outline: none;
                          font-family: 'Inter', sans-serif;" />
            <button id="commandSubmit"
                    style="padding: 1vw 2.5vw;
                           font-size: 1.2vw;
                           background: #4a90d9;
                           color: #ffffff;
                           border: none;
                           border-radius: 0.6vw;
                           cursor: pointer;
                           font-weight: bold;
                           font-family: 'Inter', sans-serif;
                           transition: all 0.2s;">
                执行
            </button>
        `;

        document.body.appendChild(container);

        // Cleanup on scene shutdown/restart to prevent duplicates
        this.events.once('shutdown', () => {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        });

        // 延迟绑定事件
        this.time.delayedCall(100, () => {
            const inputElement = document.getElementById('commandInput') as HTMLInputElement;
            const submitBtn = document.getElementById('commandSubmit') as HTMLButtonElement;

            // 键盘锁定逻辑
            inputElement?.addEventListener('focus', () => {
                this.input.keyboard!.enabled = false;
                // 重置所有按键状态，防止角色持续移动
                this.input.keyboard!.resetKeys();
                console.log('[Input] Keyboard disabled (input focused)');
            });
            inputElement?.addEventListener('blur', () => {
                this.input.keyboard!.enabled = true;
                console.log('[Input] Keyboard enabled (input blurred)');
            });

            const handleSubmit = () => {
                if (inputElement) {
                    const command = inputElement.value.trim();
                    if (command) {
                        this.processCommand(command);
                        inputElement.value = '';
                        // 关键：提交后失去焦点，恢复键盘控制
                        inputElement.blur();
                    }
                }
            };

            // 事件绑定
            inputElement?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                }
            });
            submitBtn?.addEventListener('click', handleSubmit);

            // Hover effects for button (manual JS since inline CSS hover is limited)
            submitBtn?.addEventListener('mouseenter', () => {
                submitBtn.style.background = '#5aa0e9';
                submitBtn.style.transform = 'translateY(-2px)';
            });
            submitBtn?.addEventListener('mouseleave', () => {
                submitBtn.style.background = '#4a90d9';
                submitBtn.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * 创建行为日志
     */
    /**
     * 创建行为日志
     */
    private createActionLog(): void {
        // Bottom Right for 2K (2560x1440)
        // Pos: x=2520, y=1100 (aligned with Status Panel top)
        // Size: 420x300 (Increased from 320x240)
        const logBg = this.add.rectangle(2520, 1100, 420, 300, COLORS.panel, 0.6);
        logBg.setStrokeStyle(1, 0xffffff, 0.1);
        logBg.setOrigin(1, 0); // Anchor Top-Right
        applyGlassEffect(logBg, 0.6);

        // Text Position: Left edge = 2520 - 420 = 2100. Padding 20.
        const textX = 2120;
        const textY = 1120;

        const logTitle = this.add.text(textX, textY, 'ACTION LOG / 行为日志', {
            fontSize: '18px', // 14px -> 18px
            fontFamily: FONTS.mono,
            color: '#666666'
        });

        this.logDisplay = this.add.text(textX, textY + 40, '', {
            fontSize: '18px', // 14px -> 18px
            fontFamily: FONTS.main,
            color: '#cccccc',
            wordWrap: { width: 380 }, // Adjusted width for wider panel
            lineSpacing: 10
        });
    }

    /**
     * 处理玩家指令（本地优先，即时响应）
     */
    private async processCommand(command: string): Promise<void> {
        this.addLog(`你: ${command}`);

        // 获取布局信息
        const { centerX, centerY } = this.getLayoutInfo();

        // 收集场景信息
        const visibleObjects = Array.from(this.sceneObjects.keys());
        const visibleNpcs = Array.from(this.colleagues.keys());

        // 本地处理行动（即时响应）
        const result = this.processActionLocally(command, visibleObjects, visibleNpcs);

        // 显示行动描述
        this.addLog(`结果: ${result.description}`);

        if (!result.feasible) {
            this.addLog('系统: 这个行为无法执行！');
            notificationManager.warning('行动失败', result.description, 3000);
            return;
        }

        // 播放动画序列
        await this.playAnimationSequence(result.animations);

        // 播放 NPC 反应
        await this.playNPCReactions(result.npc_reactions);

        // 显示 NPC 台词
        if (result.dialogue) {
            this.showDialogue(result.dialogue);
        }

        // 应用状态变化
        this.applyStateChanges(result.state_changes);

        // 更新 UI
        this.updateStatusDisplay();

        // 检查触发条件
        this.checkTriggers();
    }

    /**
     * 本地处理行动（即时响应，无需等待 AI）
     */
    private processActionLocally(command: string, visibleObjects: string[], visibleNpcs: string[]): any {
        const lower = command.toLowerCase();

        let animations: any[] = [];
        let npc_reactions: { [key: string]: string } = {};
        let state_changes: any = { mood: 0, stress: 0, work_progress: 0, relationships: {} };
        let feasible = true;
        let description = '';
        let dialogue: string | null = null;

        // 智能目标匹配 - 支持部分匹配
        const findNpcTarget = (cmd: string): string | null => {
            // 精确匹配
            for (const npc of visibleNpcs) {
                if (cmd.includes(npc)) return npc;
            }
            // 部分匹配（如"王" 匹配 "王老板"、"王测试"）
            for (const npc of visibleNpcs) {
                const lastName = npc.charAt(0); // 姓氏
                if (cmd.includes(lastName) && cmd.includes('老板') && npc.includes('老板')) return npc;
                if (cmd.includes(lastName) && cmd.includes('经理') && npc.includes('经理')) return npc;
                if (cmd.includes(lastName) && cmd.includes('同事') && npc.includes('同事')) return npc;
            }
            // 单字匹配（如"王"）
            for (const npc of visibleNpcs) {
                if (cmd.includes(npc.charAt(0))) return npc;
            }
            return null;
        };

        // 投掷类行动
        if (['砸', '扔', '投', '丢'].some(w => lower.includes(w))) {
            // 解析目标 NPC
            const targetNpc = findNpcTarget(command);
            let thrownObject = visibleObjects.find(obj => command.includes(obj)) || '水杯';

            if (!targetNpc) {
                // 没有找到目标 - 显示可用目标
                feasible = false;
                description = `找不到这个人！场景中的人物有: ${visibleNpcs.join(', ')}`;
            } else {
                description = `你拿起${thrownObject}狠狠地砸向了${targetNpc}！`;
                animations = [
                    { type: 'throw', object: thrownObject, target: targetNpc, duration: 500 },
                    { type: 'hit', target: targetNpc, delay: 500 },
                    { type: 'debris', object: thrownObject, target: targetNpc, delay: 600 },
                    { type: 'hurt', target: targetNpc, delay: 700 }
                ];

                // 隐藏被扔的物品
                const objData = this.sceneObjects.get(thrownObject);
                if (objData) {
                    objData.sprite.setVisible(false);
                }

                // 其他 NPC 反应
                visibleNpcs.forEach(npc => {
                    if (npc !== targetNpc) {
                        npc_reactions[npc] = ['gather', 'flee', 'shock'][Math.floor(Math.random() * 3)];
                    }
                });
                npc_reactions[targetNpc] = 'hurt';

                state_changes = {
                    mood: -30,
                    stress: 50,
                    work_progress: -20,
                    relationships: { [targetNpc]: -50 }
                };
                dialogue = `${targetNpc}捂着头大喊：你疯了吗！`;

                // 屏幕震动
                this.cameras.main.shake(300, 0.04);
            }
        }
        // 攻击类行动
        else if (['打', '揍', '踢', '攻击'].some(w => lower.includes(w))) {
            const targetNpc = findNpcTarget(command);

            if (!targetNpc) {
                feasible = false;
                description = `找不到攻击目标！场景中的人物有: ${visibleNpcs.join(', ')}`;
            } else {
                description = `你冲向${targetNpc}挥出了拳头！`;
                animations = [
                    { type: 'charge', target: targetNpc, duration: 300 },
                    { type: 'hurt', target: targetNpc, delay: 300 }
                ];
                visibleNpcs.forEach(npc => {
                    if (npc !== targetNpc) npc_reactions[npc] = 'gather';
                });
                npc_reactions[targetNpc] = 'hurt';
                state_changes = { mood: -40, stress: 60, relationships: { [targetNpc]: -80 } };
                dialogue = `${targetNpc}倒退几步，震惊地看着你。`;
                this.cameras.main.shake(200, 0.03);
            }
        }
        // 工作类行动
        else if (['工作', '代码', '写', '做', '完成', '敲'].some(w => lower.includes(w))) {
            description = '你专注地开始工作...';
            animations = [{ type: 'work', duration: 1500 }];
            state_changes = { mood: -5, stress: 10, work_progress: 15 };
        }
        // 摸鱼类行动
        else if (['摸鱼', '休息', '偷懒', '刷手机', '玩'].some(w => lower.includes(w))) {
            description = '你偷偷摸起了鱼...';
            animations = [{ type: 'idle', variant: 'phone', duration: 1500 }];
            state_changes = { mood: 10, stress: -10, work_progress: -5 };

            // 可能被发现
            if (Math.random() < 0.3 && visibleNpcs.length > 0) {
                const npc = visibleNpcs[Math.floor(Math.random() * visibleNpcs.length)];
                npc_reactions[npc] = 'notice';
                dialogue = `${npc}似乎注意到了你在摸鱼...`;
            }
        }
        // 对话类行动
        else if (['说', '问', '聊', '告诉', '交谈'].some(w => lower.includes(w))) {
            const targetNpc = findNpcTarget(command);
            if (targetNpc) {
                description = `你走向${targetNpc}开始交谈。`;
                animations = [{ type: 'walk', target: targetNpc, duration: 500 }];
                npc_reactions[targetNpc] = 'talk';
            } else {
                description = '你自言自语了几句。';
            }
        }
        // 喝水/喝咖啡
        else if (['喝', '咖啡', '水'].some(w => lower.includes(w))) {
            description = '你喝了一口饮料，感觉精神了一些。';
            state_changes = { mood: 5, stress: -5 };
        }
        // 默认行动
        else {
            description = `你尝试${command}...结果不太明确。`;
            animations = [{ type: 'generic', duration: 800 }];
        }

        return {
            feasible,
            description,
            animations,
            npc_reactions,
            state_changes,
            dialogue
        };
    }

    /**
     * 播放动画序列
     */
    private async playAnimationSequence(animations: any[]): Promise<void> {
        for (const anim of animations) {
            const delay = anim.delay || 0;
            if (delay > 0) {
                await this.wait(delay);
            }

            switch (anim.type) {
                case 'throw':
                    await this.playThrowAnimation(anim.object, anim.target, anim.duration || 500);
                    break;
                case 'hit':
                    await this.playHitEffect(anim.target);
                    break;
                case 'debris':
                    await this.playDebrisEffect(anim.target, anim.object);
                    break;
                case 'hurt':
                    await this.playHurtAnimation(anim.target);
                    break;
                case 'charge':
                    await this.playChargeAnimation(anim.target, anim.duration || 300);
                    break;
                case 'work':
                    await this.playWorkAnimation(anim.duration || 2000);
                    break;
                default:
                    await this.wait(anim.duration || 500);
                    break;
            }
        }
    }

    /**
     * 获取 NPC 的全局屏幕位置（考虑 worldContainer 偏移）
     */
    private getNpcGlobalPosition(npcName: string): { x: number; y: number } | null {
        const npc = this.colleagues.get(npcName);
        if (!npc || !npc.sprite) return null;

        // NPC sprite 是在 worldContainer 内的，需要加上容器偏移
        return {
            x: this.worldContainer.x + npc.sprite.x,
            y: this.worldContainer.y + npc.sprite.y
        };
    }

    /**
     * 投掷动画
     */
    private async playThrowAnimation(objectName: string, targetName: string, duration: number): Promise<void> {
        const { centerX, centerY } = this.getLayoutInfo();
        const startX = centerX;
        const startY = centerY + 50;

        // 获取目标全局位置
        const targetPos = this.getNpcGlobalPosition(targetName);
        let endX = startX + 200;
        let endY = startY - 100;

        if (targetPos) {
            endX = targetPos.x;
            endY = targetPos.y - 30;
        }

        console.log(`[Animation] Throw from (${startX}, ${startY}) to (${endX}, ${endY}) target: ${targetName}`);

        // 创建投掷物
        const projectile = this.add.graphics();
        projectile.x = startX;
        projectile.y = startY;
        projectile.setDepth(9000);

        // 绘制水杯
        projectile.fillStyle(0xffffff, 1);
        projectile.fillRoundedRect(-10, -15, 20, 20, 4);
        projectile.fillStyle(0x3498db, 0.7);
        projectile.fillEllipse(0, -10, 14, 6);
        // 把手
        projectile.lineStyle(3, 0xffffff, 1);
        projectile.beginPath();
        projectile.arc(10, -5, 5, -Math.PI / 2, Math.PI / 2, false);
        projectile.strokePath();

        // 投掷动画
        this.tweens.add({
            targets: projectile,
            x: endX,
            y: endY,
            duration: duration,
            ease: 'Quad.out',
            onComplete: () => projectile.destroy()
        });

        // 旋转
        this.tweens.add({
            targets: projectile,
            angle: 720,
            duration: duration,
            ease: 'Linear'
        });

        await this.wait(duration);
    }

    /**
     * 撞击效果
     */
    private async playHitEffect(targetName: string): Promise<void> {
        const pos = this.getNpcGlobalPosition(targetName);
        if (!pos) return;

        const x = pos.x;
        const y = pos.y - 30;

        // 撞击星星
        const flash = this.add.graphics();
        flash.x = x;
        flash.y = y;
        flash.setDepth(9001);
        flash.fillStyle(0xffff00, 1);
        this.drawStar(flash, 0, 0, 5, 25, 12);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // 屏幕震动
        this.cameras.main.shake(200, 0.03);

        await this.wait(200);
    }

    /**
     * 绘制星形
     */
    private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, spikes: number, outerR: number, innerR: number): void {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        g.beginPath();
        g.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            g.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            g.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        g.closePath();
        g.fillPath();
    }

    /**
     * 碎片效果
     */
    private async playDebrisEffect(targetName: string, objectName: string): Promise<void> {
        const pos = this.getNpcGlobalPosition(targetName);
        const { centerX, centerY } = this.getLayoutInfo();
        let x = centerX;
        let y = centerY;

        if (pos) {
            x = pos.x;
            y = pos.y + 30;
        }

        // 生成碎片
        for (let i = 0; i < 8; i++) {
            const shard = this.add.graphics();
            shard.x = x;
            shard.y = y;
            shard.setDepth(8999);

            const size = Phaser.Math.Between(3, 8);
            const color = Phaser.Math.RND.pick([0xffffff, 0x3498db, 0xbdc3c7]);
            shard.fillStyle(color, 0.9);
            shard.fillTriangle(-size, size, size, size / 2, 0, -size);

            const angle = (i / 8) * Math.PI * 2;
            const dist = Phaser.Math.Between(30, 80);

            this.tweens.add({
                targets: shard,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist + 20,
                alpha: 0,
                angle: Phaser.Math.Between(-360, 360),
                duration: 600,
                ease: 'Quad.out',
                onComplete: () => shard.destroy()
            });
        }

        await this.wait(100);
    }

    /**
     * NPC 受伤动画
     */
    private async playHurtAnimation(targetName: string): Promise<void> {
        const target = this.colleagues.get(targetName);
        const pos = this.getNpcGlobalPosition(targetName);
        if (!target || !pos) return;

        const originalX = target.sprite.x;

        // 红色闪烁 - 使用全局位置
        const flash = this.add.graphics();
        flash.x = pos.x;
        flash.y = pos.y;
        flash.setDepth(9001);
        flash.fillStyle(0xff0000, 0.5);
        flash.fillEllipse(0, -20, 60, 80);

        // 震动 NPC sprite (局部坐标)
        this.tweens.add({
            targets: target.sprite,
            x: originalX + 8,
            duration: 50,
            yoyo: true,
            repeat: 6,
            onComplete: () => { target.sprite.x = originalX; }
        });

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy()
        });

        await this.wait(400);
    }

    /**
     * 冲锋动画
     */
    private async playChargeAnimation(targetName: string, duration: number): Promise<void> {
        // 玩家冲向目标的效果 - 简单屏幕模糊效果
        this.cameras.main.flash(duration, 0xffffff, 0.2);
        await this.wait(duration);
    }

    /**
     * 工作动画
     */
    private async playWorkAnimation(duration: number): Promise<void> {
        const { centerX, centerY } = this.getLayoutInfo();

        const progressBar = this.add.graphics();
        progressBar.x = centerX;
        progressBar.y = centerY - 100;
        progressBar.setDepth(9000);

        const progress = { value: 0 };
        this.tweens.add({
            targets: progress,
            value: 1,
            duration: duration,
            onUpdate: () => {
                progressBar.clear();
                progressBar.fillStyle(0x333333, 0.8);
                progressBar.fillRoundedRect(-100, -10, 200, 20, 5);
                progressBar.fillStyle(0x27ae60, 1);
                progressBar.fillRoundedRect(-98, -8, 196 * progress.value, 16, 4);
            },
            onComplete: () => {
                this.tweens.add({
                    targets: progressBar,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => progressBar.destroy()
                });
            }
        });

        await this.wait(duration);
    }

    /**
     * 播放 NPC 反应
     */
    private async playNPCReactions(reactions: { [npcName: string]: string }): Promise<void> {
        for (const [npcName, reactionType] of Object.entries(reactions)) {
            const npc = this.colleagues.get(npcName);
            if (!npc) continue;

            switch (reactionType) {
                case 'gather':
                    // 围观 - 显示惊叹号
                    this.showEmoji(npc.sprite.x, npc.sprite.y - 60, '!');
                    break;
                case 'flee':
                    // 逃跑
                    this.tweens.add({
                        targets: npc.sprite,
                        x: npc.sprite.x + 80,
                        duration: 400,
                        ease: 'Quad.out'
                    });
                    break;
                case 'shock':
                    this.showEmoji(npc.sprite.x, npc.sprite.y - 60, '!?');
                    this.tweens.add({
                        targets: npc.sprite,
                        y: npc.sprite.y - 10,
                        duration: 100,
                        yoyo: true
                    });
                    break;
                case 'notice':
                    this.showEmoji(npc.sprite.x, npc.sprite.y - 60, '?');
                    break;
            }
        }
        await this.wait(300);
    }

    /**
     * 显示表情符号
     */
    private showEmoji(x: number, y: number, emoji: string): void {
        const text = this.add.text(x, y, emoji, {
            fontSize: '32px',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(9002);

        this.tweens.add({
            targets: text,
            y: y - 20,
            alpha: 0,
            duration: 1500,
            delay: 500,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示对话
     */
    private showDialogue(dialogue: string): void {
        const { centerX, centerY } = this.getLayoutInfo();

        const dialogueBox = this.add.text(centerX, centerY + 150, dialogue, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000cc',
            padding: { x: 20, y: 15 },
            wordWrap: { width: 400 }
        }).setOrigin(0.5).setDepth(9003);

        this.tweens.add({
            targets: dialogueBox,
            alpha: 0,
            duration: 500,
            delay: 3000,
            onComplete: () => dialogueBox.destroy()
        });
    }

    /**
     * 应用状态变化
     */
    private applyStateChanges(changes: any): void {
        if (changes.mood !== undefined) {
            this.playerMood = Math.max(0, Math.min(100, this.playerMood + changes.mood));
        }
        if (changes.stress !== undefined) {
            this.stressLevel = Math.max(0, Math.min(100, this.stressLevel + changes.stress));
        }
        if (changes.work_progress !== undefined) {
            this.workProgress = Math.max(0, Math.min(100, this.workProgress + changes.work_progress));
        }
        if (changes.relationships) {
            Object.entries(changes.relationships).forEach(([name, change]: [string, any]) => {
                const colleague = this.colleagues.get(name);
                if (colleague) {
                    colleague.relationship = Math.max(-100, Math.min(100, colleague.relationship + change));
                }
            });
        }
    }

    /**
     * 等待指定时间
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => this.time.delayedCall(ms, resolve));
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
                // 重置所有按键状态，防止角色持续移动
                this.input.keyboard!.resetKeys();
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
    // ================= 矢量绘图辅助函数 =================

    private drawWaterCooler(g: Phaser.GameObjects.Graphics): void {
        // 机身
        g.fillStyle(0xbdc3c7, 1);
        g.fillRoundedRect(-15, -60, 30, 60, 4);

        // 出水口区域
        g.fillStyle(0x2c3e50, 1);
        g.fillRoundedRect(-12, -40, 24, 15, 2);

        // 水桶
        g.fillStyle(0x3498db, 0.6); // 半透明蓝
        g.fillRoundedRect(-14, -85, 28, 30, 6);
        g.lineStyle(2, 0x2980b9, 0.8);
        g.strokeRoundedRect(-14, -85, 28, 30, 6);

        // 水位线
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(-12, -75, 24, 2);
    }

    private drawPlant(g: Phaser.GameObjects.Graphics): void {
        // 花盆
        g.fillStyle(0xd35400, 1);
        g.beginPath();
        g.moveTo(-10, 0);
        g.lineTo(10, 0);
        g.lineTo(15, -20);
        g.lineTo(-15, -20);
        g.closePath();
        g.fillPath();

        // 叶子 (更自然)
        g.fillStyle(0x27ae60, 1);
        g.fillEllipse(0, -35, 12, 25);
        g.fillEllipse(-15, -25, 20, 12);
        g.fillEllipse(15, -25, 20, 12);

        // 叶脉
        g.lineStyle(1, 0x2ecc71, 0.5);
        g.beginPath();
        g.moveTo(0, -20);
        g.lineTo(0, -45);
        g.strokePath();
    }

    private drawPrinter(g: Phaser.GameObjects.Graphics): void {
        // 主体
        g.fillStyle(0x95a5a6, 1);
        g.fillRoundedRect(-20, -25, 40, 25, 4);

        // 顶部盖板
        g.fillStyle(0x7f8c8d, 1);
        g.fillRect(-20, -28, 40, 5);

        // 纸张
        g.fillStyle(0xffffff, 1);
        g.fillRect(-15, -35, 30, 10);

        // 按钮
        g.fillStyle(0x2ecc71, 1);
        g.fillCircle(12, -20, 2);
    }

    private drawSofa(g: Phaser.GameObjects.Graphics): void {
        // 沙发座
        g.fillStyle(0xe74c3c, 1);
        g.fillRoundedRect(-30, -15, 60, 15, 4);

        // 靠背
        g.fillStyle(0xc0392b, 1);
        g.fillRoundedRect(-30, -35, 60, 20, 4);

        // 扶手
        g.fillStyle(0xc0392b, 1);
        g.fillRoundedRect(-35, -20, 8, 20, 2);
        g.fillRoundedRect(27, -20, 8, 20, 2);
    }

    private drawFlag(g: Phaser.GameObjects.Graphics): void {
        // 旗杆
        g.fillStyle(0x7f8c8d, 1);
        g.fillRect(-2, -80, 4, 80);

        // 底座
        g.fillStyle(0x2c3e50, 1);
        g.fillCircle(0, 0, 8);

        // 旗面
        g.fillStyle(0xe74c3c, 1);
        g.beginPath();
        g.moveTo(0, -78);
        g.lineTo(40, -60);
        g.lineTo(0, -42);
        g.closePath();
        g.fillPath();

        // 公司Logo (金星)
        g.fillStyle(0xf1c40f, 1);
        g.fillCircle(12, -60, 4);
    }

    private drawComputer(g: Phaser.GameObjects.Graphics): void {
        // 屏幕
        g.fillStyle(0x2d3436, 1);
        g.fillRoundedRect(-12, -22, 24, 16, 2);
        g.fillStyle(0x0984e3, 1);
        g.fillRect(-10, -20, 20, 12);
        // 支架
        g.fillStyle(0x636e72, 1);
        g.fillRect(-3, -6, 6, 6);
        // 底座
        g.fillStyle(0x2d3436, 1);
        g.fillRect(-8, 0, 16, 3);
    }

    private drawCup(g: Phaser.GameObjects.Graphics): void {
        // 杯身
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(-6, -12, 12, 12, 2);
        // 咖啡
        g.fillStyle(0x6d4c41, 1);
        g.fillEllipse(0, -10, 8, 3);
        // 把手
        g.lineStyle(2, 0xffffff, 1);
        g.beginPath();
        g.arc(6, -8, 3, -Math.PI / 2, Math.PI / 2, false);
        g.strokePath();
    }
}
