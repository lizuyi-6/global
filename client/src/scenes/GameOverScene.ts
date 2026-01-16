import Phaser from 'phaser';
import { jobHuntSystem } from '../JobHuntSystem';

/**
 * 游戏结束场景
 * 支持两种结局：胜利（入职成功）和失败（破产/超时）
 */
export class GameOverScene extends Phaser.Scene {
    private isVictory: boolean = false;
    private endReason: string = '';
    private companyName: string = '';
    private salary: number = 0;
    private stats: {
        days: number;
        applications: number;
        interviews: number;
        offers: number;
        rejections: number;
        finalSavings: number;
    } = {
            days: 0,
            applications: 0,
            interviews: 0,
            offers: 0,
            rejections: 0,
            finalSavings: 0
        };

    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data: {
        victory: boolean;
        reason: string;
        companyName?: string;
        salary?: number
    }): void {
        this.isVictory = data.victory;
        this.endReason = data.reason;
        this.companyName = data.companyName || '';
        this.salary = data.salary || 0;

        // 获取统计数据
        const status = jobHuntSystem.getStatus();
        this.stats = {
            days: status.currentDay,
            applications: status.totalApplications,
            interviews: status.totalInterviews,
            offers: status.totalOffers,
            rejections: status.totalRejections,
            finalSavings: status.savings
        };
    }

    create(): void {
        // 背景渐变
        const bg = this.add.rectangle(640, 360, 1280, 720, this.isVictory ? 0x1a3a1a : 0x3a1a1a);

        // 渐入动画
        bg.setAlpha(0);
        this.tweens.add({
            targets: bg,
            alpha: 1,
            duration: 1000
        });

        if (this.isVictory) {
            this.createVictoryScreen();
        } else {
            this.createDefeatScreen();
        }

        // 延迟显示按钮
        this.time.delayedCall(2000, () => {
            this.createButtons();
        });
    }

    private createVictoryScreen(): void {
        // 胜利标题
        const title = this.add.text(640, 100, '🎉 恭喜入职！', {
            fontSize: '48px',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: 120,
            duration: 800,
            ease: 'Back.easeOut'
        });

        // 公司信息
        const companyText = this.add.text(640, 200, `成功入职 ${this.companyName}`, {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);

        const salaryText = this.add.text(640, 245, `年薪: ¥${(this.salary * 12).toLocaleString()}`, {
            fontSize: '24px',
            color: '#ffdd00'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [companyText, salaryText],
            alpha: 1,
            delay: 500,
            duration: 600
        });

        // 求职历程统计
        this.createStatsPanel(320, true);

        // 评价
        const evaluation = this.getVictoryEvaluation();
        const evalText = this.add.text(640, 580, evaluation, {
            fontSize: '16px',
            color: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: evalText,
            alpha: 1,
            delay: 1500,
            duration: 800
        });
    }

    private createDefeatScreen(): void {
        // 失败标题
        const title = this.add.text(640, 100, '💔 求职失败', {
            fontSize: '48px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: 120,
            duration: 800,
            ease: 'Back.easeOut'
        });

        // 失败原因
        const reasonText = this.add.text(640, 200, this.endReason, {
            fontSize: '24px',
            color: '#ffaaaa'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: reasonText,
            alpha: 1,
            delay: 500,
            duration: 600
        });

        // 求职历程统计
        this.createStatsPanel(280, false);

        // 建议
        const advice = this.getDefeatAdvice();
        const adviceText = this.add.text(640, 580, advice, {
            fontSize: '16px',
            color: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: adviceText,
            alpha: 1,
            delay: 1500,
            duration: 800
        });
    }

    private createStatsPanel(startY: number, isVictory: boolean): void {
        const panel = this.add.container(640, startY);
        panel.setAlpha(0);

        // 背景
        const bg = this.add.rectangle(0, 0, 700, 250, 0x2a2a3a, 0.8);
        bg.setStrokeStyle(2, isVictory ? 0x00ff88 : 0xff4444);
        panel.add(bg);

        // 标题
        const panelTitle = this.add.text(0, -100, '求职历程', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        panel.add(panelTitle);

        // 统计数据（两列布局）
        const stats = [
            { label: '求职天数', value: `${this.stats.days} 天`, icon: '📅' },
            { label: '投递简历', value: `${this.stats.applications} 份`, icon: '📨' },
            { label: '面试次数', value: `${this.stats.interviews} 次`, icon: '🎤' },
            { label: '获得Offer', value: `${this.stats.offers} 个`, icon: '✅' },
            { label: '被拒次数', value: `${this.stats.rejections} 次`, icon: '❌' },
            { label: '剩余存款', value: `¥${this.stats.finalSavings.toLocaleString()}`, icon: '💰' }
        ];

        const leftX = -250;
        const rightX = 150;
        const startItemY = -50;
        const lineHeight = 40;

        stats.forEach((stat, index) => {
            const isLeft = index < 3;
            const x = isLeft ? leftX : rightX;
            const y = startItemY + (index % 3) * lineHeight;

            const statText = this.add.text(x, y,
                `${stat.icon} ${stat.label}: ${stat.value}`, {
                fontSize: '16px',
                color: '#cccccc'
            });
            panel.add(statText);
        });

        this.tweens.add({
            targets: panel,
            alpha: 1,
            delay: 1000,
            duration: 800
        });
    }

    private getVictoryEvaluation(): string {
        const { days, rejections, applications } = this.stats;
        const rejectRate = applications > 0 ? rejections / applications : 0;

        if (days <= 30 && rejectRate < 0.3) {
            return '⭐⭐⭐⭐⭐ 完美！你以极高的效率和通过率完成了求职。\n你是一个真正的职场精英！';
        } else if (days <= 60 && rejectRate < 0.5) {
            return '⭐⭐⭐⭐ 优秀！在合理的时间内找到了心仪的工作。\n保持这种积极的态度，未来可期！';
        } else if (days <= 90) {
            return '⭐⭐⭐ 不错！虽然过程有些曲折，但最终还是成功了。\n求职本就不易，坚持就是胜利！';
        } else {
            return '⭐⭐ 终于找到工作了！过程虽然漫长，但好结果就是最好的回报。\n记住这段经历，未来会更好！';
        }
    }

    private getDefeatAdvice(): string {
        const { rejections, interviews, applications, finalSavings } = this.stats;

        if (finalSavings <= 0) {
            return '💡 提示：控制每日开支很重要！\n下次可以尝试：\n• 尽早投递简历，增加面试机会\n• 通过理财增加收入\n• 优化简历提高通过率';
        } else if (applications < 10) {
            return '💡 提示：投递量不够！\n求职是一个概率游戏，多投递才有更多机会。\n建议每周至少投递 5-10 份简历。';
        } else if (interviews === 0) {
            return '💡 提示：简历可能需要优化！\n• 检查学历和经验是否匹配职位要求\n• 丰富技能列表和项目经验\n• 适当降低目标公司难度';
        } else if (rejections > interviews * 2) {
            return '💡 提示：面试表现需要提升！\n• 认真准备面试，思考后再回答\n• 避免选择过于自大或消极的回答\n• 压力面试要保持冷静';
        } else {
            return '💡 求职不易，失败是正常的。\n调整心态，总结经验，再战一次！';
        }
    }

    private createButtons(): void {
        const buttonY = 660;
        const buttonContainer = this.add.container(640, buttonY);
        buttonContainer.setAlpha(0);

        // 重新开始
        const restartBg = this.add.rectangle(-100, 0, 180, 50, 0x4a90d9);
        restartBg.setStrokeStyle(2, 0x6ab0f9);
        const restartText = this.add.text(-100, 0, '🔄 重新开始', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        restartBg.setInteractive({ useHandCursor: true });
        restartBg.on('pointerover', () => {
            restartBg.setFillStyle(0x5aa0e9);
            this.tweens.add({ targets: [restartBg, restartText], scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });
        restartBg.on('pointerout', () => {
            restartBg.setFillStyle(0x4a90d9);
            this.tweens.add({ targets: [restartBg, restartText], scaleX: 1, scaleY: 1, duration: 100 });
        });
        restartBg.on('pointerdown', () => {
            this.restartGame();
        });

        buttonContainer.add([restartBg, restartText]);

        // 继续游戏（仅胜利时显示）
        if (this.isVictory) {
            const continueBg = this.add.rectangle(100, 0, 180, 50, 0x2a5a2a);
            continueBg.setStrokeStyle(2, 0x00ff88);
            const continueText = this.add.text(100, 0, '➡️ 继续职场', {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            continueBg.setInteractive({ useHandCursor: true });
            continueBg.on('pointerover', () => {
                continueBg.setFillStyle(0x3a7a3a);
                this.tweens.add({ targets: [continueBg, continueText], scaleX: 1.05, scaleY: 1.05, duration: 100 });
            });
            continueBg.on('pointerout', () => {
                continueBg.setFillStyle(0x2a5a2a);
                this.tweens.add({ targets: [continueBg, continueText], scaleX: 1, scaleY: 1, duration: 100 });
            });
            continueBg.on('pointerdown', () => {
                this.continueToOffice();
            });

            buttonContainer.add([continueBg, continueText]);
        }

        this.tweens.add({
            targets: buttonContainer,
            alpha: 1,
            duration: 500
        });
    }

    private restartGame(): void {
        // 重置游戏状态
        jobHuntSystem.reset();

        // 淡出效果
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('ResumeEditScene');
        });
    }

    private continueToOffice(): void {
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('OfficeScene');
        });
    }
}
