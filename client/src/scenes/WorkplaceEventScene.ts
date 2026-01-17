import Phaser from 'phaser';
import { gameState } from '../GameState';
import { COLORS, FONTS, applyGlassEffect, createModernStarBackground, createStyledButton } from '../UIConfig';
import type { EventChoice, WorkplaceEvent } from '../WorkplaceSystem';
import { POSITIONS, workplaceSystem } from '../WorkplaceSystem';

/**
 * 职场事件弹窗场景
 */
export class WorkplaceEventScene extends Phaser.Scene {
    private event: WorkplaceEvent | null = null;
    private container!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'WorkplaceEventScene' });
    }

    init(data: { event: WorkplaceEvent }): void {
        this.event = data.event;
    }

    create(): void {
        if (!this.event) {
            this.scene.stop();
            return;
        }

        // 现代粒子星空背景
        createModernStarBackground(this, 1280, 720);

        // 标题容器
        const header = this.add.container(640, 60);
        const titleText = this.add.text(0, -15, '🎭 职场突发', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 25, 'UNEXPECTED SITUATION / RESPONSE REQUIRED', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        }).setOrigin(0.5);
        header.add([titleText, subTitleText]);

        // 主容器
        this.container = this.add.container(640, 380);

        // 事件卡片背景
        const cardBg = this.add.rectangle(0, 0, 700, 520, COLORS.panel, 0.9);
        applyGlassEffect(cardBg);
        this.container.add(cardBg);

        // 顶部发光条
        const glowBar = this.add.rectangle(0, -260, 700, 4, this.getHexColor(this.event.type));
        this.container.add(glowBar);

        // 事件类型标签
        const categoryLabels: { [key: string]: string } = {
            promotion: '📈 晋升机会',
            politics: '🎭 办公室政治',
            bullying: '⚠️ 职场困境',
            opportunity: '✨ 机会',
            crisis: '🚨 危机',
            social: '👥 社交'
        };
        const categoryLabel = this.add.text(0, -230, categoryLabels[this.event.category] || '📋 事件', {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: this.getTypeColor(this.event.type),
            backgroundColor: '#ffffff11',
            padding: { x: 12, y: 6 }
        });
        categoryLabel.setOrigin(0.5, 0.5);
        this.container.add(categoryLabel);

        // 事件标题
        const title = this.add.text(0, -180, this.event.title, {
            fontSize: '32px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.container.add(title);

        // 分隔线
        const divider = this.add.rectangle(0, -135, 600, 1, 0x4a90d9, 0.3);
        this.container.add(divider);

        // 事件描述
        const description = this.add.text(0, -40, this.event.description, {
            fontSize: '18px',
            fontFamily: FONTS.main,
            color: '#e0e0e0',
            wordWrap: { width: 600 },
            align: 'center',
            lineSpacing: 10
        });
        description.setOrigin(0.5, 0.5);
        this.container.add(description);

        // 当前状态显示
        const status = workplaceSystem.getStatus();
        const statusText = this.add.text(0, 50,
            `📊 KPI: ${status.performance.kpiScore}  |  😰 压力: ${status.stress}  |  ⭐ 名声: ${status.reputation}`, {
            fontSize: '13px',
            fontFamily: FONTS.mono,
            color: COLORS.primary.toString(16).padStart(6, '0') === '4a90d9' ? '#4a90d9' : '#888888' // Handle string vs number
        });
        statusText.setColor('#4a90d9');
        statusText.setOrigin(0.5, 0.5);
        this.container.add(statusText);

        // 选项
        this.event.choices.forEach((choice, index) => {
            this.createChoiceButton(choice, index, 120 + index * 75);
        });

        // 入场动画
        this.container.setScale(0.8);
        this.container.setAlpha(0);
        this.tweens.add({
            targets: this.container,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    private getHexColor(type: string): number {
        const colors: { [key: string]: number } = {
            positive: COLORS.success,
            negative: COLORS.danger,
            neutral: COLORS.primary,
            critical: 0xff00ff
        };
        return colors[type] || COLORS.primary;
    }

    private getTypeColor(type: string): string {
        const colors: { [key: string]: string } = {
            positive: '#00ff88',
            negative: '#ff4444',
            neutral: '#4a90d9',
            critical: '#ff88ff'
        };
        return colors[type] || '#ffffff';
    }

    private createChoiceButton(choice: EventChoice, index: number, y: number): void {
        // 检查是否满足要求
        const canChoose = this.checkRequirements(choice.requirements);

        // 按钮背景
        const btnWidth = 620;
        const btnHeight = 60;
        const btn = this.add.rectangle(0, y, btnWidth, btnHeight, canChoose ? 0xffffff : 0x000000, 0.05);
        btn.setStrokeStyle(1, canChoose ? 0x4a90d9 : 0x333333, 0.5);
        this.container.add(btn);

        // 悬停发光
        const hoverGlow = this.add.rectangle(0, y, btnWidth, btnHeight, 0x4a90d9, 0.1);
        hoverGlow.setVisible(false);
        this.container.add(hoverGlow);

        // 选项文字
        const choiceText = this.add.text(-290, y, choice.text, {
            fontSize: '16px',
            fontFamily: FONTS.main,
            color: canChoose ? '#ffffff' : '#666666'
        });
        choiceText.setOrigin(0, 0.5);
        this.container.add(choiceText);

        // 显示效果预览
        const effectsPreview = this.getEffectsPreview(choice.effects);
        const effectsText = this.add.text(290, y, effectsPreview, {
            fontSize: '13px',
            fontFamily: FONTS.mono,
            color: canChoose ? '#00ff88' : '#444444'
        });
        effectsText.setOrigin(1, 0.5);
        this.container.add(effectsText);

        // 如果有要求，显示要求
        if (choice.requirements && !canChoose) {
            const reqText = this.add.text(0, y + 20, this.getRequirementsText(choice.requirements), {
                fontSize: '11px',
                fontFamily: FONTS.main,
                color: '#ff4444'
            });
            reqText.setOrigin(0.5, 0.5);
            this.container.add(reqText);
        }

        // 交互
        if (canChoose) {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerover', () => {
                hoverGlow.setVisible(true);
                btn.setStrokeStyle(1, 0x4a90d9, 1);
                this.tweens.add({
                    targets: [btn, choiceText, effectsText, hoverGlow],
                    x: '+=5',
                    duration: 100
                });
            });
            btn.on('pointerout', () => {
                hoverGlow.setVisible(false);
                btn.setStrokeStyle(1, 0x4a90d9, 0.5);
                this.tweens.add({
                    targets: [btn, choiceText, effectsText, hoverGlow],
                    x: (target: any) => {
                        if (target === choiceText) return -290;
                        if (target === effectsText) return 290;
                        return 0;
                    },
                    duration: 100
                });
            });
            btn.on('pointerdown', () => {
                this.selectChoice(index);
            });
        }
    }

    private checkRequirements(requirements: EventChoice['requirements']): boolean {
        if (!requirements) return true;

        const account = gameState.getAccount();

        if (requirements.money && account.cash < requirements.money) {
            return false;
        }

        if (requirements.relationship) {
            const rel = gameState.getRelationship(requirements.relationship.npc);
            if (!rel || rel.favorability < requirements.relationship.min) {
                return false;
            }
        }

        if (requirements.position) {
            const status = workplaceSystem.getStatus();
            if (status.position.level < requirements.position) {
                return false;
            }
        }

        return true;
    }

    private getRequirementsText(requirements: EventChoice['requirements']): string {
        if (!requirements) return '';

        const parts: string[] = [];

        if (requirements.money) {
            parts.push(`需要 ¥${requirements.money}`);
        }
        if (requirements.relationship) {
            parts.push(`需要与${requirements.relationship.npc}好感度 ≥ ${requirements.relationship.min}`);
        }
        if (requirements.position) {
            const pos = POSITIONS.find(p => p.level === requirements.position);
            parts.push(`需要职位 ${pos?.title || '未知'}`);
        }

        return parts.join(' | ');
    }

    private getEffectsPreview(effects: EventChoice['effects']): string {
        const previews: string[] = [];

        effects.forEach(effect => {
            const sign = effect.value >= 0 ? '+' : '';
            switch (effect.type) {
                case 'money':
                    previews.push(`💰${sign}${effect.value}`);
                    break;
                case 'kpi':
                    previews.push(`📊${sign}${effect.value}`);
                    break;
                case 'stress':
                    previews.push(`😰${sign}${effect.value}`);
                    break;
                case 'reputation':
                    previews.push(`⭐${sign}${effect.value}`);
                    break;
                case 'relationship':
                    if (effect.target) {
                        previews.push(`${effect.target} ${sign}${effect.value}`);
                    }
                    break;
            }
        });

        return previews.slice(0, 3).join(' ');
    }

    private selectChoice(index: number): void {
        if (!this.event) return;

        // 应用效果
        const effects = workplaceSystem.applyEventChoice(this.event, index, {
            addCash: (amount: number, reason: string) => gameState.addCash(amount, reason),
            updateRelationship: (npc: string, change: number) => gameState.updateRelationship(npc, change)
        });

        // 显示结果
        this.showResults(effects);
    }

    private showResults(effects: { type: string; value: number; description?: string; target?: string }[]): void {
        // 清除选项
        this.container.removeAll(true);

        // 再次添加背景
        const cardBg = this.add.rectangle(0, 0, 700, 520, COLORS.panel, 0.9);
        applyGlassEffect(cardBg);
        this.container.add(cardBg);

        // 结果标题
        const title = this.add.text(0, -180, '事件结果', {
            fontSize: '32px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.container.add(title);

        const divider = this.add.rectangle(0, -135, 600, 1, 0x4a90d9, 0.3);
        this.container.add(divider);

        // 显示每个效果
        effects.forEach((effect, index) => {
            const y = -60 + index * 50;
            let text = '';
            let color = '#ffffff';

            switch (effect.type) {
                case 'money':
                    text = `💰 ${effect.value >= 0 ? '获得' : '失去'} ¥${Math.abs(effect.value)}`;
                    color = effect.value >= 0 ? '#00ff88' : '#ff4444';
                    break;
                case 'kpi':
                    text = `📊 KPI ${effect.value >= 0 ? '+' : ''}${effect.value}`;
                    color = effect.value >= 0 ? '#00ff88' : '#ff4444';
                    break;
                case 'stress':
                    text = `😰 压力 ${effect.value >= 0 ? '+' : ''}${effect.value}`;
                    color = effect.value >= 0 ? '#ff4444' : '#00ff88';
                    break;
                case 'reputation':
                    text = `⭐ 名声 ${effect.value >= 0 ? '+' : ''}${effect.value}`;
                    color = effect.value >= 0 ? '#00ff88' : '#ff4444';
                    break;
                case 'relationship':
                    text = `👤 与${effect.target}的关系 ${effect.value >= 0 ? '+' : ''}${effect.value}`;
                    color = effect.value >= 0 ? '#00ff88' : '#ff4444';
                    break;
                case 'faction':
                    text = `🏛️ ${effect.description || '派系变化'}`;
                    color = '#4a90d9';
                    break;
            }

            if (effect.description && effect.type !== 'faction') {
                text += ` (${effect.description})`;
            }

            const effectText = this.add.text(0, y, text, {
                fontSize: '20px',
                fontFamily: FONTS.main,
                color: color
            });
            effectText.setOrigin(0.5, 0.5);
            this.container.add(effectText);
        });

        // 继续按钮
        const continueBtn = createStyledButton(this, 0, 180, 200, 50, '继续', () => {
            this.closeEvent();
        });
        this.container.add(continueBtn);
    }

    private closeEvent(): void {
        this.tweens.add({
            targets: this.container,
            scale: 0.8,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.scene.stop();
                this.scene.resume('ImprovedOfficeScene');
            }
        });
    }
}
