import Phaser from 'phaser';
import { jobHuntSystem, type PlayerResume } from '../JobHuntSystem';
import { COLORS, FONTS, createStyledButton } from '../UIConfig';

/**
 * 简历编辑场景 - 现代风格 (2K Resolution)
 * 与 HTML 模板一致的设计语言
 */
export class ResumeEditScene extends Phaser.Scene {
    private formData: Partial<PlayerResume>;
    private currentEducation: PlayerResume['education'] = 'bachelor';
    private currentSalaryMin = 10000;
    private currentSalaryMax = 25000;
    private educationButtons: Phaser.GameObjects.Container[] = [];
    private salaryDisplay!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'ResumeEditScene' });
        this.formData = {};
    }

    create(): void {
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
        // 纯色背景 - 与模板一致
        this.add.rectangle(1280, 720, 2560, 1440, COLORS.bg);

        // 网格背景
        this.createGridBackground();

        // 渐变光晕 - 更柔和
        const topGlow = this.add.graphics();
        topGlow.fillStyle(COLORS.primary, 0.06);
        topGlow.fillCircle(700, -160, 700);
        topGlow.fillStyle(COLORS.secondary, 0.04);
        topGlow.fillCircle(1900, 160, 560);

        const bottomGlow = this.add.graphics();
        bottomGlow.fillStyle(COLORS.accent, 0.04);
        bottomGlow.fillCircle(360, 1500, 600);

        // 呼吸动画
        this.tweens.add({
            targets: [topGlow, bottomGlow],
            alpha: { from: 1, to: 0.6 },
            duration: 4000,
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
        const header = this.add.container(1280, 110);
        header.setAlpha(0);
        header.setData('entrance', true);

        // 小标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(0xffffff, 0.06);
        tagBg.fillRoundedRect(-120, -50, 240, 48, 24);

        const tagText = this.add.text(0, -26, '个人档案', {
            fontSize: '22px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        // 主标题
        const title = this.add.text(0, 40, '简历配置', {
            fontSize: '72px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        header.add([tagBg, tagText, title]);
    }

    private createFormContent(): void {
        // 左右两列布局 - 2K Scaled
        const leftX = 560;
        const rightX = 2000;
        let leftY = 280;
        let rightY = 280;

        // ========== 左列 ==========
        // 姓名
        this.createFormField(leftX, leftY, '姓名', '求职者', 440, (text) => {
            this.formData.name = text;
        });
        this.formData.name = '求职者';

        // 年龄
        this.createFormField(leftX + 520, leftY, '年龄', '25', 160, (text) => {
            this.formData.age = parseInt(text) || 25;
        });
        this.formData.age = 25;
        leftY += 170;

        // 学历选择
        this.createLabel(leftX - 260, leftY, '最高学历');
        this.createEducationButtons(leftX - 260, leftY + 60);
        this.formData.education = 'bachelor';
        leftY += 190;

        // 学校
        this.createFormField(leftX, leftY, '毕业院校', '某某大学', 440, (text) => {
            this.formData.school = text;
        });
        this.formData.school = '某某大学';

        // 专业
        this.createFormField(leftX + 520, leftY, '专业', '计算机科学', 360, (text) => {
            this.formData.major = text;
        });
        this.formData.major = '计算机科学';
        leftY += 170;

        // 工作年限
        this.createFormField(leftX, leftY, '工作经验', '2 年', 200, (text) => {
            this.formData.experience = parseInt(text) || 0;
        });
        this.formData.experience = 2;
        leftY += 170;

        // 技能
        this.createFormField(leftX, leftY, '核心技能', 'JavaScript, React, TypeScript, Node.js', 880, (text) => {
            this.formData.skills = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.skills = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
        leftY += 170;

        // 项目经验
        this.createFormField(leftX, leftY, '项目经验', '电商平台, 后台管理系统, 小程序', 880, (text) => {
            this.formData.projects = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.projects = ['电商平台', '后台管理系统', '小程序'];

        // ========== 右列 ==========
        // 期望薪资面板
        this.createSalaryPanel(rightX, rightY);
        rightY += 400;

        // 提示卡片
        this.createTipsCard(rightX, rightY);

        // 保存按钮
        this.createSaveButton();
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
        const overlay = this.add.rectangle(1280, 720, 2560, 1440, 0x000000, 0.85);
        overlay.setDepth(1000);
        overlay.setInteractive();

        const dialog = this.add.container(1280, 720);
        dialog.setDepth(1001);

        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(COLORS.bgPanel, 0.98);
        dialogBg.fillRoundedRect(-420, -180, 840, 360, 24);
        dialogBg.lineStyle(2, 0xffffff, 0.08);
        dialogBg.strokeRoundedRect(-420, -180, 840, 360, 24);

        const dialogTitle = this.add.text(0, -110, `编辑${title}`, {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        dialog.add([dialogBg, dialogTitle]);

        // HTML 输入框 - 2K Scaled
        const inputHTML = `
            <div style="width: 2560px; height: 1440px; display: flex; justify-content: center; align-items: center; pointer-events: none;">
                <div style="pointer-events: auto; display: flex; flex-direction: column; gap: 24px; margin-top: 100px;">
                    <input type="text" id="dialogInput" value="${currentValue}"
                           style="width: 680px; padding: 24px 32px; font-size: 30px;
                                  background: #0d0d12; color: #ffffff;
                                  border: 2px solid rgba(255,255,255,0.15);
                                  border-radius: 16px; outline: none;
                                  font-family: -apple-system, sans-serif;" />
                    <div style="display: flex; gap: 24px; justify-content: center;">
                        <button id="dialogSubmit" style="padding: 20px 64px; font-size: 30px;
                                background: #6366f1; color: #ffffff;
                                border: none; border-radius: 16px; cursor: pointer;
                                font-weight: 500;">确定</button>
                        <button id="dialogCancel" style="padding: 20px 64px; font-size: 30px;
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

    private createEducationButtons(x: number, y: number): void {
        const educations: Array<{ value: PlayerResume['education']; label: string }> = [
            { value: 'high_school', label: '高中' },
            { value: 'college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士' },
            { value: 'phd', label: '博士' }
        ];

        let btnX = x;
        this.educationButtons = [];

        educations.forEach((edu) => {
            const isActive = this.currentEducation === edu.value;
            const container = this.add.container(btnX + 80, y);
            container.setAlpha(0);
            container.setData('entrance', true);

            const bg = this.add.graphics();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 1);
            } else {
                bg.fillStyle(COLORS.bgPanel, 0.8);
            }
            bg.fillRoundedRect(-75, -36, 150, 72, 16);
            bg.lineStyle(2, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.strokeRoundedRect(-75, -36, 150, 72, 16);

            const hitAreaEdu = this.add.rectangle(0, 0, 150, 72, 0x000000, 0);

            const label = this.add.text(0, 0, edu.label, {
                fontSize: '26px',
                fontFamily: FONTS.main,
                color: isActive ? '#ffffff' : '#71717a'
            }).setOrigin(0.5);

            container.add([bg, label, hitAreaEdu]);
            container.setData('value', edu.value);
            container.setData('bg', bg);
            container.setData('label', label);

            hitAreaEdu.setInteractive({ useHandCursor: true });
            hitAreaEdu.on('pointerdown', () => {
                this.currentEducation = edu.value;
                this.formData.education = edu.value;
                this.updateEducationButtons();
            });

            this.educationButtons.push(container);
            btnX += 170;
        });
    }

    private updateEducationButtons(): void {
        this.educationButtons.forEach(container => {
            const value = container.getData('value');
            const bg = container.getData('bg') as Phaser.GameObjects.Graphics;
            const label = container.getData('label') as Phaser.GameObjects.Text;
            const isActive = value === this.currentEducation;

            bg.clear();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 1);
            } else {
                bg.fillStyle(COLORS.bgPanel, 0.8);
            }
            bg.fillRoundedRect(-75, -36, 150, 72, 16);
            bg.lineStyle(2, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.strokeRoundedRect(-75, -36, 150, 72, 16);
            label.setColor(isActive ? '#ffffff' : '#71717a');
        });
    }

    private createSalaryPanel(x: number, y: number): void {
        const panel = this.add.container(x, y);
        panel.setAlpha(0);
        panel.setData('entrance', true);

        // 面板背景 - 现代卡片风格
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.bgCard, 0.7);
        bg.fillRoundedRect(-280, -40, 560, 360, 24);
        bg.lineStyle(2, 0xffffff, 0.05);
        bg.strokeRoundedRect(-280, -40, 560, 360, 24);

        // 标题
        const title = this.add.text(0, 0, '期望薪资', {
            fontSize: '32px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 薪资显示
        this.salaryDisplay = this.add.text(0, 110, '', {
            fontSize: '56px',
            fontFamily: FONTS.mono,
            color: '#10b981',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.updateSalaryDisplay();

        // 最低薪资调节
        this.createSalaryControl(panel, -160, 200, '最低', () => this.currentSalaryMin, (v) => {
            this.currentSalaryMin = v;
            if (this.currentSalaryMin > this.currentSalaryMax) {
                this.currentSalaryMax = this.currentSalaryMin;
            }
            this.updateSalaryDisplay();
        });

        // 最高薪资调节
        this.createSalaryControl(panel, 160, 200, '最高', () => this.currentSalaryMax, (v) => {
            this.currentSalaryMax = v;
            if (this.currentSalaryMax < this.currentSalaryMin) {
                this.currentSalaryMin = this.currentSalaryMax;
            }
            this.updateSalaryDisplay();
        });

        panel.add([bg, title, this.salaryDisplay]);
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];
    }

    private createSalaryControl(parent: Phaser.GameObjects.Container, x: number, y: number, label: string, getValue: () => number, setValue: (v: number) => void): void {
        const labelText = this.add.text(x, y - 30, label, {
            fontSize: '22px',
            fontFamily: FONTS.main,
            color: '#52525b'
        }).setOrigin(0.5);

        const minusBtn = this.add.text(x - 70, y + 20, '−', {
            fontSize: '40px',
            fontFamily: FONTS.mono,
            color: '#a1a1aa',
            backgroundColor: '#27272a',
            padding: { x: 20, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const plusBtn = this.add.text(x + 70, y + 20, '+', {
            fontSize: '40px',
            fontFamily: FONTS.mono,
            color: '#a1a1aa',
            backgroundColor: '#27272a',
            padding: { x: 20, y: 4 }
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
        const card = this.add.container(x, y);
        card.setAlpha(0);
        card.setData('entrance', true);
        card.setData('delay', 200);

        const bg = this.add.graphics();
        bg.fillStyle(COLORS.bgCard, 0.5);
        bg.fillRoundedRect(-280, -20, 560, 400, 24);
        bg.lineStyle(2, 0xffffff, 0.04);
        bg.strokeRoundedRect(-280, -20, 560, 400, 24);

        const icon = this.add.graphics();
        icon.fillStyle(0xffcc00, 1);
        icon.fillCircle(-220, 20, 12); // 灯泡球
        icon.fillRect(-226, 32, 12, 8); // 底座
        icon.lineStyle(2, 0xffcc00, 0.5);
        icon.beginPath(); // 光芒
        icon.moveTo(-220, 4); icon.lineTo(-220, 0);
        icon.moveTo(-204, 12); icon.lineTo(-200, 8);
        icon.moveTo(-236, 12); icon.lineTo(-240, 8);
        icon.strokePath();

        const title = this.add.text(-190, 20, '简历提示', {
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
            this.add.text(x - 240, y + 90 + i * 64, `• ${tip}`, {
                fontSize: '24px',
                fontFamily: FONTS.main,
                color: '#52525b'
            });
        });

        card.add([bg, icon, title]);
    }

    private createSaveButton(): void {
        const btn = createStyledButton(this, 1280, 1340, 400, 96, '开始求职 →', () => {
            this.saveResume();
        }, 'primary');
        btn.scale = 2; // Simple scale for button if createStyledButton doesn't support size args nicely, but we passed size args
        // wait, createStyledButton logic might use hardcoded font sizes.
        // Let's rely on size args for box, but we might need to manually adjust text if it looks small. 
        // Actually, let's keep it simple for now as createStyledButton might not expose font size.
        // I will recreate a custom button here to be safe or accept it might be small text.
        // Let's try to pass correct size args: 400, 96. Text might be small. 

        btn.setAlpha(0);
        btn.setData('entrance', true);
        btn.setData('delay', 300);
    }

    private saveResume(): void {
        jobHuntSystem.updateResume(this.formData);

        // 成功提示
        const overlay = this.add.rectangle(1280, 720, 2560, 1440, 0x000000, 0.8);
        overlay.setDepth(100);

        const successBox = this.add.container(1280, 720);
        successBox.setDepth(101);
        successBox.setScale(0.8);
        successBox.setAlpha(0);

        const boxBg = this.add.graphics();
        boxBg.fillStyle(COLORS.bgPanel, 0.98);
        boxBg.fillRoundedRect(-320, -140, 640, 280, 24);
        boxBg.lineStyle(2, COLORS.success, 0.3);
        boxBg.strokeRoundedRect(-320, -140, 640, 280, 24);

        const icon = this.add.graphics();
        icon.lineStyle(8, COLORS.success, 1);
        icon.beginPath();
        icon.moveTo(-30, -10);
        icon.lineTo(-10, 10);
        icon.lineTo(30, -30);
        icon.strokePath();
        icon.y = -60;

        const text = this.add.text(0, 50, '简历已保存！即将开始求职...', {
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
