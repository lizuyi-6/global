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
     * 创建占位符资源
     * 使用代码生成简单的像素图形，后续可替换为真实美术资源
     */
    createPlaceholderAssets(): void {
        // 玩家精灵 (32x32 像素小人)
        const playerGraphics = this.make.graphics({ x: 0, y: 0 });
        playerGraphics.fillStyle(0x4a90d9, 1);
        playerGraphics.fillRect(8, 0, 16, 8);   // 头
        playerGraphics.fillStyle(0x3d7ab8, 1);
        playerGraphics.fillRect(6, 8, 20, 16);  // 身体
        playerGraphics.fillStyle(0x2d5a8a, 1);
        playerGraphics.fillRect(8, 24, 6, 8);   // 左腿
        playerGraphics.fillRect(18, 24, 6, 8);  // 右腿
        playerGraphics.generateTexture('player', 32, 32);
        playerGraphics.destroy();

        // 等距地板瓦片 (64x32 等距菱形)
        const floorGraphics = this.make.graphics({ x: 0, y: 0 });
        floorGraphics.fillStyle(0x8b7355, 1);
        floorGraphics.beginPath();
        floorGraphics.moveTo(32, 0);
        floorGraphics.lineTo(64, 16);
        floorGraphics.lineTo(32, 32);
        floorGraphics.lineTo(0, 16);
        floorGraphics.closePath();
        floorGraphics.fillPath();
        floorGraphics.lineStyle(1, 0x6b5344, 1);
        floorGraphics.strokePath();
        floorGraphics.generateTexture('floor_tile', 64, 32);
        floorGraphics.destroy();

        // 办公桌 (64x48 等距)
        const deskGraphics = this.make.graphics({ x: 0, y: 0 });
        // 桌面
        deskGraphics.fillStyle(0xc4a574, 1);
        deskGraphics.beginPath();
        deskGraphics.moveTo(32, 0);
        deskGraphics.lineTo(64, 12);
        deskGraphics.lineTo(32, 24);
        deskGraphics.lineTo(0, 12);
        deskGraphics.closePath();
        deskGraphics.fillPath();
        // 桌腿
        deskGraphics.fillStyle(0x8b6914, 1);
        deskGraphics.fillRect(4, 12, 4, 36);
        deskGraphics.fillRect(56, 12, 4, 36);
        deskGraphics.generateTexture('desk', 64, 48);
        deskGraphics.destroy();

        // 电脑显示器 (24x32)
        const computerGraphics = this.make.graphics({ x: 0, y: 0 });
        computerGraphics.fillStyle(0x333333, 1);
        computerGraphics.fillRect(2, 0, 20, 16);  // 屏幕边框
        computerGraphics.fillStyle(0x4488ff, 1);
        computerGraphics.fillRect(4, 2, 16, 12);  // 屏幕
        computerGraphics.fillStyle(0x333333, 1);
        computerGraphics.fillRect(10, 16, 4, 8);  // 支架
        computerGraphics.fillRect(6, 24, 12, 4);  // 底座
        computerGraphics.generateTexture('computer', 24, 32);
        computerGraphics.destroy();

        // NPC 同事 (32x32)
        const npcGraphics = this.make.graphics({ x: 0, y: 0 });
        npcGraphics.fillStyle(0xd94a4a, 1);
        npcGraphics.fillRect(8, 0, 16, 8);   // 头
        npcGraphics.fillStyle(0xb83d3d, 1);
        npcGraphics.fillRect(6, 8, 20, 16);  // 身体
        npcGraphics.fillStyle(0x8a2d2d, 1);
        npcGraphics.fillRect(8, 24, 6, 8);   // 左腿
        npcGraphics.fillRect(18, 24, 6, 8);  // 右腿
        npcGraphics.generateTexture('npc', 32, 32);
        npcGraphics.destroy();

        // 椅子 (32x40)
        const chairGraphics = this.make.graphics({ x: 0, y: 0 });
        chairGraphics.fillStyle(0x4a4a4a, 1);
        chairGraphics.fillRect(8, 20, 16, 4);   // 座面
        chairGraphics.fillRect(8, 0, 16, 20);   // 靠背
        chairGraphics.fillStyle(0x333333, 1);
        chairGraphics.fillRect(14, 24, 4, 12);  // 支柱
        chairGraphics.fillRect(6, 36, 20, 4);   // 底座
        chairGraphics.generateTexture('chair', 32, 40);
        chairGraphics.destroy();
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
