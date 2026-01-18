import Phaser from 'phaser';
import { jobHuntSystem } from '../JobHuntSystem';
import { COLORS, FONTS, applyGlassEffect, createModernStarBackground, createStyledButton } from '../UIConfig';

/**
 * 游戏结束场景
 * 支持多种结局：成功入职、失业破产、精神崩溃、财富自由
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
        // 2K 设计尺寸 (2560x1440)
        const DESIGN_WIDTH = 2560;
        const DESIGN_HEIGHT = 1440;
        const centerX = DESIGN_WIDTH / 2;
        const centerY = DESIGN_HEIGHT / 2;

        // 现代粒子星空背景
        createModernStarBackground(this, DESIGN_WIDTH, DESIGN_HEIGHT);

        // 装饰性光晕
        const glowColor = this.isVictory ? COLORS.success : COLORS.danger;
        const glow = this.add.circle(centerX, centerY, 600, glowColor, 0.05);
        this.tweens.add({
            targets: glow,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.1,
            duration: 3000,
            yoyo: true,
            repeat: -1
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
        const centerX = 1280;

        // 胜利标题
        const title = this.add.text(centerX, 200, '🎉 MISSION ACCOMPLISHED', {
            fontSize: '80px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold',
            letterSpacing: 8
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: 240,
            duration: 800,
            ease: 'Power2'
        });

        // 公司信息
        const companyText = this.add.text(centerX, 400, `已获得 ${this.companyName} 录用确认`, {
            fontSize: '48px',
            fontFamily: FONTS.main,
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);

        const salaryText = this.add.text(centerX, 490, `ESTIMATED ANNUAL INCOME: ¥${(this.salary * 12).toLocaleString()}`, {
            fontSize: '36px',
            fontFamily: FONTS.mono,
            color: '#ffaa00'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [companyText, salaryText],
            alpha: 1,
            delay: 500,
            duration: 600
        });

        // 求职历程统计
        this.createStatsPanel(640, true);

        // 评价
        const evaluation = this.getVictoryEvaluation();
        const evalText = this.add.text(centerX, 1160, evaluation, {
            fontSize: '30px',
            fontFamily: FONTS.main,
            color: '#888888',
            align: 'center',
            wordWrap: { width: 1200 },
            lineSpacing: 16
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: evalText,
            alpha: 1,
            delay: 1500,
            duration: 800
        });
    }

    private createDefeatScreen(): void {
        const centerX = 1280;

        // 失败标题
        const title = this.add.text(centerX, 200, '💀 SYSTEM TERMINATED', {
            fontSize: '80px',
            fontFamily: FONTS.mono,
            color: '#ff4444',
            fontStyle: 'bold',
            letterSpacing: 8
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: 240,
            duration: 800,
            ease: 'Power2'
        });

        // 失败原因
        const reasonText = this.add.text(centerX, 400, this.endReason, {
            fontSize: '48px',
            fontFamily: FONTS.main,
            color: '#ffaaaa'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: reasonText,
            alpha: 1,
            delay: 500,
            duration: 600
        });

        // 求职历程统计
        this.createStatsPanel(560, false);

        // 建议
        const advice = this.getDefeatAdvice();
        const adviceText = this.add.text(centerX, 1160, advice, {
            fontSize: '30px',
            fontFamily: FONTS.main,
            color: '#888888',
            align: 'center',
            wordWrap: { width: 1200 },
            lineSpacing: 16
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: adviceText,
            alpha: 1,
            delay: 1500,
            duration: 800
        });
    }

    private createStatsPanel(startY: number, isVictory: boolean): void {
        const panel = this.add.container(1280, startY);
        panel.setAlpha(0);

        // 背景
        const bg = this.add.rectangle(0, 0, 1400, 500, COLORS.panel, 0.5);
        bg.setStrokeStyle(2, isVictory ? COLORS.success : COLORS.danger, 0.3);
        applyGlassEffect(bg, 0.5);
        panel.add(bg);

        // 标题
        const panelTitle = this.add.text(0, -200, 'HISTORICAL DATA / 历史记录', {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: '#ffffff',
            letterSpacing: 4
        }).setOrigin(0.5);
        panel.add(panelTitle);

        // 统计数据
        const stats = [
            { label: 'SURVIVAL DAYS / 存活天数', value: `${this.stats.days}`, icon: '📅' },
            { label: 'APPLICATIONS / 简历投递', value: `${this.stats.applications}`, icon: '📨' },
            { label: 'INTERVIEWS / 面试经历', value: `${this.stats.interviews}`, icon: '🎤' },
            { label: 'OFFERS / 录用确认', value: `${this.stats.offers}`, icon: '✅' },
            { label: 'REJECTIONS / 被拒次数', value: `${this.stats.rejections}`, icon: '❌' },
            { label: 'FINAL ASSETS / 最终资产', value: `¥${this.stats.finalSavings.toLocaleString()}`, icon: '💰' }
        ];

        stats.forEach((stat, index) => {
            const isLeft = index < 3;
            const x = isLeft ? -600 : 100;
            const y = -100 + (index % 3) * 90;

            const icon = this.add.text(x, y, stat.icon, { fontSize: '36px' }).setOrigin(0, 0.5);
            const label = this.add.text(x + 70, y - 20, stat.label, {
                fontSize: '20px',
                fontFamily: FONTS.mono,
                color: '#666666'
            }).setOrigin(0, 0.5);
            const value = this.add.text(x + 70, y + 20, stat.value, {
                fontSize: '32px',
                fontFamily: FONTS.mono,
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            panel.add([icon, label, value]);
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
            return '完美达成目标。你以极高的效率和精准度完成了求职过程，展现了卓越的职场适应力和竞争优势。你是天生的职场赢家。';
        } else if (days <= 60 && rejectRate < 0.5) {
            return '表现出色。在合理的周期内锁定了心仪职位，具备稳定的专业素养和沟通能力。保持这种节奏，职场之路将一帆风顺。';
        } else if (days <= 90) {
            return '达成目标。求职过程虽有波折，但你凭借韧性最终获得了回报。坚持是职场中最重要的品质之一。';
        } else {
            return '虽过程漫长，但最终结果令人欣慰。这段艰难的求职经历将成为你职业生涯中的宝贵财富。';
        }
    }

    private getDefeatAdvice(): string {
        const { rejections, interviews, applications, finalSavings } = this.stats;

        if (finalSavings <= 0) {
            return '系统分析：财务管理失控。资产耗尽是导致失败的主要原因。\n策略建议：优先控制每日开销，并通过理财尝试增加被动收入，延长生存周期。';
        } else if (applications < 10) {
            return '系统分析：样本量不足。求职是概率博弈，过低的参与度导致机会匮乏。\n策略建议：大幅提升每日投递量，至少建立 5 份以上的并行流程。';
        } else if (interviews === 0) {
            return '系统分析：简历匹配度极低。市场对你的简历未能产生有效响应。\n策略建议：全面重构简历内容，降低目标职位门槛，或提升相关专业技能。';
        } else if (rejections > interviews * 2) {
            return '系统分析：临场表现异常。简历成功转化面试，但未能通过最终考核。\n策略建议：针对面试环节进行深度复盘，优化沟通逻辑和问题应对策略。';
        } else {
            return '系统分析：综合环境压力过载。\n策略建议：调整心态，总结历史数据，重新开启求职序列。';
        }
    }

    private createButtons(): void {
        const buttonY = 1320;
        const centerX = 1280;

        // 重新开始
        const restartBtn = createStyledButton(this, centerX - 200, buttonY, 360, 100, '🔄 RELOAD SYSTEM', () => this.restartGame());

        // 继续游戏（仅胜利时显示）
        if (this.isVictory) {
            const continueBtn = createStyledButton(this, centerX + 200, buttonY, 360, 100, '➡️ ENTER OFFICE', () => this.continueToOffice());
        } else {
            // 失败时按钮居中
            restartBtn.setX(centerX);
        }
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
            this.scene.start('ImprovedOfficeScene');
        });
    }
}
