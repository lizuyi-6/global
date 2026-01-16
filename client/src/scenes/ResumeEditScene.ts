import Phaser from 'phaser';
import { jobHuntSystem, type PlayerResume } from '../JobHuntSystem';

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
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // 标题
        this.add.text(640, 40, '📝 创建你的简历', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 75, '自定义你的求职信息，这将影响面试成功率', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        // 左列起始位置
        const leftX = 100;
        const rightX = 680;
        let leftY = 120;
        let rightY = 120;

        // ========== 左列 ==========

        // 姓名
        this.createLabel(leftX, leftY, '姓名');
        this.createTextInput(leftX + 80, leftY, 180, '求职者', (text) => {
            this.formData.name = text;
        });
        this.formData.name = '求职者';
        leftY += 50;

        // 年龄
        this.createLabel(leftX, leftY, '年龄');
        this.createTextInput(leftX + 80, leftY, 80, '25', (text) => {
            this.formData.age = parseInt(text) || 25;
        });
        this.formData.age = 25;

        // 工作年限
        this.createLabel(leftX + 200, leftY, '工作年限');
        this.createTextInput(leftX + 300, leftY, 80, '2', (text) => {
            this.formData.experience = parseInt(text) || 0;
        });
        this.formData.experience = 2;
        leftY += 60;

        // 学历选择
        this.createLabel(leftX, leftY, '学历');
        this.createEducationButtons(leftX + 80, leftY);
        this.formData.education = 'bachelor';
        leftY += 50;

        // 学校
        this.createLabel(leftX, leftY, '学校');
        this.createTextInput(leftX + 80, leftY, 200, '某某大学', (text) => {
            this.formData.school = text;
        });
        this.formData.school = '某某大学';
        leftY += 50;

        // 专业
        this.createLabel(leftX, leftY, '专业');
        this.createTextInput(leftX + 80, leftY, 200, '计算机科学', (text) => {
            this.formData.major = text;
        });
        this.formData.major = '计算机科学';
        leftY += 70;

        // 技能
        this.createLabel(leftX, leftY, '技能');
        this.add.text(leftX + 80, leftY, '(逗号分隔)', {
            fontSize: '12px',
            color: '#666666'
        });
        leftY += 25;
        this.createTextInput(leftX, leftY, 480, 'JavaScript, React, TypeScript, Node.js', (text) => {
            this.formData.skills = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.skills = ['JavaScript', 'React', 'TypeScript', 'Node.js'];
        leftY += 60;

        // 项目经验
        this.createLabel(leftX, leftY, '项目经验');
        this.add.text(leftX + 100, leftY, '(逗号分隔)', {
            fontSize: '12px',
            color: '#666666'
        });
        leftY += 25;
        this.createTextInput(leftX, leftY, 480, '电商平台, 后台管理系统, 小程序', (text) => {
            this.formData.projects = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.projects = ['电商平台', '后台管理系统', '小程序'];

        // ========== 右列 ==========

        // 期望薪资
        this.createLabel(rightX, rightY, '期望月薪');
        rightY += 35;

        // 最低薪资
        this.createLabel(rightX, rightY, '最低');
        this.createNumberButtons(rightX + 60, rightY, () => this.currentSalaryMin, (v) => {
            this.currentSalaryMin = v;
            if (this.currentSalaryMin > this.currentSalaryMax) {
                this.currentSalaryMax = this.currentSalaryMin;
            }
            this.updateSalaryDisplay();
        });
        rightY += 50;

        // 最高薪资
        this.createLabel(rightX, rightY, '最高');
        this.createNumberButtons(rightX + 60, rightY, () => this.currentSalaryMax, (v) => {
            this.currentSalaryMax = v;
            if (this.currentSalaryMax < this.currentSalaryMin) {
                this.currentSalaryMin = this.currentSalaryMax;
            }
            this.updateSalaryDisplay();
        });
        rightY += 50;

        // 薪资显示
        this.salaryDisplay = this.add.text(rightX, rightY, '', {
            fontSize: '20px',
            color: '#00ff88',
            fontStyle: 'bold'
        });
        this.updateSalaryDisplay();
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];

        rightY += 80;

        // 提示信息
        this.add.text(rightX, rightY, '💡 提示:', {
            fontSize: '14px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        rightY += 25;

        const tips = [
            '• 学历越高，大厂面试通过率越高',
            '• 技能匹配职位要求可提高成功率',
            '• 期望薪资过高可能导致被拒',
            '• 项目经验丰富有助于谈判加薪'
        ];
        tips.forEach(tip => {
            this.add.text(rightX, rightY, tip, {
                fontSize: '12px',
                color: '#888888'
            });
            rightY += 22;
        });

        // 保存按钮
        this.createSaveButton();
    }

    private createLabel(x: number, y: number, text: string): void {
        this.add.text(x, y, text + ':', {
            fontSize: '16px',
            color: '#ffffff'
        });
    }

    private createTextInput(x: number, y: number, width: number, defaultValue: string, onChange: (text: string) => void): void {
        const height = 32;

        const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x2a2a3a);
        bg.setStrokeStyle(1, 0x4a4a5a);

        const text = this.add.text(x + 10, y + height / 2, defaultValue, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => bg.setStrokeStyle(2, 0x4a90d9));
        bg.on('pointerout', () => bg.setStrokeStyle(1, 0x4a4a5a));

        bg.on('pointerdown', () => {
            // 创建内嵌输入框
            const inputContainer = this.add.container(640, 360);
            inputContainer.setDepth(10000);

            const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
            overlay.setOrigin(0.5);
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
                                  outline: none;" />
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

            const domElement = this.add.dom(0, 10, 'div').createFromHTML(inputHTML);
            inputContainer.add(domElement);

            this.time.delayedCall(100, () => {
                const input = document.getElementById('textInput') as HTMLInputElement;
                const submitBtn = document.getElementById('textSubmit') as HTMLButtonElement;
                const cancelBtn = document.getElementById('textCancel') as HTMLButtonElement;

                if (input) {
                    input.focus();
                    input.select();
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
                };

                const handleCancel = () => {
                    inputContainer.destroy();
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

            const bg = this.add.rectangle(40, 16, 75, 32, isActive ? 0x4a90d9 : 0x3a3a4a);
            bg.setStrokeStyle(1, isActive ? 0x6ab0f9 : 0x4a4a5a);

            const label = this.add.text(40, 16, edu.label, {
                fontSize: '14px',
                color: isActive ? '#ffffff' : '#aaaaaa'
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

            bg.setFillStyle(isActive ? 0x4a90d9 : 0x3a3a4a);
            bg.setStrokeStyle(1, isActive ? 0x6ab0f9 : 0x4a4a5a);
            label.setColor(isActive ? '#ffffff' : '#aaaaaa');
        });
    }

    private createNumberButtons(x: number, y: number, getValue: () => number, setValue: (v: number) => void): void {
        const minusBtn = this.add.text(x, y + 16, '−', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#3a3a4a',
            padding: { x: 10, y: 2 }
        }).setOrigin(0.5);
        minusBtn.setInteractive({ useHandCursor: true });
        minusBtn.on('pointerdown', () => {
            const newVal = Math.max(5000, getValue() - 1000);
            setValue(newVal);
        });

        const valueText = this.add.text(x + 90, y + 16, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const plusBtn = this.add.text(x + 180, y + 16, '+', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#3a3a4a',
            padding: { x: 10, y: 2 }
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
        const btn = this.add.container(640, 660);

        const bg = this.add.rectangle(0, 0, 220, 50, 0x4a90d9);
        bg.setStrokeStyle(2, 0x6ab0f9);

        const text = this.add.text(0, 0, '✅ 保存并开始求职', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
            bg.setFillStyle(0x5aa0e9);
            this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x4a90d9);
            this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
        });

        bg.on('pointerdown', () => {
            text.setText('保存中...');
            bg.setFillStyle(0x3a80c9);

            this.time.delayedCall(500, () => {
                this.saveResume();
            });
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
