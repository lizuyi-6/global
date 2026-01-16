import Phaser from 'phaser';
import { jobHuntSystem, type PlayerResume } from '../JobHuntSystem';
import { COLORS, FONTS, applyGlassEffect, createStyledButton } from '../UIConfig';

/**
 * 简历编辑场景
 * 让玩家自定义简历信息
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
        // 背景
        this.add.rectangle(640, 360, 1280, 720, COLORS.bg);

        // 背景装饰
        const deco = this.add.graphics();
        deco.lineStyle(2, COLORS.primary, 0.1);
        for (let i = 0; i < 1280; i += 40) {
            deco.moveTo(i, 0);
            deco.lineTo(i, 720);
        }
        for (let i = 0; i < 720; i += 40) {
            deco.moveTo(0, i);
            deco.lineTo(1280, i);
        }
        deco.strokePath();

        // 标题容器
        const header = this.add.container(640, 60);
        const title = this.add.text(0, -15, '📝 个人简历配置', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitle = this.add.text(0, 25, 'CUSTOMIZE YOUR PROFESSIONAL PROFILE', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        }).setOrigin(0.5);
        header.add([title, subTitle]);

        // 主面板
        const mainPanel = this.add.rectangle(640, 380, 1100, 540, COLORS.panel, 0.7);
        applyGlassEffect(mainPanel);

        // 左列起始位置
        const leftX = 140;
        const rightX = 700;
        let leftY = 140;
        let rightY = 140;

        // ========== 左列 ==========
        // 姓名
        this.createLabel(leftX, leftY, '姓名 / NAME');
        this.createTextInput(leftX, leftY + 25, 240, '求职者', (text) => {
            this.formData.name = text;
        });
        this.formData.name = '求职者';

        // 年龄
        this.createLabel(leftX + 280, leftY, '年龄 / AGE');
        this.createTextInput(leftX + 280, leftY + 25, 100, '25', (text) => {
            this.formData.age = parseInt(text) || 25;
        });
        this.formData.age = 25;

        // 工作年限
        this.createLabel(leftX + 410, leftY, '经验 / EXP');
        this.createTextInput(leftX + 410, leftY + 25, 100, '2', (text) => {
            this.formData.experience = parseInt(text) || 0;
        });
        this.formData.experience = 2;
        leftY += 90;

        // 学历选择
        this.createLabel(leftX, leftY, '最高学历 / EDUCATION');
        this.createEducationButtons(leftX, leftY + 25);
        this.formData.education = 'bachelor';
        leftY += 90;

        // 学校
        this.createLabel(leftX, leftY, '毕业院校 / SCHOOL');
        this.createTextInput(leftX, leftY + 25, 240, '某某大学', (text) => {
            this.formData.school = text;
        });
        this.formData.school = '某某大学';

        // 专业
        this.createLabel(leftX + 280, leftY, '所学专业 / MAJOR');
        this.createTextInput(leftX + 280, leftY + 25, 230, '计算机科学', (text) => {
            this.formData.major = text;
        });
        this.formData.major = '计算机科学';
        leftY += 90;

        // 技能
        this.createLabel(leftX, leftY, '核心技能 / SKILLS (COMMA SEPARATED)');
        this.createTextInput(leftX, leftY + 25, 510, 'JavaScript, React, TypeScript, Node.js', (text) => {
            this.formData.skills = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.skills = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
        leftY += 90;

        // 项目经验
        this.createLabel(leftX, leftY, '项目经验 / PROJECTS');
        this.createTextInput(leftX, leftY + 25, 510, '电商平台, 后台管理系统, 小程序', (text) => {
            this.formData.projects = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.projects = ['电商平台', '后台管理系统', '小程序'];

        // ========== 右列 ==========
        // 期望薪资
        this.createLabel(rightX, rightY, '期望月薪 / EXPECTED SALARY');
        rightY += 35;

        // 最低薪资
        this.createLabel(rightX, rightY, '最低 / MIN');
        this.createNumberButtons(rightX + 80, rightY - 15, () => this.currentSalaryMin, (v) => {
            this.currentSalaryMin = v;
            if (this.currentSalaryMin > this.currentSalaryMax) {
                this.currentSalaryMax = this.currentSalaryMin;
            }
            this.updateSalaryDisplay();
        });
        rightY += 60;

        // 最高薪资
        this.createLabel(rightX, rightY, '最高 / MAX');
        this.createNumberButtons(rightX + 80, rightY - 15, () => this.currentSalaryMax, (v) => {
            this.currentSalaryMax = v;
            if (this.currentSalaryMax < this.currentSalaryMin) {
                this.currentSalaryMin = this.currentSalaryMax;
            }
            this.updateSalaryDisplay();
        });
        rightY += 60;

        // 薪资显示
        const salaryBg = this.add.rectangle(rightX + 250, 200, 400, 80, 0x00ff88, 0.05);
        salaryBg.setStrokeStyle(1, 0x00ff88, 0.3);

        this.salaryDisplay = this.add.text(rightX + 250, 200, '', {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.updateSalaryDisplay();
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];

        rightY += 80;

        // 提示面板
        const tipPanel = this.add.rectangle(rightX + 250, 420, 450, 180, 0xffffff, 0.03);
        tipPanel.setStrokeStyle(1, 0xffffff, 0.1);

        this.add.text(rightX + 50, 350, '💡 简历提示 / CAREER TIPS', {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: '#4a90d9',
            fontStyle: 'bold'
        });

        const tips = [
            '• 学历越高，大型企业的面试机会越多',
            '• 技能点与职位要求的匹配度是筛选的关键',
            '• 期望薪资应参考行业平均水平，过高会降低入面率',
            '• 丰富的项目经验在谈薪环节更具竞争力'
        ];
        tips.forEach((tip, i) => {
            this.add.text(rightX + 50, 385 + i * 30, tip, {
                fontSize: '13px',
                fontFamily: FONTS.main,
                color: '#888888'
            });
        });

        // 保存按钮
        this.createSaveButton();
    }

    private createLabel(x: number, y: number, text: string): void {
        this.add.text(x, y, text, {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9'
        });
    }

    private createTextInput(x: number, y: number, width: number, defaultValue: string, onChange: (text: string) => void): void {
        const height = 40;

        const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0xffffff, 0.05);
        bg.setStrokeStyle(1, 0xffffff, 0.2);

        const text = this.add.text(x + 15, y + height / 2, defaultValue, {
            fontSize: '15px',
            fontFamily: FONTS.main,
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
            bg.setStrokeStyle(1, COLORS.primary, 0.8);
            bg.setFillStyle(0xffffff, 0.1);
        });
        bg.on('pointerout', () => {
            bg.setStrokeStyle(1, 0xffffff, 0.2);
            bg.setFillStyle(0xffffff, 0.05);
        });

        bg.on('pointerdown', () => {
            // 禁用点击防止重复弹窗
            bg.disableInteractive();

            // 创建内嵌输入框
            const inputContainer = this.add.container(640, 360);
            inputContainer.setDepth(10000);

            const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
            overlay.setOrigin(0.5);
            overlay.setInteractive();  // 阻止点击穿透
            inputContainer.add(overlay);

            const inputBg = this.add.rectangle(0, 0, 500, 180, 0x1a1a2e);
            inputBg.setStrokeStyle(2, 0x4a90d9);
            inputBg.setOrigin(0.5);
            inputContainer.add(inputBg);

            const title = this.add.text(0, -50, '请输入:', {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            inputContainer.add(title);

            const inputHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <input type="text" id="textInput" value="${text.text}"
                           style="width: 400px;
                                  padding: 10px;
                                  font-size: 14px;
                                  background: #2a2a3a;
                                  color: #ffffff;
                                  border: 2px solid #4a90d9;
                                  border-radius: 4px;
                                  outline: none;
                                  box-sizing: border-box;" />
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="textSubmit"
                                style="padding: 8px 30px;
                                       font-size: 14px;
                                       background: #4a90d9;
                                       color: #ffffff;
                                       border: none;
                                       border-radius: 4px;
                                       cursor: pointer;
                                       font-weight: bold;">
                            ✅ 确定
                        </button>
                        <button id="textCancel"
                                style="padding: 8px 30px;
                                       font-size: 14px;
                                       background: #666666;
                                       color: #ffffff;
                                       border: none;
                                       border-radius: 4px;
                                       cursor: pointer;">
                            ❌ 取消
                        </button>
                    </div>
                </div>
            `;

            const domElement = this.add.dom(640, 360 + 10, 'div').createFromHTML(inputHTML);
            // 不放入 container
            // inputContainer.add(domElement);
            domElement.setDepth(10001);

            this.time.delayedCall(100, () => {
                const input = document.getElementById('textInput') as HTMLInputElement;
                const submitBtn = document.getElementById('textSubmit') as HTMLButtonElement;
                const cancelBtn = document.getElementById('textCancel') as HTMLButtonElement;

                if (input) {
                    input.focus();
                    input.select();
                    input.addEventListener('focus', () => {
                        this.input.keyboard!.enabled = false;
                    });
                    input.addEventListener('blur', () => {
                        this.input.keyboard!.enabled = true;
                    });
                }

                const handleSubmit = () => {
                    if (input) {
                        const newValue = input.value.trim();
                        if (newValue !== '') {
                            text.setText(newValue);
                            onChange(newValue);
                        }
                    }
                    inputContainer.destroy();
                    domElement.destroy(); // 销毁 DOM
                    bg.setInteractive({ useHandCursor: true });  // 恢复交互
                };

                const handleCancel = () => {
                    inputContainer.destroy();
                    domElement.destroy(); // 销毁 DOM
                    bg.setInteractive({ useHandCursor: true });  // 恢复交互
                };

                if (submitBtn) {
                    submitBtn.addEventListener('click', handleSubmit);
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', handleCancel);
                }

                if (input) {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            handleSubmit();
                        } else if (e.key === 'Escape') {
                            handleCancel();
                        }
                    });
                }
            });
        });

        onChange(defaultValue);
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
            const container = this.add.container(btnX, y);

            const bg = this.add.rectangle(45, 20, 85, 40, isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.setStrokeStyle(1, isActive ? COLORS.primary : 0xffffff, isActive ? 1 : 0.2);

            const label = this.add.text(45, 20, edu.label, {
                fontSize: '14px',
                fontFamily: FONTS.main,
                color: isActive ? '#ffffff' : '#888888'
            }).setOrigin(0.5);

            container.add([bg, label]);
            container.setData('value', edu.value);
            container.setData('bg', bg);
            container.setData('label', label);

            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => {
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
            const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
            const label = container.getData('label') as Phaser.GameObjects.Text;
            const isActive = value === this.currentEducation;

            bg.setFillStyle(isActive ? COLORS.primary : 0xffffff, isActive ? 0.3 : 0.05);
            bg.setStrokeStyle(1, isActive ? COLORS.primary : 0xffffff, isActive ? 1 : 0.2);
            label.setColor(isActive ? '#ffffff' : '#888888');
        });
    }

    private createNumberButtons(x: number, y: number, getValue: () => number, setValue: (v: number) => void): void {
        const minusBtn = this.add.text(x, y + 20, '−', {
            fontSize: '24px',
            fontFamily: FONTS.mono,
            color: '#ffffff',
            backgroundColor: '#ffffff11',
            padding: { x: 12, y: 4 }
        }).setOrigin(0.5);
        minusBtn.setInteractive({ useHandCursor: true });
        minusBtn.on('pointerdown', () => {
            const newVal = Math.max(5000, getValue() - 1000);
            setValue(newVal);
        });

        const valueText = this.add.text(x + 100, y + 20, '', {
            fontSize: '18px',
            fontFamily: FONTS.mono,
            color: '#ffffff'
        }).setOrigin(0.5);

        const plusBtn = this.add.text(x + 200, y + 20, '+', {
            fontSize: '24px',
            fontFamily: FONTS.mono,
            color: '#ffffff',
            backgroundColor: '#ffffff11',
            padding: { x: 12, y: 4 }
        }).setOrigin(0.5);
        plusBtn.setInteractive({ useHandCursor: true });
        plusBtn.on('pointerdown', () => {
            const newVal = Math.min(100000, getValue() + 1000);
            setValue(newVal);
        });

        // 更新显示的函数
        const updateDisplay = () => {
            valueText.setText(`¥${getValue().toLocaleString()}`);
        };

        // 初始显示
        this.time.addEvent({
            delay: 10,
            callback: updateDisplay,
            loop: true
        });
    }

    private updateSalaryDisplay(): void {
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];
        if (this.salaryDisplay) {
            this.salaryDisplay.setText(`¥${this.currentSalaryMin.toLocaleString()} - ¥${this.currentSalaryMax.toLocaleString()}`);
        }
    }

    private createSaveButton(): void {
        const btn = createStyledButton(this, 640, 680, 280, 50, '保存并开始求职', () => {
            this.saveResume();
        });
    }

    private saveResume(): void {
        // 更新求职系统的简历
        jobHuntSystem.updateResume(this.formData);

        // 显示成功提示
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setDepth(100);

        const successBox = this.add.rectangle(640, 360, 400, 180, 0x2a3a2a);
        successBox.setStrokeStyle(2, 0x00ff88);
        successBox.setDepth(101);

        const successText = this.add.text(640, 330, '✅ 简历已保存！', {
            fontSize: '24px',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(102);

        const tipText = this.add.text(640, 380, '即将开始你的求职之旅...', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(102);

        // 延迟跳转到求职场景
        this.time.delayedCall(1500, () => {
            this.scene.start('JobHuntScene');
        });
    }
}
