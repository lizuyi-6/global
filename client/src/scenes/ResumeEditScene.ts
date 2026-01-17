import Phaser from 'phaser';
import { jobHuntSystem, type PlayerResume } from '../JobHuntSystem';
import { COLORS, FONTS, createStyledButton, Layout } from '../UIConfig';

/**
 * 简历编辑场景 - 现代风格 (响应式布局)
 * 支持不同屏幕尺寸自适应
 */
export class ResumeEditScene extends Phaser.Scene {
    private formData: Partial<PlayerResume>;
    private currentEducation: PlayerResume['education'] = 'bachelor';
    private currentSalaryMin = 10000;
    private currentSalaryMax = 25000;
    private educationButtons: Phaser.GameObjects.Container[] = [];
    private salaryDisplay!: Phaser.GameObjects.Text;
    private layout!: Layout;

    constructor() {
        super({ key: 'ResumeEditScene' });
        this.formData = {};
    }

    create(): void {
        // 初始化响应式布局
        this.layout = new Layout(this);

        // 创建渐变背景
        this.createBackground();

        // 创建浮动装饰
        this.createFloatingOrbs();

        // 页面标题
        this.createHeader();

        // 主内容区
        this.createFormContent();

        // 入场动画
        this.playEntranceAnimations();
    }

    private createBackground(): void {
        const L = this.layout;
        
        // 深空渐变背景
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x030308, 0x030308, 0x0a0a1a, 0x0a0a1a, 1);
        bg.fillRect(0, 0, L.width, L.height);

        // 现代粒子星空系统
        this.createModernStarfield();
        
        // 流动粒子
        this.createFlowingParticles();
        
        // 网格背景 - 更精细
        this.createGridBackground();
        
