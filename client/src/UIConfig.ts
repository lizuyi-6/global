/**
 * 全局 UI 配置文件
 * 现代简约风格 - 参考新模板设计语言
 */

// 现代配色方案 - 与 HTML 模板一致
export const COLORS = {
    // 背景色 - Deep Slate Theme
    bg: 0x0f0f14,           // Main Deep Slate
    bgSecondary: 0x18181b,  // Lighter Slate
    bgPanel: 0x1a1a20,      // Panel BG
    bgCard: 0x202025,       // Card BG (High Contrast)
    bgDark: 0x0a0a0e,       // Darkest

    // 边框色
    borderSubtle: 0x2d2d35,
    borderLight: 0x3f3f4a,
    borderMedium: 0x52525b,

    // 强调色 - Neon/Premium
    primary: 0x6366f1,      // 靖蓝 (Indigo)
    secondary: 0x8b5cf6,    // 紫色 (Purple)
    accent: 0x06b6d4,       // 青色 (Cyan)
    success: 0x10b981,      // 绿色 (Emerald)
    danger: 0xef4444,       // 红色 (Red)
    warning: 0xf59e0b,      // 琥珀 (Amber)

    // 文字颜色
    textMain: 0xffffff,
    textSecondary: 0xc0c0c6, // Brighter secondary
    textDim: 0x8a8a95,
    textMuted: 0x52525b,
    textDark: 0x3f3f46,

    // 状态色
    info: 0x6366f1,
    error: 0xef4444,

    // 面板色
    panel: 0x15151a,
    panelLight: 0x1e1e24,
    panelOverlay: 0x25252e,

    // 特殊色
    textGold: 0xfbbf24
};

export const SPACING = {
    sms: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    cardGap: 24,
    sectionPad: 48
};

export const FONTS = {
    main: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace'
};

export const TEXT_STYLES = {
    h1: {
        fontSize: '56px', // Increased
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    h2: {
        fontSize: '36px', // Increased
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    h3: {
        fontSize: '28px', // Increased
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: '600'
    },
    body: {
        fontSize: '16px', // Base 16px
        fontFamily: FONTS.main,
        color: '#c0c0c6'
    },
    bodyLarge: {
        fontSize: '18px', // Increased
        fontFamily: FONTS.main,
        color: '#c0c0c6'
    },
    caption: {
        fontSize: '14px', // Increased
        fontFamily: FONTS.main,
        color: '#8a8a95'
    },
    captionSmall: {
        fontSize: '12px',
        fontFamily: FONTS.main,
        color: '#71717a'
    },
    mono: {
        fontSize: '14px',
        fontFamily: FONTS.mono,
        color: '#c0c0c6'
    },
    monoSmall: {
        fontSize: '12px',
        fontFamily: FONTS.mono,
        color: '#8a8a95'
    }
};

/**
 * 响应式布局工具
 * 基于 1280x720 的设计稿，计算实际坐标
 */
export class Layout {
    readonly width: number;
    readonly height: number;
    readonly centerX: number;
    readonly centerY: number;
    readonly scaleX: number;
    readonly scaleY: number;
    readonly scale: number;  // 统一缩放比例（取较小值保持比例）

    // 设计基准尺寸
    static readonly BASE_WIDTH = 1280;
    static readonly BASE_HEIGHT = 720;

    constructor(scene: Phaser.Scene) {
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.scaleX = this.width / Layout.BASE_WIDTH;
        this.scaleY = this.height / Layout.BASE_HEIGHT;
        this.scale = Math.min(this.scaleX, this.scaleY);
    }

    // 转换设计稿坐标到实际坐标
    x(designX: number): number {
        return designX * this.scaleX;
    }

    y(designY: number): number {
        return designY * this.scaleY;
    }

    // 缩放尺寸（保持比例）
    size(designSize: number): number {
        return designSize * this.scale;
    }

    // 缩放字体大小
    fontSize(designSize: number): string {
        return Math.round(designSize * this.scale) + 'px';
    }
}

/**
 * 磨砂玻璃质感效果辅助函数 - 现代风格
 */
export function applyGlassEffect(rect: Phaser.GameObjects.Rectangle, alpha = 0.5) {
    rect.setFillStyle(COLORS.panel, alpha);
    rect.setStrokeStyle(1, 0xffffff, 0.05);
}

/**
 * 创建现代风格按钮 - 与新模板一致
 */
export function createStyledButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    style: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary'
) {
    const container = scene.add.container(x, y);

    const colors = {
        primary: { bg: COLORS.primary, bgHover: 0x818cf8, text: '#ffffff', border: 0x818cf8 },
        secondary: { bg: COLORS.bgPanel, bgHover: COLORS.panelLight, text: '#a1a1aa', border: 0x3f3f46 },
        ghost: { bg: 0x000000, bgHover: 0xffffff, text: '#a1a1aa', border: 0x3f3f46 },
        outline: { bg: 0x000000, bgHover: 0xffffff, text: '#a1a1aa', border: 0x52525b }
    };

    const c = colors[style];
    const isOutlineOrGhost = style === 'ghost' || style === 'outline';

    const bg = scene.add.graphics();
    if (isOutlineOrGhost) {
        bg.lineStyle(1, c.border, 0.5);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    } else {
        bg.fillStyle(c.bg, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    }

    const label = scene.add.text(0, 0, text, {
        fontSize: '13px',
        fontFamily: FONTS.main,
        color: c.text,
        fontStyle: '500' as any
    }).setOrigin(0.5);

    container.add([bg, label]);

    // 交互区域
    const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
        bg.clear();
        if (isOutlineOrGhost) {
            bg.fillStyle(c.bgHover, 0.05);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(1, c.border, 0.8);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        } else {
            bg.fillStyle(c.bgHover, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
        }
        label.setColor('#ffffff');
        scene.tweens.add({
            targets: container,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 100,
            ease: 'Cubic.out'
        });
    });

    hitArea.on('pointerout', () => {
        bg.clear();
        if (isOutlineOrGhost) {
            bg.lineStyle(1, c.border, 0.5);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        } else {
            bg.fillStyle(c.bg, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
        }
        label.setColor(c.text);
        scene.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 100
        });
    });

    hitArea.on('pointerdown', () => {
        scene.tweens.add({
            targets: container,
            scaleX: 0.97,
            scaleY: 0.97,
            duration: 50,
            yoyo: true
        });
        onClick();
    });

    return container;
}

