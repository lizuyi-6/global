/**
 * 全局 UI 配置文件
 * 现代简约风格 - 与 landing.html 统一的设计语言
 * 设计基准: 2560x1440 (2K 分辨率)
 */

// 现代配色方案 - 与 landing.html 完全一致
export const COLORS = {
    // 背景色 - Pure Dark Theme (与 landing.html 一致)
    bg: 0x050505,           // 纯黑背景 #050505
    bgSecondary: 0x0a0a0a,  // 次级背景 #0A0A0A
    bgPanel: 0x0c0c0e,      // 面板背景
    bgCard: 0x111113,       // 卡片背景
    bgDark: 0x020202,       // 最深黑
    bgGlass: 0x0f0f11,      // 毛玻璃背景 (window bar)

    // 边框色
    borderSubtle: 0x1f1f1f, // 微弱边框 #1F1F1F
    borderLight: 0x27272a,  // zinc-800
    borderMedium: 0x3f3f46, // zinc-700
    borderBright: 0x52525b, // zinc-600

    // 强调色 - 与 landing.html Tailwind 配置一致
    primary: 0x6366f1,      // indigo-500
    primaryLight: 0x818cf8, // indigo-400
    primaryDark: 0x4f46e5,  // indigo-600
    secondary: 0x8b5cf6,    // purple-500
    accent: 0x06b6d4,       // cyan-500
    success: 0x10b981,      // emerald-500
    danger: 0xef4444,       // red-500
    warning: 0xf59e0b,      // amber-500

    // 文字颜色 - Zinc 色阶
    textMain: 0xffffff,     // 主文字 white
    textSecondary: 0xa1a1aa,// zinc-400
    textDim: 0x71717a,      // zinc-500
    textMuted: 0x52525b,    // zinc-600
    textDark: 0x3f3f46,     // zinc-700

    // 状态色
    info: 0x6366f1,
    error: 0xef4444,

    // 面板色 (玻璃质感)
    panel: 0x0a0a0b,        // 面板主色
    panelLight: 0x0f0f11,   // 面板亮色
    panelOverlay: 0x1a1a1d, // 覆盖层

    // 特殊色
    textGold: 0xfbbf24,     // amber-400

    // 股市专用色
    stockUp: 0xff4444,      // 涨 - 红色
    stockDown: 0x00ff88,    // 跌 - 绿色
};

// 间距配置 - 2K 分辨率适配
export const SPACING = {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
    cardGap: 32,
    sectionPad: 64,
    // 网格配置
    gridSize: 80,           // 网格大小 (2K)
    gridOpacity: 0.02,      // 网格透明度
};

export const FONTS = {
    main: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace'
};

// 文字样式 - 2K 分辨率适配
export const TEXT_STYLES = {
    // 标题样式
    h1: {
        fontSize: '72px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    h2: {
        fontSize: '48px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    h3: {
        fontSize: '36px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    h4: {
        fontSize: '28px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    // 正文样式
    body: {
        fontSize: '24px',
        fontFamily: FONTS.main,
        color: '#a1a1aa'
    },
    bodyLarge: {
        fontSize: '28px',
        fontFamily: FONTS.main,
        color: '#a1a1aa'
    },
    bodySmall: {
        fontSize: '20px',
        fontFamily: FONTS.main,
        color: '#a1a1aa'
    },
    // 标签/说明
    caption: {
        fontSize: '20px',
        fontFamily: FONTS.main,
        color: '#71717a'
    },
    captionSmall: {
        fontSize: '16px',
        fontFamily: FONTS.main,
        color: '#52525b'
    },
    // 等宽字体
    mono: {
        fontSize: '24px',
        fontFamily: FONTS.mono,
        color: '#a1a1aa'
    },
    monoSmall: {
        fontSize: '20px',
        fontFamily: FONTS.mono,
        color: '#71717a'
    },
    monoLarge: {
        fontSize: '32px',
        fontFamily: FONTS.mono,
        color: '#ffffff'
    },
    // 按钮文字
    button: {
        fontSize: '24px',
        fontFamily: FONTS.main,
        color: '#ffffff',
        fontStyle: 'bold'
    },
    buttonSmall: {
        fontSize: '20px',
        fontFamily: FONTS.main,
        color: '#ffffff'
    }
};

/**
 * 响应式布局工具
 * 基于 2560x1440 的设计稿 (2K 分辨率)
 */
export class Layout {
    readonly width: number;
    readonly height: number;
    readonly centerX: number;
    readonly centerY: number;
    readonly scaleX: number;
    readonly scaleY: number;
    readonly scale: number;

    // 设计基准尺寸 - 2K
    static readonly BASE_WIDTH = 2560;
    static readonly BASE_HEIGHT = 1440;

    constructor(scene: Phaser.Scene) {
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.scaleX = this.width / Layout.BASE_WIDTH;
        this.scaleY = this.height / Layout.BASE_HEIGHT;
        this.scale = Math.min(this.scaleX, this.scaleY);
    }

    x(designX: number): number {
        return designX * this.scaleX;
    }

    y(designY: number): number {
        return designY * this.scaleY;
    }

    size(designSize: number): number {
        return designSize * this.scale;
    }

    fontSize(designSize: number): string {
        return Math.round(designSize * this.scale) + 'px';
    }
}

/**
 * 创建网格背景 - 与 landing.html 一致
 */
export function createGridBackground(
    scene: Phaser.Scene,
    width: number = 2560,
    height: number = 1440,
    gridSize: number = SPACING.gridSize,
    opacity: number = SPACING.gridOpacity
): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    graphics.setAlpha(0.4); // 整体透明度
    graphics.lineStyle(1, 0xffffff, opacity);

    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, height);
    }

    // 水平线
    for (let y = 0; y <= height; y += gridSize) {
        graphics.moveTo(0, y);
        graphics.lineTo(width, y);
    }

    graphics.strokePath();
    return graphics;
}

