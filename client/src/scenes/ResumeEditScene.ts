import Phaser from 'phaser';
import { jobHuntSystem, type PlayerResume } from '../JobHuntSystem';

/**
 * 简历编辑场景
 * 让玩家自定义简历信息
 */
export class ResumeEditScene extends Phaser.Scene {
    private formData: Partial<PlayerResume>;
    private skillInputs: Phaser.GameObjects.Text[] = [];
    private projectInputs: Phaser.GameObjects.Text[] = [];
    private currentEducation: PlayerResume['education'] = 'bachelor';
    private currentSalaryMin = 10000;
    private currentSalaryMax = 25000;
    private educationButtons: any[] = [];  // 保存学历按钮引用

    constructor() {
        super({ key: 'ResumeEditScene' });
        this.formData = {};
    }

    create(): void {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // 标题
        this.add.text(640, 50, '📝 创建你的简历', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 90, '自定义你的求职信息，这将影响面试成功率', {
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        // 创建表单容器
        const formContainer = this.add.container(640, 140);

        // 基本信息
        this.createBasicInfo(formContainer);

        // 教育背景
        this.createEducationSection(formContainer);

        // 技能标签
        this.createSkillsSection(formContainer);

        // 项目经验
        this.createProjectsSection(formContainer);

        // 期望薪资
        this.createSalarySection(formContainer);

        // 求职偏好
        this.createPreferencesSection(formContainer);

        // 保存按钮
        this.createSaveButton();
    }

    private createBasicInfo(container: Phaser.GameObjects.Container): void {
        let y = 0;

        // 姓名
        this.add.text(0, y, '姓名:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const nameInput = this.createInput(80, y, 200, 40, '求职者');
        nameInput.on('textchange', (text: string) => {
            this.formData.name = text;
        });
        this.formData.name = '求职者';

        y += 60;

        // 年龄
        this.add.text(0, y, '年龄:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const ageInput = this.createInput(80, y, 100, 40, '25');
        ageInput.on('textchange', (text: string) => {
            this.formData.age = parseInt(text) || 25;
        });
        this.formData.age = 25;

        // 工作年限
        this.add.text(200, y, '工作年限:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const expInput = this.createInput(310, y, 100, 40, '2');
        expInput.on('textchange', (text: string) => {
            this.formData.experience = parseInt(text) || 0;
        });
        this.formData.experience = 2;
    }

    private createEducationSection(container: Phaser.GameObjects.Container): void {
        const y = 130;

        this.add.text(0, y, '学历:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // 学历选项按钮
        const educations: Array<{ value: PlayerResume['education']; label: string }> = [
            { value: 'high_school', label: '高中' },
            { value: 'college', label: '大专' },
            { value: 'bachelor', label: '本科' },
            { value: 'master', label: '硕士' },
            { value: 'phd', label: '博士' }
        ];

        let x = 80;
        this.educationButtons = [];  // 清空按钮数组
        educations.forEach((edu, index) => {
            const btn = this.createToggleButton(x, y, edu.label, this.currentEducation === edu.value, edu.value);
            btn.on('click', () => {
                this.currentEducation = edu.value;
                this.formData.education = edu.value;
                // 更新所有按钮视觉
                this.updateEducationButtons();
            });
            this.educationButtons.push(btn);
            x += 110;
        });
        this.formData.education = 'bachelor';

        // 学校
        let schoolY = y + 60;
        this.add.text(0, schoolY, '学校:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const schoolInput = this.createInput(80, schoolY, 250, 40, '普通本科');
        schoolInput.on('textchange', (text: string) => {
            this.formData.school = text;
        });
        this.formData.school = '普通本科';

        // 专业
        schoolY += 60;
        this.add.text(0, schoolY, '专业:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const majorInput = this.createInput(80, schoolY, 250, 40, '计算机科学');
        majorInput.on('textchange', (text: string) => {
            this.formData.major = text;
        });
        this.formData.major = '计算机科学';
    }

    private updateEducationButtons(): void {
        // 更新所有学历按钮的视觉状态
        this.educationButtons.forEach(btn => {
            const eduValue = btn.getData('value');
            const isActive = eduValue === this.currentEducation;
            btn.setData('active', isActive);

            // 更新背景颜色
            const bg = btn.getAt(0) as Phaser.GameObjects.Rectangle;
            const text = btn.getAt(1) as Phaser.GameObjects.Text;

            if (isActive) {
                bg.setFillStyle(0x4a90d9);
                bg.setStrokeStyle(2, 0x6ab0f9);
                text.setColor('#ffffff');
            } else {
                bg.setFillStyle(0x3a3a4a);
                bg.setStrokeStyle(2, 0x4a4a5a);
                text.setColor('#aaaaaa');
            }
        });
    }

    private createSkillsSection(container: Phaser.GameObjects.Container): void {
        const y = 330;

        this.add.text(0, y, '技能 (逗号分隔):', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const skillsInput = this.createInput(0, y + 40, 400, 40, 'JavaScript, React, Node.js, Python, TypeScript');
        skillsInput.on('textchange', (text: string) => {
            this.formData.skills = text.split(',').map(s => s.trim()).filter(s => s);
        });
        this.formData.skills = ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript'];

        this.add.text(420, y + 40, '提示: 技能越匹配职位要求，面试成功率越高', {
            fontSize: '12px',
            color: '#888888',
            wordWrap: { width: 300 }
        });
    }

    private createProjectsSection(container: Phaser.GameObjects.Container): void {
        const y = 430;

        this.add.text(0, y, '项目经验 (每行一个):', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const projectsInput = this.createInput(0, y + 40, 400, 80, '个人博客系统\n电商小程序\n企业级后台管理系统');
        projectsInput.on('textchange', (text: string) => {
            this.formData.projects = text.split('\n').map(s => s.trim()).filter(s => s);
        });
        this.formData.projects = ['个人博客系统', '电商小程序', '企业级后台管理系统'];
    }

    private createSalarySection(container: Phaser.GameObjects.Container): void {
        const y = 540;

        this.add.text(0, y, '期望月薪 (¥):', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // 最低薪资
        this.add.text(0, y + 40, '最低:', {
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5);

        const minSalaryBtn = this.createNumberInput(80, y + 40, 120, 40, this.currentSalaryMin, 5000, 50000, 1000);
        minSalaryBtn.on('valuechange', (value: number) => {
            this.currentSalaryMin = value;
            if (this.currentSalaryMin > this.currentSalaryMax) {
                this.currentSalaryMax = this.currentSalaryMin;
            }
            this.updateSalaryDisplay();
        });

        // 最高薪资
        this.add.text(220, y + 40, '最高:', {
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0, 0.5);

        const maxSalaryBtn = this.createNumberInput(300, y + 40, 120, 40, this.currentSalaryMax, 5000, 50000, 1000);
        maxSalaryBtn.on('valuechange', (value: number) => {
            this.currentSalaryMax = value;
            if (this.currentSalaryMax < this.currentSalaryMin) {
                this.currentSalaryMin = this.currentSalaryMax;
            }
            this.updateSalaryDisplay();
        });

        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];

        // 显示当前薪资范围
        const salaryDisplay = this.add.text(450, y + 40, `¥${this.currentSalaryMin.toLocaleString()} - ¥${this.currentSalaryMax.toLocaleString()}`, {
            fontSize: '18px',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
    }

    private updateSalaryDisplay(): void {
        this.formData.expectedSalary = [this.currentSalaryMin, this.currentSalaryMax];
    }

    private createPreferencesSection(container: Phaser.GameObjects.Container): void {
        const y = 620;

        this.add.text(0, y, '求职偏好:', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // 默认偏好
        this.formData.jobPreferences = {
            industries: ['互联网', '软件', 'AI'],
            companyTypes: ['large', 'mid', 'foreign'],
            workTypes: ['onsite', 'hybrid']
        };

        this.add.text(0, y + 30, '(已自动设置常见偏好，可在求职中调整)', {
            fontSize: '12px',
            color: '#888888'
        });
    }

    private createInput(x: number, y: number, width: number, height: number, defaultValue: string): any {
        const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x2a2a3a);
        bg.setStrokeStyle(2, 0x4a4a5a);

        const text = this.add.text(x + 10, y + height / 2, defaultValue, {
            fontSize: '14px',
            color: '#ffffff',
            wordWrap: { width: width - 20 }
        }).setOrigin(0, 0.5);

        // 创建输入框容器（简化版，实际需要更复杂的输入处理）
        const container = this.add.container(x, y);
        container.add([bg, text]);
        container.setSize(width, height);

        // 模拟输入事件
        const emit = (event: string, data: any) => {
            container.emit(event, data);
        };

        // 简化：点击时弹出原生prompt
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
            const newValue = prompt('请输入:', text.text);
            if (newValue !== null) {
                text.setText(newValue);
                emit('textchange', newValue);
            }
        });

        (container as any).on = (event: string, callback: Function) => {
            container.events = container.events || {};
            container.events[event] = container.events[event] || [];
            container.events[event].push(callback);
        };

        (container as any).emit = (event: string, data: any) => {
            if (container.events && container.events[event]) {
                container.events[event].forEach((cb: Function) => cb(data));
            }
        };

        return container;
    }

    private createToggleButton(x: number, y: number, text: string, active: boolean, value: string): any {
        const bg = this.add.rectangle(x + 50, y + 20, 100, 40, active ? 0x4a90d9 : 0x3a3a4a);
        bg.setStrokeStyle(2, active ? 0x6ab0f9 : 0x4a4a5a);

        const textObj = this.add.text(x + 50, y + 20, text, {
            fontSize: '14px',
            color: active ? '#ffffff' : '#aaaaaa'
        }).setOrigin(0.5);

        const container = this.add.container(x, y);
        container.add([bg, textObj]);
        container.setSize(100, 40);
        container.setData('active', active);
        container.setData('value', value);  // 保存学历值

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
            container.emit('click');
        });

        // 实现事件系统（类似 createInput）
        (container as any).on = (event: string, callback: Function) => {
            container.events = container.events || {};
            container.events[event] = container.events[event] || [];
            container.events[event].push(callback);
        };

        (container as any).emit = (event: string, data: any) => {
            if (container.events && container.events[event]) {
                container.events[event].forEach((cb: Function) => cb(data));
            }
        };

        return container;
    }

    private createNumberInput(x: number, y: number, width: number, height: number, value: number, min: number, max: number, step: number): any {
        const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x2a2a3a);
        bg.setStrokeStyle(2, 0x4a4a5a);

        const text = this.add.text(x + width / 2, y + height / 2, `¥${value.toLocaleString()}`, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const minusBtn = this.add.text(x - 20, y + height / 2, '-', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const plusBtn = this.add.text(x + width + 20, y + height / 2, '+', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const container = this.add.container(x, y);
        container.add([bg, text, minusBtn, plusBtn]);

        const emit = (event: string, data: any) => {
            container.emit(event, data);
        };

        const updateValue = (newValue: number) => {
            value = Math.max(min, Math.min(max, newValue));
            text.setText(`¥${value.toLocaleString()}`);
            emit('valuechange', value);
        };

        minusBtn.setInteractive({ useHandCursor: true });
        minusBtn.on('pointerdown', () => {
            updateValue(value - step);
        });

        plusBtn.setInteractive({ useHandCursor: true });
        plusBtn.on('pointerdown', () => {
            updateValue(value + step);
        });

        (container as any).on = (event: string, callback: Function) => {
            container.events = container.events || {};
            container.events[event] = container.events[event] || [];
            container.events[event].push(callback);
        };

        return container;
    }

    private createSaveButton(): void {
        const button = this.add.container(640, 680);

        const bg = this.add.rectangle(0, 0, 200, 50, 0x4a90d9);
        bg.setStrokeStyle(2, 0x6ab0f9);

        const text = this.add.text(0, 0, '保存并开始', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.add([bg, text]);
        button.setSize(200, 50);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
            this.saveResume();
        });

        bg.on('pointerover', () => {
            bg.setFillStyle(0x5aa0e9);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x4a90d9);
        });
    }

    private saveResume(): void {
        // 更新求职系统的简历
        jobHuntSystem.updateResume(this.formData);

        // 显示成功提示
        this.add.rectangle(640, 360, 400, 200, 0x2a2a3a);
        this.add.text(640, 320, '✅ 简历已保存！', {
            fontSize: '24px',
            color: '#00ff88'
        }).setOrigin(0.5);

        this.add.text(640, 360, '开始你的求职之旅...', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 延迟跳转到求职场景
        this.time.delayedCall(1500, () => {
            this.scene.start('JobHuntScene');
        });
    }
}
