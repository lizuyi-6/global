/**
 * 动画库 - 预定义所有游戏动画
 * 减少 AI token 消耗，资产复用
 */

import Phaser from 'phaser';

// 动画类型枚举
export enum AnimationType {
    THROW = 'throw',       // 投掷物品
    HIT = 'hit',           // 撞击效果
    DEBRIS = 'debris',     // 碎片生成
    HURT = 'hurt',         // NPC 受伤
    DODGE = 'dodge',       // NPC 躲避
    GATHER = 'gather',     // NPC 围观
    FLEE = 'flee',         // NPC 逃跑
    SHOCK = 'shock',       // NPC 震惊
    NOTICE = 'notice',     // NPC 注意到
    TALK = 'talk',         // NPC 对话
    WORK = 'work',         // 工作动画
    IDLE = 'idle',         // 空闲动画
    WALK = 'walk',         // 走路
    CHARGE = 'charge',     // 冲锋
    GENERIC = 'generic'    // 通用动画
}

// 动画命令接口
export interface AnimationCommand {
    type: AnimationType | string;
    target?: string;
    object?: string;
    duration?: number;
    delay?: number;
    variant?: string;
    params?: Record<string, any>;
}

// NPC 反应类型
export type NPCReactionType = 'hurt' | 'dodge' | 'gather' | 'flee' | 'shock' | 'notice' | 'talk';

/**
 * 动画播放器 - 处理所有游戏动画
 */
export class AnimationPlayer {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 播放动画序列
     */
    async playSequence(
        animations: AnimationCommand[],
        getObjectPosition: (name: string) => { x: number; y: number } | null,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null
    ): Promise<void> {
        for (const anim of animations) {
            const delay = anim.delay || 0;
            if (delay > 0) {
                await this.wait(delay);
            }

            switch (anim.type) {
                case AnimationType.THROW:
                    await this.playThrow(anim, getObjectPosition, getNPCSprite);
                    break;
                case AnimationType.HIT:
                    await this.playHit(anim, getNPCSprite);
                    break;
                case AnimationType.DEBRIS:
                    await this.playDebris(anim, getNPCSprite);
                    break;
                case AnimationType.HURT:
                    await this.playHurt(anim, getNPCSprite);
                    break;
                case AnimationType.DODGE:
                    await this.playDodge(anim, getNPCSprite);
                    break;
                case AnimationType.GATHER:
                case AnimationType.FLEE:
                case AnimationType.SHOCK:
                case AnimationType.NOTICE:
                    // NPC 反应由 playNPCReaction 处理
                    break;
                case AnimationType.WORK:
                    await this.playWork(anim);
                    break;
                default:
                    await this.playGeneric(anim);
                    break;
            }
        }
    }

    /**
     * 投掷动画
     */
    private async playThrow(
        anim: AnimationCommand,
        getObjectPosition: (name: string) => { x: number; y: number } | null,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null
    ): Promise<void> {
        const objectName = anim.object || '水杯';
        const targetName = anim.target || '';
        const duration = anim.duration || 500;

        // 获取玩家位置（屏幕中心偏下）
        const startX = this.scene.cameras.main.width / 2;
        const startY = this.scene.cameras.main.height / 2 + 50;

        // 获取目标位置
        const targetSprite = getNPCSprite(targetName);
        let endX = startX + 200;
        let endY = startY - 100;

        if (targetSprite) {
            endX = targetSprite.x;
            endY = targetSprite.y - 50;
        }

        // 创建投掷物
        const projectile = this.createProjectile(objectName, startX, startY);
        projectile.setDepth(9000);

        // 投掷动画（抛物线）
        this.scene.tweens.add({
            targets: projectile,
            x: endX,
            y: endY,
            duration: duration,
            ease: 'Quad.out',
            onComplete: () => {
                projectile.destroy();
            }
        });

        // 旋转效果
        this.scene.tweens.add({
            targets: projectile,
            angle: 720,
            duration: duration,
            ease: 'Linear'
        });

        await this.wait(duration);
    }

