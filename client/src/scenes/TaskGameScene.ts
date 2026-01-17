import Phaser from 'phaser';
import type { Task } from '../GameState';
import { gameState } from '../GameState';
import { COLORS, FONTS, applyGlassEffect, createModernStarBackground, createStyledButton } from '../UIConfig';

/**
 * 任务小游戏场景
 * 包含多种小游戏类型来完成工作任务
 */
export class TaskGameScene extends Phaser.Scene {
    private currentTask: Task | null = null;
    private gameType: 'typing' | 'sorting' | 'memory' | 'clicking' = 'typing';
    private gameContainer!: Phaser.GameObjects.Container;
    private score: number = 0;
    private timeLeft: number = 30;
    private timerEvent!: Phaser.Time.TimerEvent;
    private isGameActive: boolean = false;

    constructor() {
        super({ key: 'TaskGameScene' });
    }

    init(data: { task: Task; gameType: 'typing' | 'sorting' | 'memory' | 'clicking' }): void {
        this.currentTask = data.task;
        this.gameType = data.gameType || 'typing';
        this.score = 0;
        this.timeLeft = 30;
        this.isGameActive = false;
    }

    create(): void {
        // 现代粒子星空背景
        createModernStarBackground(this, 1280, 720);

        // 标题容器
        const headerContainer = this.add.container(640, 60);
        const titleText = this.add.text(0, -15, '⌨️ 任务挑战', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 25, 'TASK EXECUTION / MAXIMIZE EFFICIENCY', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        }).setOrigin(0.5);
        headerContainer.add([titleText, subTitleText]);

        // 游戏容器
        this.gameContainer = this.add.container(0, 50); // 往下移动

        // 绘制顶部信息
        this.drawHeader();

