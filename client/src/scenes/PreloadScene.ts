import Phaser from 'phaser';
import { gameState } from '../GameState';
import { jobHuntSystem } from '../JobHuntSystem';

/**
 * 资源预加载场景
 * 加载所有游戏资源并显示进度
 */
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        // 显示加载进度
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 进度条背景
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        // 进度条
        const progressBar = this.add.graphics();

        // 加载文字
        const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
            fontSize: '20px',
            color: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);

        // 百分比文字
        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontSize: '18px',
            color: '#ffffff'
        });
        percentText.setOrigin(0.5, 0.5);

        // 监听加载进度
        this.load.on('progress', (value: number) => {
            percentText.setText(`${Math.round(value * 100)}%`);
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // ========== 加载游戏资源 ==========

        // 生成临时像素精灵（后续替换为真实资源）
        this.createPlaceholderAssets();
    }

    /**
     * 创建占位符资源 (高清重制版)
     * 使用代码生成高质量矢量图形，4x 分辨率以保证清晰度
     */
    createPlaceholderAssets(): void {
        const dpr = 4; // 内部绘制倍数

        // 1. 玩家精灵 (128x128 高清)
        const playerGraphics = this.make.graphics({ x: 0, y: 0 });

        // 身体阴影
        playerGraphics.fillStyle(0x000000, 0.2);
        playerGraphics.fillEllipse(16 * dpr, 28 * dpr, 24 * dpr, 8 * dpr);

        // 身体 (西装)
        playerGraphics.fillStyle(0x4a90d9, 1);
        playerGraphics.fillRoundedRect(8 * dpr, 10 * dpr, 16 * dpr, 18 * dpr, 4 * dpr);

        // 头部
        playerGraphics.fillStyle(0xffdbac, 1); // 肤色
        playerGraphics.fillCircle(16 * dpr, 8 * dpr, 9 * dpr);

        // 头发
        playerGraphics.fillStyle(0x2d3436, 1);
        playerGraphics.beginPath();
        playerGraphics.arc(16 * dpr, 8 * dpr, 9.5 * dpr, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
        playerGraphics.fillPath();

        // 腿
        playerGraphics.fillStyle(0x2d5a8a, 1);
        playerGraphics.fillRoundedRect(10 * dpr, 24 * dpr, 5 * dpr, 8 * dpr, 2 * dpr);
        playerGraphics.fillRoundedRect(17 * dpr, 24 * dpr, 5 * dpr, 8 * dpr, 2 * dpr);

        playerGraphics.generateTexture('player', 32 * dpr, 32 * dpr);
        playerGraphics.destroy();

        // 2. 地板瓦片 (256x128 高清等距)
        const floorW = 64 * dpr;
        const floorH = 32 * dpr;
        const floorGraphics = this.make.graphics({ x: 0, y: 0 });

        // 顶面
        floorGraphics.fillStyle(0x8b7355, 1);
        floorGraphics.beginPath();
        floorGraphics.moveTo(floorW / 2, 0);
        floorGraphics.lineTo(floorW, floorH / 2);
        floorGraphics.lineTo(floorW / 2, floorH);
        floorGraphics.lineTo(0, floorH / 2);
        floorGraphics.closePath();
        floorGraphics.fillPath();

        // 侧边 (厚度)
        const thickness = 4 * dpr;
        floorGraphics.fillStyle(0x6b5344, 1);
        floorGraphics.beginPath();
        floorGraphics.moveTo(0, floorH / 2);
        floorGraphics.lineTo(floorW / 2, floorH);
        floorGraphics.lineTo(floorW / 2, floorH + thickness);
        floorGraphics.lineTo(0, floorH / 2 + thickness);
        floorGraphics.closePath();
        floorGraphics.fillPath();

        floorGraphics.fillStyle(0x5a4233, 1);
        floorGraphics.beginPath();
        floorGraphics.moveTo(floorW / 2, floorH);
        floorGraphics.lineTo(floorW, floorH / 2);
        floorGraphics.lineTo(floorW, floorH / 2 + thickness);
        floorGraphics.lineTo(floorW / 2, floorH + thickness);
        floorGraphics.closePath();
        floorGraphics.fillPath();

        // 边缘高光
        floorGraphics.lineStyle(2, 0xa38a6a, 0.5);
        floorGraphics.beginPath();
        floorGraphics.moveTo(floorW / 2, 0);
        floorGraphics.lineTo(floorW, floorH / 2);
        floorGraphics.lineTo(floorW / 2, floorH);
        floorGraphics.lineTo(0, floorH / 2);
        floorGraphics.closePath();
        floorGraphics.strokePath();

        floorGraphics.generateTexture('floor_tile', floorW, floorH + thickness);
        floorGraphics.destroy();

        // 3. 办公桌 (256x192 高清)
        const deskW = 64 * dpr;
        const deskH = 48 * dpr;
        const deskGraphics = this.make.graphics({ x: 0, y: 0 });

        // 桌面 (木纹色)
        deskGraphics.fillStyle(0xe2b57b, 1);
        deskGraphics.beginPath();
        deskGraphics.moveTo(deskW / 2, 0);
        deskGraphics.lineTo(deskW, 12 * dpr);
        deskGraphics.lineTo(deskW / 2, 24 * dpr);
        deskGraphics.lineTo(0, 12 * dpr);
        deskGraphics.closePath();
        deskGraphics.fillPath();

        // 桌面厚度
        deskGraphics.fillStyle(0xc4955a, 1);
        deskGraphics.beginPath();
        deskGraphics.moveTo(0, 12 * dpr);
        deskGraphics.lineTo(deskW / 2, 24 * dpr);
        deskGraphics.lineTo(deskW / 2, 28 * dpr);
        deskGraphics.lineTo(0, 16 * dpr);
        deskGraphics.closePath();
        deskGraphics.fillPath();

        deskGraphics.fillStyle(0xa8753a, 1);
        deskGraphics.beginPath();
        deskGraphics.moveTo(deskW / 2, 24 * dpr);
        deskGraphics.lineTo(deskW, 12 * dpr);
        deskGraphics.lineTo(deskW, 16 * dpr);
        deskGraphics.lineTo(deskW / 2, 28 * dpr);
        deskGraphics.closePath();
        deskGraphics.fillPath();

        // 桌腿 (金属感)
        deskGraphics.fillStyle(0x555555, 1);
        // 左腿
        deskGraphics.fillRoundedRect(4 * dpr, 14 * dpr, 4 * dpr, 34 * dpr, 2);
        // 右腿
        deskGraphics.fillRoundedRect(56 * dpr, 14 * dpr, 4 * dpr, 34 * dpr, 2);

        deskGraphics.generateTexture('desk', deskW, deskH);
        deskGraphics.destroy();

        // 4. 电脑 (96x128 高清)
        const compW = 24 * dpr;
        const compH = 32 * dpr;
        const computerGraphics = this.make.graphics({ x: 0, y: 0 });

        // 屏幕边框
        computerGraphics.fillStyle(0x2d3436, 1);
        computerGraphics.fillRoundedRect(0, 0, 24 * dpr, 18 * dpr, 2 * dpr);

        // 屏幕内容 (亮蓝)
        computerGraphics.fillStyle(0x0984e3, 1);
        computerGraphics.fillRoundedRect(2 * dpr, 2 * dpr, 20 * dpr, 14 * dpr, 1 * dpr);

        // 支架
        computerGraphics.fillStyle(0x636e72, 1);
        computerGraphics.fillRect(10 * dpr, 18 * dpr, 4 * dpr, 6 * dpr);

        // 底座
        computerGraphics.fillStyle(0x2d3436, 1);
        computerGraphics.fillRoundedRect(6 * dpr, 24 * dpr, 12 * dpr, 4 * dpr, 1 * dpr);

        computerGraphics.generateTexture('computer', compW, compH);
        computerGraphics.destroy();

        // 5. NPC 同事 (128x128 高清)
        const npcGraphics = this.make.graphics({ x: 0, y: 0 });

        // 阴影
        npcGraphics.fillStyle(0x000000, 0.2);
        npcGraphics.fillEllipse(16 * dpr, 28 * dpr, 24 * dpr, 8 * dpr);

        // 衣服
        npcGraphics.fillStyle(0xe17055, 1);
        npcGraphics.fillRoundedRect(8 * dpr, 10 * dpr, 16 * dpr, 18 * dpr, 4 * dpr);

        // 头
        npcGraphics.fillStyle(0xffdbac, 1);
        npcGraphics.fillCircle(16 * dpr, 8 * dpr, 9 * dpr);

        // 头发 (不同的发型)
        npcGraphics.fillStyle(0x6c5ce7, 1);
        npcGraphics.beginPath();
        npcGraphics.arc(16 * dpr, 8 * dpr, 10 * dpr, Phaser.Math.DegToRad(160), Phaser.Math.DegToRad(380), false);
        npcGraphics.fillPath();

        // 腿
        npcGraphics.fillStyle(0xd63031, 1);
        npcGraphics.fillRoundedRect(10 * dpr, 24 * dpr, 5 * dpr, 8 * dpr, 2 * dpr);
        npcGraphics.fillRoundedRect(17 * dpr, 24 * dpr, 5 * dpr, 8 * dpr, 2 * dpr);

        npcGraphics.generateTexture('npc', 32 * dpr, 32 * dpr);
        npcGraphics.destroy();
    }

    create(): void {
        // 资源加载完成
        console.log('Resource loading complete');

        // 通知 DOM 层游戏已准备就绪
        window.dispatchEvent(new Event('GAME_LOADED'));

        // 监听来自 DOM 的开始游戏事件
        window.addEventListener('START_GAME', () => {
            this.startGame();
        });

        // 如果在加载完成前用户已经点击了开始（极少见，但为了健壮性），可以检查一个全局标志
        if ((window as any).GAME_START_REQUESTED) {
            this.startGame();
        }
    }

    private startGame(): void {
        // 动态导入以避免循环依赖（如果需要），或者直接使用已导入的模块
        // 这里还需要引入 GameState 和 JobHuntSystem，我们需要在文件头部添加导入

        // 检查存档状态
        const hasSave = gameState.hasSaveData();
        const resume = jobHuntSystem.getResume();
        const hasCustomResume = resume.name !== '求职者' || hasSave;

        if (hasCustomResume) {
            this.scene.start('JobHuntScene');
        } else {
            this.scene.start('ResumeEditScene');
        }
    }
}