    /**
     * 创建投掷物图形
     */
    private createProjectile(objectName: string, x: number, y: number): Phaser.GameObjects.Graphics {
        const g = this.scene.add.graphics();
        g.x = x;
        g.y = y;

        // 根据物品名称绘制不同的图形
        if (objectName.includes('杯') || objectName.includes('水')) {
            // 水杯
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(-8, -12, 16, 16, 3);
            g.fillStyle(0x3498db, 0.6);
            g.fillEllipse(0, -8, 10, 4);
            // 把手
            g.lineStyle(2, 0xffffff, 1);
            g.beginPath();
            g.arc(8, -4, 4, -Math.PI / 2, Math.PI / 2, false);
            g.strokePath();
        } else if (objectName.includes('键盘')) {
            // 键盘
            g.fillStyle(0x2d3436, 1);
            g.fillRoundedRect(-20, -8, 40, 16, 2);
            g.fillStyle(0x636e72, 1);
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 8; j++) {
                    g.fillRect(-18 + j * 5, -6 + i * 4, 3, 2);
                }
            }
        } else if (objectName.includes('文件') || objectName.includes('纸')) {
            // 文件
            g.fillStyle(0xffffff, 1);
            g.fillRect(-10, -14, 20, 28);
            g.lineStyle(1, 0x333333, 0.5);
            for (let i = 0; i < 5; i++) {
                g.beginPath();
                g.moveTo(-7, -10 + i * 5);
                g.lineTo(7, -10 + i * 5);
                g.strokePath();
            }
        } else {
            // 默认圆形物体
            g.fillStyle(0x95a5a6, 1);
            g.fillCircle(0, 0, 10);
        }

        return g;
    }

    /**
     * 撞击效果
     */
    private async playHit(
        anim: AnimationCommand,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null
    ): Promise<void> {
        const targetSprite = getNPCSprite(anim.target || '');
        if (!targetSprite) return;

        // 撞击闪光
        const flash = this.scene.add.graphics();
        flash.x = targetSprite.x;
        flash.y = targetSprite.y - 30;
        flash.setDepth(9001);

        // 绘制撞击星星
        flash.fillStyle(0xffff00, 1);
        this.drawStar(flash, 0, 0, 5, 20, 10);

        // 闪烁动画
        this.scene.tweens.add({
            targets: flash,
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 2 },
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // 屏幕震动
        this.scene.cameras.main.shake(200, 0.02);

        await this.wait(200);
    }

    /**
     * 绘制星形
     */
    private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        g.beginPath();
        g.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            g.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            g.lineTo(x, y);
            rot += step;
        }

        g.lineTo(cx, cy - outerRadius);
        g.closePath();
        g.fillPath();
    }

    /**
     * 碎片效果
     */
    private async playDebris(
        anim: AnimationCommand,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null
    ): Promise<void> {
        const targetSprite = getNPCSprite(anim.target || '');
        let x = this.scene.cameras.main.width / 2;
        let y = this.scene.cameras.main.height / 2;

        if (targetSprite) {
            x = targetSprite.x;
            y = targetSprite.y + 30;
        }

        // 生成碎片
        const debrisCount = 8;
        for (let i = 0; i < debrisCount; i++) {
            const shard = this.scene.add.graphics();
            shard.x = x;
            shard.y = y;
            shard.setDepth(8999);

            // 随机碎片形状
            const size = Phaser.Math.Between(3, 8);
            const color = Phaser.Math.RND.pick([0xffffff, 0x3498db, 0xbdc3c7]);
            shard.fillStyle(color, 0.9);
            shard.fillTriangle(
                -size, size,
                size, size / 2,
                0, -size
            );

            // 散开动画
            const angle = (i / debrisCount) * Math.PI * 2;
            const distance = Phaser.Math.Between(30, 80);
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance + 20; // 重力效果

            this.scene.tweens.add({
                targets: shard,
                x: endX,
                y: endY,
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
    private async playHurt(
        anim: AnimationCommand,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null
    ): Promise<void> {
        const targetSprite = getNPCSprite(anim.target || '');
        if (!targetSprite) return;

        const originalX = targetSprite.x;

        // 红色闪烁
        const flash = this.scene.add.graphics();
        flash.x = targetSprite.x;
        flash.y = targetSprite.y;
        flash.setDepth(targetSprite.depth + 1);
        flash.fillStyle(0xff0000, 0.3);
        flash.fillEllipse(0, -20, 60, 80);

        // 震动效果
        this.scene.tweens.add({
            targets: targetSprite,
            x: originalX + 5,
            duration: 50,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                targetSprite.x = originalX;
            }
        });

        // 闪烁消失
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        await this.wait(300);
    }

    /**
     * NPC 躲避动画
     */
    private async playDodge(
        anim: AnimationCommand,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null
    ): Promise<void> {
        const targetSprite = getNPCSprite(anim.target || '');
        if (!targetSprite) return;

        const originalX = targetSprite.x;
        const dodgeDistance = 50;

        this.scene.tweens.add({
            targets: targetSprite,
            x: originalX + dodgeDistance,
            duration: 150,
            ease: 'Quad.out',
            yoyo: true,
            hold: 200
        });

        await this.wait(500);
    }

    /**
     * 工作动画
     */
    private async playWork(anim: AnimationCommand): Promise<void> {
        // 显示工作进度条或效果
        const duration = anim.duration || 2000;

        const progressBar = this.scene.add.graphics();
        progressBar.x = this.scene.cameras.main.width / 2;
        progressBar.y = this.scene.cameras.main.height / 2 - 100;
        progressBar.setDepth(9000);

        // 背景
        progressBar.fillStyle(0x333333, 0.8);
        progressBar.fillRoundedRect(-100, -10, 200, 20, 5);

        // 进度
        const progress = { value: 0 };
        this.scene.tweens.add({
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
                this.scene.tweens.add({
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
     * 通用动画
     */
    private async playGeneric(anim: AnimationCommand): Promise<void> {
        const duration = anim.duration || 1000;

        // 简单的等待效果
        const dots = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 - 80,
            '...',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5).setDepth(9000);

        await this.wait(duration);
        dots.destroy();
    }

    /**
     * 播放 NPC 反应
     */
    async playNPCReaction(
        npcName: string,
        reactionType: NPCReactionType,
        getNPCSprite: (name: string) => Phaser.GameObjects.Container | null,
        eventPosition?: { x: number; y: number }
    ): Promise<void> {
        const sprite = getNPCSprite(npcName);
        if (!sprite) return;

        switch (reactionType) {
            case 'gather':
                // 围观 - 向事件位置移动
                if (eventPosition) {
                    const dx = eventPosition.x - sprite.x;
                    const dy = eventPosition.y - sprite.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const moveDistance = Math.min(distance - 50, 100);

                    if (moveDistance > 0) {
                        this.scene.tweens.add({
                            targets: sprite,
                            x: sprite.x + (dx / distance) * moveDistance,
                            y: sprite.y + (dy / distance) * moveDistance,
                            duration: 500,
                            ease: 'Quad.out'
                        });
                    }
                }
                // 显示惊叹号
                this.showEmoji(sprite.x, sprite.y - 60, '!');
                break;

            case 'flee':
                // 逃跑 - 远离事件位置
                if (eventPosition) {
                    const dx = sprite.x - eventPosition.x;
                    const dy = sprite.y - eventPosition.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const fleeDistance = 100;

                    this.scene.tweens.add({
                        targets: sprite,
                        x: sprite.x + (dx / distance) * fleeDistance,
                        y: sprite.y + (dy / distance) * fleeDistance,
                        duration: 400,
                        ease: 'Quad.out'
                    });
                }
                break;

            case 'shock':
                // 震惊 - 轻微后退 + 感叹号
                this.scene.tweens.add({
                    targets: sprite,
                    y: sprite.y - 10,
                    duration: 100,
                    yoyo: true
                });
                this.showEmoji(sprite.x, sprite.y - 60, '!?');
                break;

            case 'notice':
                // 注意到 - 问号
                this.showEmoji(sprite.x, sprite.y - 60, '?');
                break;

            case 'talk':
                // 对话 - 对话气泡
                this.showEmoji(sprite.x, sprite.y - 60, '💬');
                break;

            case 'hurt':
                // 已在 playHurt 处理
                break;

            case 'dodge':
                // 已在 playDodge 处理
                break;
        }

        await this.wait(300);
    }

    /**
     * 显示表情符号
     */
    private showEmoji(x: number, y: number, emoji: string): void {
        const text = this.scene.add.text(x, y, emoji, {
            fontSize: '32px',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(9002);

        this.scene.tweens.add({
            targets: text,
            y: y - 20,
            alpha: 0,
            duration: 1500,
            delay: 500,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 等待指定时间
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve);
        });
    }
}