        // 提示信息
        const promptText = this.add.text(640, 130, this.getInstruction(), {
            fontSize: '18px',
            fontFamily: FONTS.main,
            color: '#4a90d9',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameContainer.add(promptText);

        // 根据游戏类型启动不同的小游戏
        switch (this.gameType) {
            case 'typing':
                this.startTypingGame();
                break;
            case 'sorting':
                this.startSortingGame();
                break;
            case 'memory':
                this.startMemoryGame();
                break;
            case 'clicking':
                this.startClickingGame();
                break;
        }
    }

    private getInstruction(): string {
        switch (this.gameType) {
            case 'typing': return '⌨️ 快速输入屏幕上显示的文字！';
            case 'sorting': return '🔢 按从小到大的顺序点击数字！';
            case 'memory': return '🧠 翻开卡片，找到相同的数字配对！';
            case 'clicking': return '🎯 快速点击随机出现的目标！';
            default: return '';
        }
    }

    /** 绘制顶部信息 */
    private drawHeader(): void {
        // 背景
        const headerBg = this.add.rectangle(640, 50, 1280, 100, COLORS.panel, 0.8);
        applyGlassEffect(headerBg);

        // 任务名称
        const taskTitle = this.add.text(120, 30, this.currentTask?.title || '工作任务', {
            fontSize: '24px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });

        // 返回按钮
        const backBtn = this.add.text(50, 30, '←', {
            fontSize: '28px',
            color: '#ff4444'
        }).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.exitGame(false));

        // 分数显示
        this.add.text(640, 25, 'SCORE / 分数', {
            fontSize: '11px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5, 0);

        const scoreText = this.add.text(640, 45, '0', {
            fontSize: '32px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold'
        });
        scoreText.setOrigin(0.5, 0);
        scoreText.setData('type', 'score');

        // 时间显示
        this.add.text(900, 25, 'TIME / 剩余时间', {
            fontSize: '11px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5, 0);

        const timeText = this.add.text(900, 45, '30.0', {
            fontSize: '32px',
            fontFamily: FONTS.mono,
            color: '#ffcc00',
            fontStyle: 'bold'
        });
        timeText.setOrigin(0.5, 0);
        timeText.setData('type', 'time');

        // 目标分数
        this.add.text(1100, 25, 'TARGET / 目标', {
            fontSize: '11px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5, 0);

        this.add.text(1100, 45, '100', {
            fontSize: '32px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
    }

    /** 更新分数显示 */
    private updateScore(newScore: number): void {
        this.score = newScore;
        this.children.each((child: Phaser.GameObjects.GameObject) => {
            if (child.getData && child.getData('type') === 'score') {
                (child as Phaser.GameObjects.Text).setText(this.score.toString());
            }
        });
    }

    /** 更新时间显示 */
    private updateTime(): void {
        this.children.each((child: Phaser.GameObjects.GameObject) => {
            if (child.getData && child.getData('type') === 'time') {
                (child as Phaser.GameObjects.Text).setText(Math.ceil(this.timeLeft).toString());
                if (this.timeLeft <= 10) {
                    (child as Phaser.GameObjects.Text).setColor('#ff4444');
                }
            }
        });
    }

    /** 启动计时器 */
    private startTimer(): void {
        this.isGameActive = true;
        this.timerEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                this.timeLeft -= 0.1;
                this.updateTime();

                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            },
            loop: true
        });
    }

    // ========== 打字游戏 ==========

    private typingWords: string[] = [];
    private currentWordIndex: number = 0;
    private inputText: string = '';

    private startTypingGame(): void {
        // 说明
        const instruction = this.add.text(640, 150, '快速输入屏幕上显示的文字！', {
            fontSize: '18px',
            color: '#888888'
        });
        instruction.setOrigin(0.5, 0.5);
        this.gameContainer.add(instruction);

        // 生成单词列表
        this.typingWords = [
            '报告', '会议', '项目', '客户', '数据', '分析', '方案', '审核',
            '提交', '审批', '邮件', '回复', '确认', '完成', '计划', '预算',
            '销售', '利润', '成本', '收入', '支出', '统计', '汇报', '协调'
        ];
        this.shuffleArray(this.typingWords);
        this.currentWordIndex = 0;
        this.inputText = '';

        // 显示当前单词
        const wordDisplay = this.add.text(640, 300, this.typingWords[0], {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        wordDisplay.setOrigin(0.5, 0.5);
        wordDisplay.setData('type', 'word');
        this.gameContainer.add(wordDisplay);

        // 输入框显示
        const inputDisplay = this.add.text(640, 400, '|', {
            fontSize: '36px',
            color: '#4a90d9',
            backgroundColor: '#333333',
            padding: { x: 30, y: 10 }
        });
        inputDisplay.setOrigin(0.5, 0.5);
        inputDisplay.setData('type', 'input');
        this.gameContainer.add(inputDisplay);

        // 键盘输入监听
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (!this.isGameActive) return;

            if (event.key === 'Backspace') {
                this.inputText = this.inputText.slice(0, -1);
            } else if (event.key.length === 1) {
                this.inputText += event.key;
            }

            // 更新输入显示
            this.gameContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
                if (child.getData && child.getData('type') === 'input') {
                    (child as Phaser.GameObjects.Text).setText(this.inputText + '|');
                }
            });

            // 检查是否匹配
            if (this.inputText === this.typingWords[this.currentWordIndex]) {
                this.updateScore(this.score + 10);
                this.currentWordIndex++;
                this.inputText = '';

                if (this.currentWordIndex >= this.typingWords.length) {
                    this.shuffleArray(this.typingWords);
                    this.currentWordIndex = 0;
                }

                // 更新单词显示
                this.gameContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
                    if (child.getData && child.getData('type') === 'word') {
                        (child as Phaser.GameObjects.Text).setText(this.typingWords[this.currentWordIndex]);
                    }
                    if (child.getData && child.getData('type') === 'input') {
                        (child as Phaser.GameObjects.Text).setText('|');
                    }
                });

                // 正确音效反馈
                this.showFeedback(true);
            }
        });

        this.startTimer();
    }

    // ========== 排序游戏 ==========

    private startSortingGame(): void {
        const instruction = this.add.text(640, 150, '按从小到大的顺序点击数字！', {
            fontSize: '18px',
            color: '#888888'
        });
        instruction.setOrigin(0.5, 0.5);
        this.gameContainer.add(instruction);

        this.generateSortingRound();
        this.startTimer();
    }

    private sortingNumbers: number[] = [];
    private nextExpectedNumber: number = 1;

    private generateSortingRound(): void {
        // 清除旧的数字
        this.gameContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
            if (child.getData && child.getData('type') === 'sortNumber') {
                child.destroy();
            }
        });

        // 生成新的数字（1-9）
        this.sortingNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(this.sortingNumbers);
        this.nextExpectedNumber = 1;

        // 3x3 网格显示
        this.sortingNumbers.forEach((num, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = 440 + col * 200;
            const y = 280 + row * 130;

            const numBtn = this.add.text(x, y, num.toString(), {
                fontSize: '48px',
                color: '#ffffff',
                backgroundColor: '#3a3a5a',
                padding: { x: 30, y: 15 }
            });
            numBtn.setOrigin(0.5, 0.5);
            numBtn.setInteractive({ useHandCursor: true });
            numBtn.setData('type', 'sortNumber');
            numBtn.setData('value', num);

            numBtn.on('pointerdown', () => {
                if (!this.isGameActive) return;

                if (num === this.nextExpectedNumber) {
                    numBtn.setStyle({ backgroundColor: '#2a6a2a' });
                    numBtn.disableInteractive();
                    this.nextExpectedNumber++;
                    this.updateScore(this.score + 5);
                    this.showFeedback(true);

                    // 完成一轮
                    if (this.nextExpectedNumber > 9) {
                        this.time.delayedCall(500, () => {
                            this.generateSortingRound();
                        });
                    }
                } else {
                    this.showFeedback(false);
                }
            });

            this.gameContainer.add(numBtn);
        });
    }

    // ========== 记忆游戏 ==========

    private memoryCards: { value: number; flipped: boolean; matched: boolean }[] = [];
    private firstCard: Phaser.GameObjects.Text | null = null;
    private secondCard: Phaser.GameObjects.Text | null = null;
    private canFlip: boolean = true;

    private startMemoryGame(): void {
        const instruction = this.add.text(640, 130, '翻开卡片，找到相同的数字配对！', {
            fontSize: '18px',
            color: '#888888'
        });
        instruction.setOrigin(0.5, 0.5);
        this.gameContainer.add(instruction);

        this.generateMemoryCards();
        this.startTimer();
    }

    private generateMemoryCards(): void {
        // 清除旧卡片
        this.gameContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
            if (child.getData && child.getData('type') === 'memoryCard') {
                child.destroy();
            }
        });