/**
 * 创建现代卡片容器
 */
export function createCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: { rounded?: number; fill?: number; fillAlpha?: number; stroke?: boolean } = {}
): Phaser.GameObjects.Container {
    const { rounded = 12, fill = COLORS.bgCard, fillAlpha = 0.8, stroke = true } = options;
    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(fill, fillAlpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);

    if (stroke) {
        bg.lineStyle(1, 0xffffff, 0.05);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, rounded);
    }

    container.add(bg);
    return container;
}

/**
 * 创建进度条
 */
export function createProgressBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    color: number = COLORS.primary
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // 背景
    const bgBar = scene.add.graphics();
    bgBar.fillStyle(COLORS.borderSubtle, 1);
    bgBar.fillRoundedRect(0, 0, width, height, height / 2);

    // 进度
    const progressBar = scene.add.graphics();
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    if (clampedProgress > 0) {
        progressBar.fillStyle(color, 1);
        progressBar.fillRoundedRect(0, 0, width * clampedProgress, height, height / 2);
    }

    container.add([bgBar, progressBar]);
    return container;
}

/**
 * 创建分割线
 */
export function createDivider(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    vertical: boolean = false
): Phaser.GameObjects.Rectangle {
    if (vertical) {
        return scene.add.rectangle(x, y, 1, width, 0xffffff, 0.05);
    }
    return scene.add.rectangle(x, y, width, 1, 0xffffff, 0.05);
}

/**
 * 创建标签药丸
 */
export function createBadge(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: number = COLORS.primary
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    const label = scene.add.text(0, 0, text, {
        fontSize: '10px',
        fontFamily: FONTS.main,
        color: '#ffffff'
    }).setOrigin(0.5);

    const padding = 8;
    const bgWidth = label.width + padding * 2;
    const bgHeight = label.height + 6;

    const bg = scene.add.graphics();
    bg.fillStyle(color, 0.2);
    bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, bgHeight / 2);
    bg.lineStyle(1, color, 0.3);
    bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, bgHeight / 2);

    container.add([bg, label]);
    return container;
}