/**
 * 创建渐变光晕效果
 */
export function createGlow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number = COLORS.primary,
    alpha: number = 0.08
): Phaser.GameObjects.Graphics {
    const glow = scene.add.graphics();
    glow.fillStyle(color, alpha);
    glow.fillCircle(x, y, radius);
    return glow;
}

/**
 * 创建呼吸动画光晕
 */
export function createBreathingGlow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number = COLORS.primary,
    alpha: number = 0.08
): Phaser.GameObjects.Graphics {
    const glow = createGlow(scene, x, y, radius, color, alpha);

    scene.tweens.add({
        targets: glow,
        alpha: { from: 1, to: 0.6 },
        duration: 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    return glow;
}

/**
 * 创建玻璃质感卡片背景
 */
export function createGlassCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
        rounded?: number;
        fillColor?: number;
        fillAlpha?: number;
        borderColor?: number;
        borderAlpha?: number;
        borderWidth?: number;
    } = {}
): Phaser.GameObjects.Graphics {
    const {
        rounded = 16,
        fillColor = COLORS.bgPanel,
        fillAlpha = 0.6,
        borderColor = 0xffffff,
        borderAlpha = 0.05,
        borderWidth = 2
    } = options;

    const card = scene.add.graphics();
    card.fillStyle(fillColor, fillAlpha);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, rounded);

    if (borderWidth > 0) {
        card.lineStyle(borderWidth, borderColor, borderAlpha);
        card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, rounded);
    }

    return card;
}

/**
 * 创建窗口样式的卡片 (带顶部栏)
 */
export function createWindowCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
        rounded?: number;
        headerHeight?: number;
        showDots?: boolean;
    } = {}
): Phaser.GameObjects.Container {
    const {
        rounded = 16,
        headerHeight = 40,
        showDots = true
    } = options;

    const container = scene.add.container(x, y);

    // 卡片主体
    const cardBg = scene.add.graphics();
    cardBg.fillStyle(COLORS.bgPanel, 0.9);
    cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);
    cardBg.lineStyle(2, 0xffffff, 0.08);
    cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, rounded);

    // 顶部栏
    const headerBar = scene.add.graphics();
    headerBar.fillStyle(COLORS.bgGlass, 1);
    headerBar.fillRoundedRect(-width / 2, -height / 2, width, headerHeight, { tl: rounded, tr: rounded, bl: 0, br: 0 });

    container.add([cardBg, headerBar]);

    // 窗口按钮点
    if (showDots) {
        const dotColors = [0x3f3f46, 0x3f3f46, 0x3f3f46];
        dotColors.forEach((color, i) => {
            const dot = scene.add.circle(-width / 2 + 24 + i * 20, -height / 2 + headerHeight / 2, 6, color, 0.5);
            container.add(dot);
        });
    }

    return container;
}

/**
 * 磨砂玻璃质感效果辅助函数 - 现代风格
 */
export function applyGlassEffect(rect: Phaser.GameObjects.Rectangle, alpha = 0.5) {
    rect.setFillStyle(COLORS.bgPanel, alpha);
    rect.setStrokeStyle(2, 0xffffff, 0.05);
}

/**
 * 创建现代风格按钮 - 与 landing.html 一致
 * 字体大小根据按钮高度自动调整
 */
