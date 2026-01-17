import Phaser from 'phaser';
import { jobHuntSystem, type PlayerResume } from '../JobHuntSystem';
import { COLORS, FONTS, createStyledButton } from '../UIConfig';

/**
 * 简历编辑场景 - 现代风格
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
        this.add.rectangle(640, 360, 1280, 720, COLORS.bg);

        // 网格背景
        this.createGridBackground();

        // 渐变光晕 - 更柔和
        const topGlow = this.add.graphics();
        topGlow.fillStyle(COLORS.primary, 0.06);
        topGlow.fillCircle(350, -80, 350);
        topGlow.fillStyle(COLORS.secondary, 0.04);
        topGlow.fillCircle(950, 80, 280);

        const bottomGlow = this.add.graphics();
        bottomGlow.fillStyle(COLORS.accent, 0.04);
        bottomGlow.fillCircle(180, 750, 300);

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
        const gridSize = 40;
        graphics.lineStyle(1, 0xffffff, 0.02);

        for (let x = 0; x <= 1280; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 720);
        }
        for (let y = 0; y <= 720; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(1280, y);
        }
        graphics.strokePath();
    }

    private createFloatingOrbs(): void {
        const orbs = [
            { x: 80, y: 180, size: 50, color: COLORS.primary, alpha: 0.03 },
            { x: 1200, y: 130, size: 70, color: COLORS.secondary, alpha: 0.025 },
            { x: 120, y: 520, size: 45, color: COLORS.accent, alpha: 0.035 },
            { x: 1150, y: 480, size: 60, color: COLORS.primary, alpha: 0.025 }
        ];

        orbs.forEach((orb, i) => {
            const circle = this.add.circle(orb.x, orb.y, orb.size, orb.color, orb.alpha);
            this.tweens.add({
                targets: circle,
                x: orb.x + Phaser.Math.Between(-20, 20),
                y: orb.y + Phaser.Math.Between(-15, 15),
                duration: 4000 + i * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    private createHeader(): void {
        const header = this.add.container(640, 55);
        header.setAlpha(0);
        header.setData('entrance', true);

        // 小标签
        const tagBg = this.add.graphics();
        tagBg.fillStyle(0xffffff, 0.06);
        tagBg.fillRoundedRect(-60, -25, 120, 24, 12);

        const tagText = this.add.text(0, -13, '个人档案', {
            fontSize: '11px',
            fontFamily: FONTS.main,
            color: '#a1a1aa'
        }).setOrigin(0.5);

        // 主标题
        const title = this.add.text(0, 20, '简历配置', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        header.add([tagBg, tagText, title]);
    }

    private createFormContent(): void {
        // 左右两列布局 - Move apart to avoid overlapping center modal
        const leftX = 280; // Moved left (was 350)
        const rightX = 1000; // Moved right (was 930)
        let leftY = 140;
        let rightY = 140;

        // ========== 左列 ==========
        // 姓名
        this.createFormField(leftX, leftY, '姓名', '求职者', 220, (text) => {
            this.formData.name = text;
        });
        this.formData.name = '求职者';

        // 年龄
        this.createFormField(leftX + 260, leftY, '年龄', '25', 80, (text) => {
            this.formData.age = parseInt(text) || 25;
        });
        this.formData.age = 25;
        leftY += 85;

        // 学历选择
        this.createLabel(leftX - 130, leftY, '最高学历');
        this.createEducationButtons(leftX - 130, leftY + 30);
        this.formData.education = 'bachelor';
        leftY += 95;

        // 学校
        this.createFormField(leftX, leftY, '毕业院校', '某某大学', 220, (text) => {
            this.formData.school = text;
        });
        this.formData.school = '某某大学';

        // 专业
        this.createFormField(leftX + 260, leftY, '专业', '计算机科学', 180, (text) => {
            this.formData.major = text;
        });
        this.formData.major = '计算机科学';
        leftY += 85;

        // 工作年限
        this.createFormField(leftX, leftY, '工作经验', '2 年', 100, (text) => {
            this.formData.experience = parseInt(text) || 0;
        });
        this.formData.experience = 2;
        leftY += 85;

        // 技能
        this.createFormField(leftX, leftY, '核心技能', 'JavaScript, React, TypeScript, Node.js', 440, (text) => {
            this.formData.skills = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.skills = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
        leftY += 85;

        // 项目经验
        this.createFormField(leftX, leftY, '项目经验', '电商平台, 后台管理系统, 小程序', 440, (text) => {
            this.formData.projects = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.projects = ['电商平台', '后台管理系统', '小程序'];

        // ========== 右列 ==========
        // 期望薪资面板
        this.createSalaryPanel(rightX, rightY);
        rightY += 200;

        // 提示卡片
        this.createTipsCard(rightX, rightY);

        // 保存按钮
        this.createSaveButton();
    }

    private createLabel(x: number, y: number, text: string): void {
        this.add.text(x, y, text, {
            fontSize: '13px',
            fontFamily: FONTS.main,
            color: '#71717a'
        });
    }

    private createFormField(x: number, y: number, label: string, defaultValue: string, width: number, onChange: (text: string) => void): void {
        const container = this.add.container(x, y);
        container.setAlpha(0);
        container.setData('entrance', true);
        container.setData('delay', 100);

        // 标签
        const labelText = this.add.text(-width / 2, 0, label, {
            fontSize: '13px',
            fontFamily: FONTS.main,
            color: '#71717a'
        });

        // 输入框背景 - 更深的背景
        const inputBg = this.add.graphics();
        inputBg.fillStyle(COLORS.bgPanel, 0.9);
        inputBg.fillRoundedRect(-width / 2, 10, width, 44, 8);
        inputBg.lineStyle(1, 0xffffff, 0.05);
        inputBg.strokeRoundedRect(-width / 2, 10, width, 44, 8);

        // 交互区域
        const hitArea = this.add.rectangle(0, 32, width, 44, 0x000000, 0);

        // 输入值
        const valueText = this.add.text(-width / 2 + 15, 32, defaultValue, {
            fontSize: '15px',
            fontFamily: FONTS.main,
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        container.add([labelText, inputBg, valueText, hitArea]);

        // 交互
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerover', () => {
            inputBg.clear();
            inputBg.fillStyle(COLORS.bgPanel, 1);
            inputBg.fillRoundedRect(-width / 2, 10, width, 44, 8);
            inputBg.lineStyle(1, COLORS.primary, 0.4);
            inputBg.strokeRoundedRect(-width / 2, 10, width, 44, 8);
        });
        hitArea.on('pointerout', () => {
            inputBg.clear();
            inputBg.fillStyle(COLORS.bgPanel, 0.9);
            inputBg.fillRoundedRect(-width / 2, 10, width, 44, 8);
            inputBg.lineStyle(1, 0xffffff, 0.05);
            inputBg.strokeRoundedRect(-width / 2, 10, width, 44, 8);
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
        // Darker overlay to clearly separate modal
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);
        overlay.setDepth(1000);
        overlay.setInteractive();

        const dialog = this.add.container(640, 360);
        dialog.setDepth(1001);

        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(COLORS.bgPanel, 0.98);
        dialogBg.fillRoundedRect(-210, -90, 420, 180, 12);
        dialogBg.lineStyle(1, 0xffffff, 0.08);
        dialogBg.strokeRoundedRect(-210, -90, 420, 180, 12);

        const dialogTitle = this.add.text(0, -55, `编辑${title}`, {
            fontSize: '18px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        dialog.add([dialogBg, dialogTitle]);

        // HTML 输入框 - 使用 Flexbox 全屏居中，避免 Canvas 坐标偏移
        const inputHTML = `
            <div style="width: 1280px; height: 720px; display: flex; justify-content: center; align-items: center; pointer-events: none;">
                <div style="pointer-events: auto; display: flex; flex-direction: column; gap: 12px; margin-top: 50px;">
                    <input type="text" id="dialogInput" value="${currentValue}"
                           style="width: 340px; padding: 12px 16px; font-size: 15px;
                                  background: #0d0d12; color: #ffffff;
                                  border: 1px solid rgba(255,255,255,0.15);
                                  border-radius: 8px; outline: none;
                                  font-family: -apple-system, sans-serif;" />
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button id="dialogSubmit" style="padding: 10px 32px; font-size: 15px;
                                background: #6366f1; color: #ffffff;
                                border: none; border-radius: 8px; cursor: pointer;
                                font-weight: 500;">确定</button>
                        <button id="dialogCancel" style="padding: 10px 32px; font-size: 15px;
                                background: #27272a; color: #a1a1aa;
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 8px; cursor: pointer;">取消</button>
                    </div>
                </div>
            </div>
        `;

        // Place DOM at 0,0 with origin 0,0 to cover entire screen, letting CSS handle centering
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
            const container = this.add.container(btnX + 40, y);
            container.setAlpha(0);
            container.setData('entrance', true);

            const bg = this.add.graphics();
            if (isActive) {
                bg.fillStyle(COLORS.primary, 1);
            } else {
                bg.fillStyle(COLORS.bgPanel, 0.8);
            }
            bg.fillRoundedRect(-37.5, -18, 75, 36, 8);
            bg.lineStyle(1, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.strokeRoundedRect(-37.5, -18, 75, 36, 8);

            const hitAreaEdu = this.add.rectangle(0, 0, 75, 36, 0x000000, 0);

            const label = this.add.text(0, 0, edu.label, {
                fontSize: '13px',
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
            btnX += 85;
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
            bg.fillRoundedRect(-37.5, -18, 75, 36, 8);
            bg.lineStyle(1, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.strokeRoundedRect(-37.5, -18, 75, 36, 8);
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
        bg.fillRoundedRect(-140, -20, 280, 180, 12);
        bg.lineStyle(1, 0xffffff, 0.05);
        bg.strokeRoundedRect(-140, -20, 280, 180, 12);

        // 标题
        const title = this.add.text(0, 0, '期望薪资', {
            fontSize: '16px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 薪资显示
        this.salaryDisplay = this.add.text(0, 55, '', {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: '#10b981',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.updateSalaryDisplay();

        // 最低薪资调节
        this.createSalaryControl(panel, -80, 100, '最低', () => this.currentSalaryMin, (v) => {
            this.currentSalaryMin = v;
            if (this.currentSalaryMin > this.currentSalaryMax) {
                this.currentSalaryMax = this.currentSalaryMin;
            }
            this.updateSalaryDisplay();
        });

        // 最高薪资调节
        this.createSalaryControl(panel, 80, 100, '最高', () => this.currentSalaryMax, (v) => {
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
        const labelText = this.add.text(x, y - 15, label, {
            fontSize: '11px',
            fontFamily: FONTS.main,
            color: '#52525b'
        }).setOrigin(0.5);

        const minusBtn = this.add.text(x - 35, y + 10, '−', {
            fontSize: '20px',
            fontFamily: FONTS.mono,
            color: '#a1a1aa',
            backgroundColor: '#27272a',
            padding: { x: 10, y: 2 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const plusBtn = this.add.text(x + 35, y + 10, '+', {
            fontSize: '20px',
            fontFamily: FONTS.mono,
            color: '#a1a1aa',
            backgroundColor: '#27272a',
            padding: { x: 10, y: 2 }
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
        bg.fillRoundedRect(-140, -10, 280, 200, 12);
        bg.lineStyle(1, 0xffffff, 0.04);
        bg.strokeRoundedRect(-140, -10, 280, 200, 12);

        const icon = this.add.text(-120, 10, '💡', { fontSize: '18px' });

        const title = this.add.text(-95, 10, '简历提示', {
            fontSize: '14px',
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
            this.add.text(x - 120, y + 45 + i * 32, `• ${tip}`, {
                fontSize: '12px',
                fontFamily: FONTS.main,
                color: '#52525b'
            });
        });

        card.add([bg, icon, title]);
    }

    private createSaveButton(): void {
        const btn = createStyledButton(this, 640, 670, 200, 48, '开始求职 →', () => {
            this.saveResume();
        }, 'primary');
        btn.setAlpha(0);
        btn.setData('entrance', true);
        btn.setData('delay', 300);
    }

    private saveResume(): void {
        jobHuntSystem.updateResume(this.formData);

        // 成功提示
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);
        overlay.setDepth(100);

        const successBox = this.add.container(640, 360);
        successBox.setDepth(101);
        successBox.setScale(0.8);
        successBox.setAlpha(0);

        const boxBg = this.add.graphics();
        boxBg.fillStyle(COLORS.bgPanel, 0.98);
        boxBg.fillRoundedRect(-160, -70, 320, 140, 12);
        boxBg.lineStyle(1, COLORS.success, 0.3);
        boxBg.strokeRoundedRect(-160, -70, 320, 140, 12);

        const icon = this.add.text(0, -30, '✓', {
            fontSize: '36px',
            color: '#10b981'
        }).setOrigin(0.5);

        const text = this.add.text(0, 25, '简历已保存！即将开始求职...', {
            fontSize: '15px',
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
                    y: child.y - 10,
                    duration: 400,
                    delay: delay + customDelay,
                    ease: 'Cubic.out'
                });
                delay += 30;
            }
        });
    }
}