        // 生成配对数字（6对）
        const pairs = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
        this.shuffleArray(pairs);

        this.memoryCards = pairs.map(v => ({ value: v, flipped: false, matched: false }));
        this.firstCard = null;
        this.secondCard = null;
        this.canFlip = true;

        // 4x3 网格
        this.memoryCards.forEach((card, index) => {
            const col = index % 4;
            const row = Math.floor(index / 4);
            const x = 390 + col * 170;
            const y = 280 + row * 150;

            const cardObj = this.add.text(x, y, '?', {
                fontSize: '36px',
                color: '#ffffff',
                backgroundColor: '#4a4a6a',
                padding: { x: 30, y: 20 }
            });
            cardObj.setOrigin(0.5, 0.5);
            cardObj.setInteractive({ useHandCursor: true });
            cardObj.setData('type', 'memoryCard');
            cardObj.setData('index', index);
            cardObj.setData('value', card.value);

            cardObj.on('pointerdown', () => this.flipCard(cardObj, index));

            this.gameContainer.add(cardObj);
        });
    }

    private flipCard(cardObj: Phaser.GameObjects.Text, index: number): void {
        if (!this.isGameActive || !this.canFlip) return;
        if (this.memoryCards[index].flipped || this.memoryCards[index].matched) return;

        // 翻开卡片
        this.memoryCards[index].flipped = true;
        cardObj.setText(this.memoryCards[index].value.toString());
        cardObj.setStyle({ backgroundColor: '#6a6a8a' });

        if (!this.firstCard) {
            this.firstCard = cardObj;
        } else if (!this.secondCard) {
            this.secondCard = cardObj;
            this.canFlip = false;

            // 检查是否匹配
            const firstIndex = this.firstCard.getData('index') as number;
            const secondIndex = index;

            if (this.memoryCards[firstIndex].value === this.memoryCards[secondIndex].value) {
                // 匹配成功
                this.memoryCards[firstIndex].matched = true;
                this.memoryCards[secondIndex].matched = true;
                this.firstCard.setStyle({ backgroundColor: '#2a6a2a' });
                cardObj.setStyle({ backgroundColor: '#2a6a2a' });
                this.updateScore(this.score + 20);
                this.showFeedback(true);

                this.firstCard = null;
                this.secondCard = null;
                this.canFlip = true;

                // 检查是否全部完成
                if (this.memoryCards.every(c => c.matched)) {
                    this.time.delayedCall(500, () => {
                        this.generateMemoryCards();
                    });
                }
            } else {
                // 不匹配，翻回去
                this.time.delayedCall(800, () => {
                    this.memoryCards[firstIndex].flipped = false;
                    this.memoryCards[secondIndex].flipped = false;
                    if (this.firstCard) {
                        this.firstCard.setText('?');
                        this.firstCard.setStyle({ backgroundColor: '#4a4a6a' });
                    }
                    if (this.secondCard) {
                        this.secondCard.setText('?');
                        this.secondCard.setStyle({ backgroundColor: '#4a4a6a' });
                    }
                    this.firstCard = null;
                    this.secondCard = null;
                    this.canFlip = true;
                });
            }
        }
    }

    // ========== 点击游戏 ==========

    private startClickingGame(): void {
        const instruction = this.add.text(640, 150, '快速点击出现的目标！', {
            fontSize: '18px',
            color: '#888888'
        });
        instruction.setOrigin(0.5, 0.5);
        this.gameContainer.add(instruction);

        this.spawnTarget();
        this.startTimer();
    }

    private spawnTarget(): void {
        if (!this.isGameActive) return;

        // 随机位置
        const x = Phaser.Math.Between(200, 1080);
        const y = Phaser.Math.Between(200, 550);

        // 随机大小
        const size = Phaser.Math.Between(30, 60);

        const target = this.add.circle(x, y, size, 0xff4444);
        target.setInteractive({ useHandCursor: true });
        target.setData('type', 'target');
        this.gameContainer.add(target);

        // 点击得分
        target.on('pointerdown', () => {
            if (!this.isGameActive) return;
            this.updateScore(this.score + Math.floor(60 / size * 5));
            target.destroy();
            this.showFeedback(true);
            this.spawnTarget();
        });

        // 超时消失
        this.time.delayedCall(1500, () => {
            if (target.active) {
                target.destroy();
                this.spawnTarget();
            }
        });
    }

    // ========== 通用方法 ==========

    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private showFeedback(success: boolean): void {
        const feedback = this.add.text(640, 500, success ? '✓' : '✗', {
            fontSize: '48px',
            color: success ? '#00ff88' : '#ff4444'
        });
        feedback.setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: feedback,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => feedback.destroy()
        });
    }

    private endGame(): void {
        this.isGameActive = false;
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }

        // 计算任务完成度
        const completion = Math.min(100, this.score);
        const passed = this.score >= 100;

        // 显示结果
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);
        overlay.setDepth(1000);

        const resultContainer = this.add.container(640, 360).setDepth(1001);

        const resultBg = this.add.rectangle(0, 0, 450, 350, COLORS.panel, 0.9);
        applyGlassEffect(resultBg);
        resultContainer.add(resultBg);

        const resultTitle = this.add.text(0, -100, passed ? 'TASK COMPLETED' : 'TASK FAILED', {
            fontSize: '32px',
            fontFamily: FONTS.main,
            color: passed ? '#00ff88' : '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        resultContainer.add(resultTitle);

        const scoreResult = this.add.text(0, -20, `FINAL SCORE: ${this.score}`, {
            fontSize: '20px',
            fontFamily: FONTS.mono,
            color: '#ffffff'
        }).setOrigin(0.5);
        resultContainer.add(scoreResult);

        if (passed && this.currentTask) {
            const rewardText = this.add.text(0, 30, `REWARD: ¥${this.currentTask.reward}`, {
                fontSize: '18px',
                fontFamily: FONTS.mono,
                color: '#ffcc00'
            }).setOrigin(0.5);
            resultContainer.add(rewardText);
        }

        const exitBtn = createStyledButton(this, 0, 110, 240, 50, '返回办公室', () => this.exitGame(passed));
        resultContainer.add(exitBtn);

        // 动画
        resultContainer.setScale(0.8);
        resultContainer.setAlpha(0);
        this.tweens.add({
            targets: resultContainer,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    private exitGame(completed: boolean): void {
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }

        // 更新任务进度
        if (completed && this.currentTask) {
            gameState.updateTaskProgress(this.currentTask.id, 100);
        }

        this.scene.stop();
        this.scene.resume('ImprovedOfficeScene');
    }
}