export function createStyledButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    style: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' = 'primary'
) {
    const container = scene.add.container(x, y);

    const colors = {
        primary: { bg: COLORS.primary, bgHover: COLORS.primaryLight, text: '#ffffff', border: COLORS.primaryLight },
        secondary: { bg: COLORS.bgCard, bgHover: COLORS.panelOverlay, text: '#a1a1aa', border: COLORS.borderMedium },
        ghost: { bg: 0x000000, bgHover: 0xffffff, text: '#a1a1aa', border: COLORS.borderLight },
        outline: { bg: 0x000000, bgHover: 0xffffff, text: '#a1a1aa', border: COLORS.borderMedium },
        danger: { bg: COLORS.danger, bgHover: 0xf87171, text: '#ffffff', border: 0xf87171 }
    };

    const c = colors[style];
    const isOutlineOrGhost = style === 'ghost' || style === 'outline';
    const rounded = Math.min(12, height / 4); // 圆角自适应
    const fontSize = Math.max(16, Math.min(28, height * 0.4)); // 字体大小自适应

    const bg = scene.add.graphics();
    if (isOutlineOrGhost) {
        bg.lineStyle(2, c.border, 0.5);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, rounded);
    } else {
        bg.fillStyle(c.bg, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);
    }

    const label = scene.add.text(0, 0, text, {
        fontSize: `${fontSize}px`,
        fontFamily: FONTS.main,
        color: c.text,
        fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);

    const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
        bg.clear();
        if (isOutlineOrGhost) {
            bg.fillStyle(c.bgHover, 0.05);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);
            bg.lineStyle(2, c.border, 0.8);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, rounded);
        } else {
            bg.fillStyle(c.bgHover, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);
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
            bg.lineStyle(2, c.border, 0.5);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, rounded);
        } else {
            bg.fillStyle(c.bg, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);
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
 * 创建现代卡片容器 - 增强版
 */
export function createCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
        rounded?: number;
        fill?: number;
        fillAlpha?: number;
        stroke?: boolean;
        strokeColor?: number;
        strokeAlpha?: number;
        strokeWidth?: number;
        shadow?: boolean;
    } = {}
): Phaser.GameObjects.Container {
    const {
        rounded = 16,
        fill = COLORS.bgCard,
        fillAlpha = 0.6,
        stroke = true,
        strokeColor = 0xffffff,
        strokeAlpha = 0.05,
        strokeWidth = 2,
        shadow = false
    } = options;

    const container = scene.add.container(x, y);

    // 阴影
    if (shadow) {
        const shadowRect = scene.add.rectangle(8, 8, width, height, 0x000000, 0.3);
        container.add(shadowRect);
    }

    const bg = scene.add.graphics();
    bg.fillStyle(fill, fillAlpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, rounded);

    if (stroke) {
        bg.lineStyle(strokeWidth, strokeColor, strokeAlpha);
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
 * 创建标签药丸 - 2K 适配
 */
export function createBadge(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: number = COLORS.primary,
    size: 'sm' | 'md' | 'lg' = 'md'
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    const fontSizes = { sm: '16px', md: '20px', lg: '24px' };
    const paddings = { sm: 12, md: 16, lg: 20 };

    const label = scene.add.text(0, 0, text, {
        fontSize: fontSizes[size],
        fontFamily: FONTS.main,
        color: '#ffffff'
    }).setOrigin(0.5);

    const padding = paddings[size];
    const bgWidth = label.width + padding * 2;
    const bgHeight = label.height + padding;

    const bg = scene.add.graphics();
    bg.fillStyle(color, 0.15);
    bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, bgHeight / 2);
    bg.lineStyle(2, color, 0.3);
    bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, bgHeight / 2);

    container.add([bg, label]);
    return container;
}

/**
 * 创建状态指示器 (带脉冲动画)
 */
export function createStatusIndicator(
    scene: Phaser.Scene,
    x: number,
    y: number,
    status: 'active' | 'warning' | 'error' | 'offline' = 'active'
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    const statusColors = {
        active: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.danger,
        offline: COLORS.textMuted
    };

    const color = statusColors[status];
    const dot = scene.add.circle(0, 0, 8, color);
    container.add(dot);

    if (status === 'active') {
        scene.tweens.add({
            targets: dot,
            alpha: { from: 1, to: 0.4 },
            scale: { from: 1, to: 1.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    return container;
}

/**
 * 创建进度条 (带标签)
 */
export function createLabeledProgressBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    label: string,
    progress: number,
    color: number = COLORS.primary
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // 标签
    const labelText = scene.add.text(0, -16, label, {
        fontSize: '18px',
        fontFamily: FONTS.main,
        color: '#71717a'
    });

    // 百分比
    const valueText = scene.add.text(width, -16, `${Math.round(progress * 100)}%`, {
        fontSize: '18px',
        fontFamily: FONTS.mono,
        color: '#a1a1aa'
    }).setOrigin(1, 0);

    // 背景
    const bgBar = scene.add.graphics();
    bgBar.fillStyle(COLORS.borderSubtle, 1);
    bgBar.fillRoundedRect(0, 8, width, 8, 4);

    // 进度
    const progressBar = scene.add.graphics();
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    if (clampedProgress > 0) {
        progressBar.fillStyle(color, 1);
        progressBar.fillRoundedRect(0, 8, width * clampedProgress, 8, 4);
    }

    container.add([labelText, valueText, bgBar, progressBar]);
    return container;
}