        // 现代光晕效果
        this.createModernGlow();
    }

    private createModernStarfield(): void {
        const L = this.layout;
        
        // 第一层: 远处微小星点 - 静态背景
        const farStars = this.add.graphics();
        farStars.setAlpha(0.6);
        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, L.width);
            const y = Phaser.Math.Between(0, L.height);
            const size = Phaser.Math.FloatBetween(0.5, 1);
            farStars.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.5));
            farStars.fillCircle(x, y, size);
        }
        
        // 第二层: 中距离星点 - 微微闪烁
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, L.width);
            const y = Phaser.Math.Between(0, L.height);
            const star = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 1.5), 0xffffff, 0.4);
            
            this.tweens.add({
                targets: star,
                alpha: { from: 0.4, to: 0.1 },
                duration: Phaser.Math.Between(2000, 5000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // 第三层: 近处亮星 - 带光芒
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(100, L.width - 100);
            const y = Phaser.Math.Between(50, L.height - 50);
            this.createGlowingStar(x, y);
        }
    }
    
    private createGlowingStar(x: number, y: number): void {
        // 外层光晕
        const glow = this.add.graphics();
        glow.fillStyle(0x6366f1, 0.1);
        glow.fillCircle(x, y, 20);
        glow.fillStyle(0x6366f1, 0.05);
        glow.fillCircle(x, y, 35);
        
        // 十字光芒
        const rays = this.add.graphics();
        rays.lineStyle(1, 0xffffff, 0.3);
        rays.lineBetween(x - 15, y, x + 15, y);
        rays.lineBetween(x, y - 15, x, y + 15);
        rays.lineStyle(1, 0xffffff, 0.15);
        rays.lineBetween(x - 8, y - 8, x + 8, y + 8);
        rays.lineBetween(x + 8, y - 8, x - 8, y + 8);
        
        // 核心亮点
        const core = this.add.circle(x, y, 2, 0xffffff, 0.9);
        
        // 脉冲动画
        this.tweens.add({
            targets: [glow, rays],
            alpha: { from: 1, to: 0.5 },
            scale: { from: 1, to: 1.2 },
            duration: Phaser.Math.Between(3000, 5000),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createFlowingParticles(): void {
        const L = this.layout;
        
        // 创建多组上升粒子
        for (let i = 0; i < 30; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, L.width),
                Phaser.Math.Between(0, L.height),
                Phaser.Math.FloatBetween(1, 3),
                0x6366f1,
                Phaser.Math.FloatBetween(0.1, 0.4)
            );
            
            // 上升+漂移动画
            this.tweens.add({
                targets: particle,
                y: -50,
                x: particle.x + Phaser.Math.Between(-100, 100),
                alpha: 0,
                duration: Phaser.Math.Between(8000, 15000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 5000),
                onRepeat: () => {
                    particle.x = Phaser.Math.Between(0, L.width);
                    particle.y = L.height + 50;
                    particle.alpha = Phaser.Math.FloatBetween(0.1, 0.4);
                }
            });
        }
        
        // 浮动光点粒子 - 更大更柔和
        for (let i = 0; i < 15; i++) {
            const size = Phaser.Math.Between(40, 100);
            const floater = this.add.circle(
                Phaser.Math.Between(0, L.width),
                Phaser.Math.Between(0, L.height),
                size,
                [0x6366f1, 0x8b5cf6, 0x06b6d4, 0x10b981][Phaser.Math.Between(0, 3)],
                Phaser.Math.FloatBetween(0.01, 0.03)
            );
            
            // 随机漂浮
            this.tweens.add({
                targets: floater,
                x: floater.x + Phaser.Math.Between(-150, 150),
                y: floater.y + Phaser.Math.Between(-100, 100),
                alpha: Phaser.Math.FloatBetween(0.01, 0.04),
                scale: Phaser.Math.FloatBetween(0.8, 1.3),
                duration: Phaser.Math.Between(10000, 20000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    private createModernGlow(): void {
        const L = this.layout;
        
        // 左上角主光源 - indigo
        const topLeftGlow = this.add.graphics();
        topLeftGlow.fillStyle(0x6366f1, 0.12);
        topLeftGlow.fillCircle(L.x(200), L.y(100), L.size(400));
        topLeftGlow.fillStyle(0x6366f1, 0.06);
        topLeftGlow.fillCircle(L.x(200), L.y(100), L.size(600));
        
        // 右下角辅光源 - cyan
        const bottomRightGlow = this.add.graphics();
        bottomRightGlow.fillStyle(0x06b6d4, 0.08);
        bottomRightGlow.fillCircle(L.x(2200), L.y(1300), L.size(500));
        bottomRightGlow.fillStyle(0x06b6d4, 0.04);
        bottomRightGlow.fillCircle(L.x(2200), L.y(1300), L.size(700));
        
        // 中心点缀 - purple
        const centerGlow = this.add.graphics();
        centerGlow.fillStyle(0x8b5cf6, 0.05);
        centerGlow.fillCircle(L.centerX, L.centerY, L.size(600));
        
        // 呼吸动画
        this.tweens.add({
            targets: [topLeftGlow, bottomRightGlow, centerGlow],
            alpha: { from: 1, to: 0.6 },
            duration: 5000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createGridBackground(): void {
        const graphics = this.add.graphics();
        graphics.setAlpha(0.25);
        const gridSize = 80; // Scaled up
        graphics.lineStyle(1, 0xffffff, 0.02);

        for (let x = 0; x <= 2560; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 1440);
        }
        for (let y = 0; y <= 1440; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(2560, y);
        }
        graphics.strokePath();
    }

    private createFloatingOrbs(): void {
        const orbs = [
            { x: 160, y: 360, size: 100, color: COLORS.primary, alpha: 0.03 },
            { x: 2400, y: 260, size: 140, color: COLORS.secondary, alpha: 0.025 },
            { x: 240, y: 1040, size: 90, color: COLORS.accent, alpha: 0.035 },
            { x: 2300, y: 960, size: 120, color: COLORS.primary, alpha: 0.025 }
        ];

        orbs.forEach((orb, i) => {
            const circle = this.add.circle(orb.x, orb.y, orb.size, orb.color, orb.alpha);
            this.tweens.add({
                targets: circle,
                x: orb.x + Phaser.Math.Between(-40, 40),
                y: orb.y + Phaser.Math.Between(-30, 30),
                duration: 4000 + i * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    private createHeader(): void {
        const L = this.layout;
        const header = this.add.container(L.centerX, L.y(110));
        header.setAlpha(0);
        header.setData('entrance', true);

        // 小标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(0xffffff, 0.06);
        tagBg.fillRoundedRect(-L.size(120), -L.size(50), L.size(240), L.size(48), L.size(24));

        const tagText = this.add.text(0, -L.size(26), '个人档案', {
            fontSize: L.width < 1600 ? '18px' : '22px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        // 主标题
        const title = this.add.text(0, L.size(40), '简历配置', {
            fontSize: L.width < 1600 ? '48px' : '72px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        header.add([tagBg, tagText, title]);
    }

    private createFormContent(): void {
        const L = this.layout;
        
        // 检测是否需要单列布局（屏幕较窄时）
        const isSingleColumn = L.width < 1600;
        
        // 响应式布局参数
        const contentWidth = isSingleColumn ? L.width * 0.85 : L.width * 0.42;
        const leftX = isSingleColumn ? L.centerX : L.x(560);
        const rightX = isSingleColumn ? L.centerX : L.x(2000);
        const fieldWidth = isSingleColumn ? Math.min(600, L.width * 0.7) : L.size(440);
        const wideFieldWidth = isSingleColumn ? Math.min(800, L.width * 0.85) : L.size(880);
        const spacing = L.size(isSingleColumn ? 140 : 170);
        
        let leftY = L.y(isSingleColumn ? 240 : 280);
        let rightY = L.y(280);

        // ========== 左列 ==========
        // 姓名
        this.createFormField(leftX, leftY, '姓名', '求职者', fieldWidth, (text) => {
            this.formData.name = text;
        });
        this.formData.name = '求职者';

        // 年龄 - 单列模式下换行
        if (isSingleColumn) {
            leftY += spacing;
            this.createFormField(leftX, leftY, '年龄', '25', L.size(160), (text) => {
                this.formData.age = parseInt(text) || 25;
            });
        } else {
            this.createFormField(leftX + L.size(520), leftY, '年龄', '25', L.size(160), (text) => {
                this.formData.age = parseInt(text) || 25;
            });
        }
        this.formData.age = 25;
        leftY += spacing;

        // 学历选择
        this.createLabel(isSingleColumn ? leftX - fieldWidth / 2 : leftX - L.size(260), leftY, '最高学历');
        this.createEducationButtons(isSingleColumn ? leftX - fieldWidth / 2 : leftX - L.size(260), leftY + L.size(60), isSingleColumn);
        this.formData.education = 'bachelor';
        leftY += L.size(isSingleColumn ? 160 : 190);

        // 学校
        this.createFormField(leftX, leftY, '毕业院校', '某某大学', fieldWidth, (text) => {
            this.formData.school = text;
        });
        this.formData.school = '某某大学';

        // 专业 - 单列模式下换行
        if (isSingleColumn) {
            leftY += spacing;
            this.createFormField(leftX, leftY, '专业', '计算机科学', fieldWidth, (text) => {
                this.formData.major = text;
            });
        } else {
            this.createFormField(leftX + L.size(520), leftY, '专业', '计算机科学', L.size(360), (text) => {
                this.formData.major = text;
            });
        }
        this.formData.major = '计算机科学';
        leftY += spacing;

        // 工作年限
        this.createFormField(leftX, leftY, '工作经验', '2 年', L.size(200), (text) => {
            this.formData.experience = parseInt(text) || 0;
        });
        this.formData.experience = 2;
        leftY += spacing;

        // 技能
        this.createFormField(leftX, leftY, '核心技能', 'JavaScript, React, TypeScript, Node.js', wideFieldWidth, (text) => {
            this.formData.skills = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.skills = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
        leftY += spacing;

        // 项目经验
        this.createFormField(leftX, leftY, '项目经验', '电商平台, 后台管理系统, 小程序', wideFieldWidth, (text) => {
            this.formData.projects = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.projects = ['电商平台', '后台管理系统', '小程序'];

        // ========== 右列 / 单列模式下继续向下 ==========
        if (isSingleColumn) {
            leftY += spacing + L.size(40);
            // 期望薪资面板
            this.createSalaryPanel(leftX, leftY, isSingleColumn);
            leftY += L.size(380);

            // 提示卡片 - 单列模式下隐藏以节省空间
            // this.createTipsCard(leftX, leftY);
        } else {
            // 期望薪资面板
            this.createSalaryPanel(rightX, rightY, isSingleColumn);
            rightY += L.size(400);

            // 提示卡片
            this.createTipsCard(rightX, rightY);
        }

        // 保存按钮
        this.createSaveButton(isSingleColumn);
    }

    private createLabel(x: number, y: number, text: string): void {
        this.add.text(x, y, text, {
            fontSize: '26px',
            fontFamily: FONTS.main,
            color: '#71717a'
        });
    }

    private createFormField(x: number, y: number, label: string, defaultValue: string, width: number, onChange: (text: string) => void): void {
        const container = this.add.container(x, y);
        container.setAlpha(0);
        container.setData('entrance', true);
        container.setData('delay', 100);

        // 标签 - 向上移动，避免被输入框遮挡
        const labelText = this.add.text(-width / 2, -40, label, {
            fontSize: '26px',
            fontFamily: FONTS.main,
            color: '#a1a1aa' // Lighter color for label
        });

        // 输入框背景 - 下移
        const inputBg = this.add.graphics();
        inputBg.fillStyle(COLORS.bgPanel, 0.9);
        inputBg.fillRoundedRect(-width / 2, 0, width, 88, 16);
        inputBg.lineStyle(2, 0xffffff, 0.05);
        inputBg.strokeRoundedRect(-width / 2, 0, width, 88, 16);

        // 交互区域
        const hitArea = this.add.rectangle(0, 44, width, 88, 0x000000, 0);

        // 输入值 - 居中显示在输入框内
        const valueText = this.add.text(-width / 2 + 30, 44, defaultValue, {
            fontSize: '30px',
            fontFamily: FONTS.main,
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        container.add([labelText, inputBg, valueText, hitArea]);

        // 交互
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerover', () => {
            inputBg.clear();
            inputBg.fillStyle(COLORS.bgPanel, 1);
            inputBg.fillRoundedRect(-width / 2, 0, width, 88, 16); // Match new y=0 position
            inputBg.lineStyle(2, COLORS.primary, 0.4);
            inputBg.strokeRoundedRect(-width / 2, 0, width, 88, 16);
        });
        hitArea.on('pointerout', () => {
            inputBg.clear();
            inputBg.fillStyle(COLORS.bgPanel, 0.9);
            inputBg.fillRoundedRect(-width / 2, 0, width, 88, 16);
            inputBg.lineStyle(2, 0xffffff, 0.05);
            inputBg.strokeRoundedRect(-width / 2, 0, width, 88, 16);
        });
        hitArea.on('pointerdown', () => {
            this.showInputDialog(label, valueText.text, (newValue) => {
                valueText.setText(newValue);
                onChange(newValue);
            });
        });

        onChange(defaultValue);
    }

    private showInputDialog(title: string, currentValue: string, onSubmit: (value: string) => void): void {
        const L = this.layout;
        const overlay = this.add.rectangle(L.centerX, L.centerY, L.width, L.height, 0x000000, 0.85);
        overlay.setDepth(1000);
        overlay.setInteractive();

        const dialog = this.add.container(L.centerX, L.centerY);
        dialog.setDepth(1001);

        const dialogWidth = Math.min(L.size(840), L.width * 0.9);
        const dialogHeight = L.size(360);
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(COLORS.bgPanel, 0.98);
        dialogBg.fillRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, L.size(24));
        dialogBg.lineStyle(2, 0xffffff, 0.08);
        dialogBg.strokeRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, L.size(24));

        const dialogTitle = this.add.text(0, -dialogHeight / 2 + L.size(70), `编辑${title}`, {
            fontSize: L.width < 1600 ? '28px' : '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        dialog.add([dialogBg, dialogTitle]);

        // HTML 输入框 - 响应式尺寸
        const inputWidth = Math.min(680, L.width * 0.7);
        const inputHTML = `
            <div style="width: ${L.width}px; height: ${L.height}px; display: flex; justify-content: center; align-items: center; pointer-events: none;">
                <div style="pointer-events: auto; display: flex; flex-direction: column; gap: 24px; margin-top: 100px;">
                    <input type="text" id="dialogInput" value="${currentValue}"
                           style="width: ${inputWidth}px; padding: 20px 28px; font-size: ${L.width < 1600 ? '24' : '30'}px;
                                  background: #0d0d12; color: #ffffff;
                                  border: 2px solid rgba(255,255,255,0.15);
                                  border-radius: 16px; outline: none;
                                  font-family: -apple-system, sans-serif;" />
                    <div style="display: flex; gap: 20px; justify-content: center;">
                        <button id="dialogSubmit" style="padding: 16px 48px; font-size: ${L.width < 1600 ? '24' : '30'}px;
                                background: #6366f1; color: #ffffff;
                                border: none; border-radius: 16px; cursor: pointer;
                                font-weight: 500;">确定</button>
                        <button id="dialogCancel" style="padding: 16px 48px; font-size: ${L.width < 1600 ? '24' : '30'}px;
                                background: #27272a; color: #a1a1aa;
                                border: 2px solid rgba(255,255,255,0.1);
                                border-radius: 16px; cursor: pointer;">取消</button>
                    </div>
                </div>
            </div>
        `;

        const domElement = this.add.dom(0, 0).createFromHTML(inputHTML);
        domElement.setOrigin(0, 0);
        domElement.setDepth(1002);

        const cleanup = () => {
            overlay.destroy();
            dialog.destroy();
            domElement.destroy();
        };

        this.time.delayedCall(50, () => {
            const input = document.getElementById('dialogInput') as HTMLInputElement;
            const submitBtn = document.getElementById('dialogSubmit');
            const cancelBtn = document.getElementById('dialogCancel');

            if (input) {
                input.focus();
                input.select();
            }

            submitBtn?.addEventListener('click', () => {
                if (input && input.value.trim()) {
                    onSubmit(input.value.trim());
                }
                cleanup();
            });

            cancelBtn?.addEventListener('click', cleanup);

            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (input.value.trim()) onSubmit(input.value.trim());
                    cleanup();
                } else if (e.key === 'Escape') {
                    cleanup();
                }
            });
        });
    }

    private createEducationButtons(x: number, y: number, isSingleColumn: boolean = false): void {
        const L = this.layout;
        const educations: Array<{ value: PlayerResume['education']; label: string }> = [
            { value: 'high_school', label: '高中' },
            { value: 'college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士' },
            { value: 'phd', label: '博士' }
        ];

        // 响应式按钮尺寸
        const btnWidth = isSingleColumn ? L.size(100) : L.size(150);
        const btnHeight = isSingleColumn ? L.size(50) : L.size(72);
        const btnSpacing = isSingleColumn ? L.size(110) : L.size(170);
        const fontSize = isSingleColumn ? '20px' : '26px';

        let btnX = x;
        this.educationButtons = [];

        educations.forEach((edu) => {
            const isActive = this.currentEducation === edu.value;
            const container = this.add.container(btnX + btnWidth / 2, y);
            container.setAlpha(0);
            container.setData('entrance', true);

            const bg = this.add.graphics();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 1);
            } else {
                bg.fillStyle(COLORS.bgPanel, 0.8);
            }
            bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, L.size(16));
            bg.lineStyle(2, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, L.size(16));

            const hitAreaEdu = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);

            const label = this.add.text(0, 0, edu.label, {
                fontSize: fontSize,
                fontFamily: FONTS.main,
                color: isActive ? '#ffffff' : '#71717a'
            }).setOrigin(0.5);

            container.add([bg, label, hitAreaEdu]);
            container.setData('value', edu.value);
            container.setData('bg', bg);
            container.setData('label', label);
            container.setData('btnWidth', btnWidth);
            container.setData('btnHeight', btnHeight);

            hitAreaEdu.setInteractive({ useHandCursor: true });
            hitAreaEdu.on('pointerdown', () => {
                this.currentEducation = edu.value;
                this.formData.education = edu.value;
                this.updateEducationButtons();
            });

            this.educationButtons.push(container);
            btnX += btnSpacing;
        });
    }

    private updateEducationButtons(): void {
        const L = this.layout;
        this.educationButtons.forEach(container => {
            const value = container.getData('value');
            const bg = container.getData('bg') as Phaser.GameObjects.Graphics;
            const label = container.getData('label') as Phaser.GameObjects.Text;
            const btnWidth = container.getData('btnWidth') || L.size(150);
            const btnHeight = container.getData('btnHeight') || L.size(72);
            const isActive = value === this.currentEducation;

            bg.clear();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 1);
            } else {
                bg.fillStyle(COLORS.bgPanel, 0.8);
            }
            bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, L.size(16));
            bg.lineStyle(2, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, L.size(16));
            label.setColor(isActive ? '#ffffff' : '#71717a');
        });
    }

    private createSalaryPanel(x: number, y: number, isSingleColumn: boolean = false): void {
        const L = this.layout;
        const panel = this.add.container(x, y);
        panel.setAlpha(0);
        panel.setData('entrance', true);

        // 响应式面板尺寸
        const panelWidth = isSingleColumn ? Math.min(500, L.width * 0.8) : L.size(560);
        const panelHeight = isSingleColumn ? L.size(320) : L.size(360);

        // 面板背景 - 现代卡片风格
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.bgCard, 0.7);
        bg.fillRoundedRect(-panelWidth / 2, -L.size(40), panelWidth, panelHeight, L.size(24));
        bg.lineStyle(2, 0xffffff, 0.05);
        bg.strokeRoundedRect(-panelWidth / 2, -L.size(40), panelWidth, panelHeight, L.size(24));

        // 标题
        const title = this.add.text(0, 0, '期望薪资', {
            fontSize: isSingleColumn ? '26px' : '32px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 薪资显示
        this.salaryDisplay = this.add.text(0, L.size(isSingleColumn ? 90 : 110), '', {
            fontSize: isSingleColumn ? '40px' : '56px',
            fontFamily: FONTS.mono,
            color: '#10b981',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.updateSalaryDisplay();

        // 最低薪资调节
        const controlSpacing = isSingleColumn ? L.size(120) : L.size(160);
        this.createSalaryControl(panel, -controlSpacing, L.size(isSingleColumn ? 170 : 200), '最低', () => this.currentSalaryMin, (v) => {
            this.currentSalaryMin = v;
            if (this.currentSalaryMin > this.currentSalaryMax) {
                this.currentSalaryMax = this.currentSalaryMin;
            }
            this.updateSalaryDisplay();
        }, isSingleColumn);

        // 最高薪资调节
        this.createSalaryControl(panel, controlSpacing, L.size(isSingleColumn ? 170 : 200), '最高', () => this.currentSalaryMax, (v) => {
            this.currentSalaryMax = v;
            if (this.currentSalaryMax < this.currentSalaryMin) {
                this.currentSalaryMin = this.currentSalaryMax;
            }
            this.updateSalaryDisplay();
        }, isSingleColumn);

        panel.add([bg, title, this.salaryDisplay]);
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];
    }

    private createSalaryControl(parent: Phaser.GameObjects.Container, x: number, y: number, label: string, getValue: () => number, setValue: (v: number) => void, isSingleColumn: boolean = false): void {
        const L = this.layout;
        const fontSize = isSingleColumn ? '18px' : '22px';
        const btnFontSize = isSingleColumn ? '32px' : '40px';

        const labelText = this.add.text(x, y - L.size(30), label, {
            fontSize: fontSize,
            fontFamily: FONTS.main,
            color: '#52525b'
        }).setOrigin(0.5);

        const btnSpacing = isSingleColumn ? L.size(50) : L.size(70);
        const minusBtn = this.add.text(x - btnSpacing, y + L.size(20), '−', {
            fontSize: btnFontSize,
            fontFamily: FONTS.mono,
            color: '#a1a1aa',
            backgroundColor: '#27272a',
            padding: { x: isSingleColumn ? 14 : 20, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const plusBtn = this.add.text(x + btnSpacing, y + L.size(20), '+', {
            fontSize: btnFontSize,
            fontFamily: FONTS.mono,
            color: '#a1a1aa',
            backgroundColor: '#27272a',
            padding: { x: isSingleColumn ? 14 : 20, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        minusBtn.on('pointerdown', () => setValue(Math.max(5000, getValue() - 1000)));
        plusBtn.on('pointerdown', () => setValue(Math.min(100000, getValue() + 1000)));

        parent.add([labelText, minusBtn, plusBtn]);
    }

    private updateSalaryDisplay(): void {
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];
        if (this.salaryDisplay) {
            this.salaryDisplay.setText(`¥${this.currentSalaryMin.toLocaleString()} - ${this.currentSalaryMax.toLocaleString()}`);
        }
    }

    private createTipsCard(x: number, y: number): void {
        const L = this.layout;
        const card = this.add.container(x, y);
        card.setAlpha(0);
        card.setData('entrance', true);
        card.setData('delay', 200);

        const cardWidth = L.size(560);
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.bgCard, 0.5);
        bg.fillRoundedRect(-cardWidth / 2, -L.size(20), cardWidth, L.size(400), L.size(24));
        bg.lineStyle(2, 0xffffff, 0.04);
        bg.strokeRoundedRect(-cardWidth / 2, -L.size(20), cardWidth, L.size(400), L.size(24));

        const icon = this.add.graphics();
        icon.fillStyle(0xffcc00, 1);
        icon.fillCircle(-cardWidth / 2 + L.size(60), L.size(20), L.size(12)); // 灯泡球
        icon.fillRect(-cardWidth / 2 + L.size(54), L.size(32), L.size(12), L.size(8)); // 底座
        icon.lineStyle(2, 0xffcc00, 0.5);
        icon.beginPath(); // 光芒
        icon.moveTo(-cardWidth / 2 + L.size(60), L.size(4)); icon.lineTo(-cardWidth / 2 + L.size(60), 0);
        icon.moveTo(-cardWidth / 2 + L.size(76), L.size(12)); icon.lineTo(-cardWidth / 2 + L.size(80), L.size(8));
        icon.moveTo(-cardWidth / 2 + L.size(44), L.size(12)); icon.lineTo(-cardWidth / 2 + L.size(40), L.size(8));
        icon.strokePath();

        const title = this.add.text(-cardWidth / 2 + L.size(90), L.size(20), '简历提示', {
            fontSize: '28px',
            fontFamily: FONTS.main,
            color: '#a1a1aa',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const tips = [
            '学历越高，大型企业面试机会越多',
            '技能与职位要求匹配是筛选关键',
            '期望薪资过高会降低入面率',
            '丰富项目经验在谈薪时更有优势'
        ];

        tips.forEach((tip, i) => {
            this.add.text(x - cardWidth / 2 + L.size(40), y + L.size(90) + i * L.size(64), `• ${tip}`, {
                fontSize: '24px',
                fontFamily: FONTS.main,
                color: '#52525b'
            });
        });

        card.add([bg, icon, title]);
    }

    private createSaveButton(isSingleColumn: boolean = false): void {
        const L = this.layout;
        // 响应式按钮位置 - 单列模式下在底部
        const btnY = isSingleColumn ? L.height - L.size(100) : L.y(1340);
        const btnWidth = isSingleColumn ? Math.min(350, L.width * 0.7) : L.size(400);
        const btnHeight = isSingleColumn ? L.size(80) : L.size(96);
        
        const btn = createStyledButton(this, L.centerX, btnY, btnWidth, btnHeight, '开始求职 →', () => {
            this.saveResume();
        }, 'primary');

        btn.setAlpha(0);
        btn.setData('entrance', true);
        btn.setData('delay', 300);
    }

    private saveResume(): void {
        const L = this.layout;
        jobHuntSystem.updateResume(this.formData);

        // 成功提示
        const overlay = this.add.rectangle(L.centerX, L.centerY, L.width, L.height, 0x000000, 0.8);
        overlay.setDepth(100);

        const successBox = this.add.container(L.centerX, L.centerY);
        successBox.setDepth(101);
        successBox.setScale(0.8);
        successBox.setAlpha(0);

        const boxBg = this.add.graphics();
        boxBg.fillStyle(COLORS.bgPanel, 0.98);
        boxBg.fillRoundedRect(-L.size(320), -L.size(140), L.size(640), L.size(280), L.size(24));
        boxBg.lineStyle(2, COLORS.success, 0.3);
        boxBg.strokeRoundedRect(-L.size(320), -L.size(140), L.size(640), L.size(280), L.size(24));

        const icon = this.add.graphics();
        icon.lineStyle(8, COLORS.success, 1);
        icon.beginPath();
        icon.moveTo(-L.size(30), -L.size(10));
        icon.lineTo(-L.size(10), L.size(10));
        icon.lineTo(L.size(30), -L.size(30));
        icon.strokePath();
        icon.y = -L.size(60);

        const text = this.add.text(0, L.size(50), '简历已保存！即将开始求职...', {
            fontSize: '30px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        successBox.add([boxBg, icon, text]);

        this.tweens.add({
            targets: successBox,
            scale: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.out'
        });

        this.time.delayedCall(1500, () => {
            this.scene.start('JobHuntScene');
        });
    }

    private playEntranceAnimations(): void {
        let delay = 0;
        this.children.each((child: any) => {
            if (child.getData && child.getData('entrance')) {
                const customDelay = child.getData('delay') || 0;
                this.tweens.add({
                    targets: child,
                    alpha: 1,
                    y: child.y - 20,
                    duration: 400,
                    delay: delay + customDelay,
                    ease: 'Cubic.out'
                });
                delay += 30;
            }
        });
    }
}
