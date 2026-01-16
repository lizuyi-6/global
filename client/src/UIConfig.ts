/**
 * 全局 UI 配置文件
 * 用于统筹游戏的视觉风格、颜色、字体和组件样式
 */

export const COLORS = {
    // 基础背景
    bg: 0x0a0a0f,
    panel: 0x16161e,
    panelOverlay: 0x1c1c28,

    // 强调色
    primary: 0x4a90d9,
    secondary: 0x6ab0f9,
    accent: 0x00ff88,
    danger: 0xff4444,
    warning: 0xffaa00,

    // 文字颜色
    textMain: 0xffffff,
    textDim: 0x888888,
    textGold: 0xffdd00,

    // 状态色
    success: 0x00ff88,
    info: 0x4a90d9,
    error: 0xff4444
};

export const FONTS = {
    main: 'Inter, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace'
};

export const TEXT_STYLES = {
    h1: {
        fontSize: '32px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    h2: {
        fontSize: '24px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    body: {
        fontSize: '16px',
        fontFamily: FONTS.main,
        color: '#e0e0e0'
    },
    caption: {
        fontSize: '14px',
        fontFamily: FONTS.main,
        color: '#888888'
    },
    mono: {
        fontSize: '14px',
        fontFamily: FONTS.mono,
        color: '#00ff88'
    }
};

/**
 * 磨砂玻璃质感效果辅助函数
 */
export function applyGlassEffect(rect: Phaser.GameObjects.Rectangle, alpha = 0.8) {
    rect.setFillStyle(COLORS.panel, alpha);
    rect.setStrokeStyle(1, 0x4a90d9, 0.3);
}

/**
 * 创建带光效的按钮
 */
export function createStyledButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void
) {
    const container = scene.add.container(x, y);

    const bg = scene.add.rectangle(0, 0, width, height, COLORS.primary, 0.1);
    bg.setStrokeStyle(2, COLORS.primary, 0.5);

    const label = scene.add.text(0, 0, text, {
        fontSize: '16px',
        fontFamily: FONTS.main,
        color: '#4a90d9',
        fontStyle: '500' as any // Phaser uses fontStyle for weight in some cases, or we can just leave it
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
        bg.setFillStyle(COLORS.primary, 0.2);
        bg.setStrokeStyle(2, COLORS.primary, 1);
        label.setColor('#ffffff');
        scene.tweens.add({
            targets: container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100
        });
    });

    bg.on('pointerout', () => {
        bg.setFillStyle(COLORS.primary, 0.1);
        bg.setStrokeStyle(2, COLORS.primary, 0.5);
        label.setColor('#4a90d9');
        scene.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 100
        });
    });

    bg.on('pointerdown', () => {
        scene.tweens.add({
            targets: container,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 50,
            yoyo: true
        });
        onClick();
    });

    return container;
}
