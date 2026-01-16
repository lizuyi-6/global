import Phaser from 'phaser';
import { notificationManager } from '../NotificationManager';

/**
 * 增强版办公室场景
 * 支持：
 * 1. 丰富的场景物品（水杯、键盘、鼠标、文件、同事...）
 * 2. AI驱动的自由指令输入
 * 3. 动态后果系统（影响职场关系、升职、被开除）
 */
export class ImprovedOfficeScene extends Phaser.Scene {
    private commandInput!: Phaser.GameObjects.DOMElement;
    private actionLog: string[] = [];
    private logDisplay!: Phaser.GameObjects.Text;

    // 场景物品
    private sceneObjects: Map<string, {
        sprite: Phaser.GameObjects.Text;
        name: string;
        description: string;
        canInteract: boolean;
    }> = new Map();

    // 同事关系
    private colleagues: Map<string, {
        name: string;
        sprite: Phaser.GameObjects.Text;
        relationship: number; // -100 到 100
        position: string;
    }> = new Map();

    // 玩家状态
    private playerMood: number = 50; // 0-100，心情指数
    private stressLevel: number = 30; // 0-100，压力指数
    private workProgress: number = 0; // 今日工作进度

    // UI 元素
    private statusPanel!: Phaser.GameObjects.Container;
    private commandPanel!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'ImprovedOfficeScene' });
    }

    create(): void {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x2a2a3a);

        // 创建办公室场景
        this.createOfficeEnvironment();

        // 创建同事
        this.createColleagues();

        // 创建状态栏
        this.createStatusPanel();

        // 创建指令输入框
        this.createCommandInput();

        // 创建行为日志
        this.createActionLog();

        // 提示
        this.showWelcomeMessage();
    }

    /**
     * 创建办公室环境（丰富的场景物品）
     */
    private createOfficeEnvironment(): void {
        const sceneY = 300;

        // 你的工位
        this.add.text(640, 100, '🏢 你的工位', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 左侧：办公桌
        const deskBg = this.add.rectangle(200, sceneY, 300, 200, 0x3a3a4a);
        deskBg.setStrokeStyle(2, 0x4a4a5a);

        // 桌上物品
        this.createSceneObject(150, sceneY - 50, '💻', 'computer', '电脑', '你的工作电脑，上面开着VS Code和Chrome');
        this.createSceneObject(250, sceneY - 50, '☕', 'coffee', '咖啡杯', '一杯冒着热气的咖啡，已经凉了');
        this.createSceneObject(150, sceneY + 20, '⌨️', 'keyboard', '键盘', '机械键盘，Cherry轴');
        this.createSceneObject(250, sceneY + 20, '🖱️', 'mouse', '鼠标', '罗技无线鼠标');
        this.createSceneObject(200, sceneY + 60, '📄', 'documents', '文件', '一堆需求文档和Bug报告');

        this.add.text(200, sceneY + 120, '你的办公桌', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        // 中间：公共区域
        const publicBg = this.add.rectangle(640, sceneY, 400, 200, 0x2a2a3a);
        publicBg.setStrokeStyle(2, 0x3a3a4a);

        this.createSceneObject(540, sceneY - 40, '🗑️', 'trashbin', '垃圾桶', '垃圾桶，里面有废纸和零食袋');
        this.createSceneObject(640, sceneY - 40, '🌿', 'plant', '绿植', '一盆发财树，好久没浇水了');
        this.createSceneObject(740, sceneY - 40, '📋', 'whiteboard', '白板', '白板上写着本周任务和Deadline');
        this.createSceneObject(640, sceneY + 40, '🪑', 'chair', '椅子', '人体工学椅，但坐久了还是腰疼');

        this.add.text(640, sceneY + 120, '公共区域', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        // 右侧：同事工位
        const colleagueDeskBg = this.add.rectangle(1080, sceneY, 300, 200, 0x3a3a4a);
        colleagueDeskBg.setStrokeStyle(2, 0x4a4a5a);

        this.createSceneObject(1030, sceneY - 50, '🖥️', 'colleague_computer', '同事的电脑', '隔壁同事的电脑，屏幕上是代码');
        this.createSceneObject(1130, sceneY - 50, '🍶', 'waterbottle', '水杯', '同事的保温杯');
        this.createSceneObject(1080, sceneY + 20, '📱', 'phone', '手机', '同事的手机，锁屏状态');

        this.add.text(1080, sceneY + 120, '隔壁同事工位', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);
    }

    /**
     * 创建场景物品
     */
    private createSceneObject(x: number, y: number, icon: string, id: string, name: string, description: string): void {
        const text = this.add.text(x, y, icon, {
            fontSize: '32px'
        }).setOrigin(0.5);

        text.setInteractive({ useHandCursor: true });

        // 悬停显示名称
        text.on('pointerover', () => {
            text.setScale(1.2);
            const tooltip = this.add.text(x, y - 40, name, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5);
            tooltip.setDepth(10000);
            text.setData('tooltip', tooltip);
        });

        text.on('pointerout', () => {
            text.setScale(1);
            const tooltip = text.getData('tooltip');
            if (tooltip) tooltip.destroy();
        });

        // 点击显示详情
        text.on('pointerdown', () => {
            this.showObjectDetail(name, description);
        });

        this.sceneObjects.set(id, {
            sprite: text,
            name,
            description,
            canInteract: true
        });
    }

    /**
     * 创建同事
     */
    private createColleagues(): void {
        const colleagues = [
            { name: '张经理', emoji: '👔', x: 1000, y: 150, position: '项目经理', relationship: 20 },
            { name: '李同事', emoji: '👨‍💻', x: 1080, y: 220, position: '前端开发', relationship: 50 },
            { name: '王测试', emoji: '👩‍💻', x: 950, y: 220, position: '测试工程师', relationship: 40 }
        ];

        colleagues.forEach(col => {
            const sprite = this.add.text(col.x, col.y, col.emoji, {
                fontSize: '40px'
            }).setOrigin(0.5);

            sprite.setInteractive({ useHandCursor: true });

            // 悬停显示关系
            sprite.on('pointerover', () => {
                sprite.setScale(1.2);
                const relationText = col.relationship >= 60 ? '😊关系好' :
                    col.relationship >= 30 ? '😐一般' : '😒关系差';
                const tooltip = this.add.text(col.x, col.y - 50, `${col.name} (${col.position})\n${relationText}`, {
                    fontSize: '12px',
                    color: '#ffffff',
                    backgroundColor: '#000000aa',
                    padding: { x: 8, y: 4 },
                    align: 'center'
                }).setOrigin(0.5);
                tooltip.setDepth(10000);
                sprite.setData('tooltip', tooltip);
            });

            sprite.on('pointerout', () => {
                sprite.setScale(1);
                const tooltip = sprite.getData('tooltip');
                if (tooltip) tooltip.destroy();
            });

            this.colleagues.set(col.name, {
                name: col.name,
                sprite: sprite,
                relationship: col.relationship,
                position: col.position
            });
        });
    }

    /**
     * 创建状态栏
     */
    private createStatusPanel(): void {
        this.statusPanel = this.add.container(100, 500);

        const bg = this.add.rectangle(0, 0, 300, 180, 0x1a1a2e, 0.9);
        bg.setStrokeStyle(2, 0x4a90d9);
        bg.setOrigin(0, 0);
        this.statusPanel.add(bg);

        const title = this.add.text(10, 10, '📊 状态', {
            fontSize: '16px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        this.statusPanel.add(title);

        this.statusPanel.setDepth(1000);
        this.updateStatusDisplay();
    }

    /**
     * 更新状态显示
     */
    private updateStatusDisplay(): void {
        // 清除旧文本
        this.statusPanel.iterate((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Text && child.y > 10) {
                child.destroy();
            }
        });

        const moodColor = this.playerMood >= 60 ? '#00ff88' : this.playerMood >= 30 ? '#ffaa00' : '#ff4444';
        const stressColor = this.stressLevel >= 70 ? '#ff4444' : this.stressLevel >= 40 ? '#ffaa00' : '#00ff88';

        const stats = [
            { label: '心情', value: this.playerMood, color: moodColor },
            { label: '压力', value: this.stressLevel, color: stressColor },
            { label: '工作进度', value: this.workProgress, color: '#4a90d9' }
        ];

        stats.forEach((stat, index) => {
            const y = 40 + index * 40;

            const label = this.add.text(10, y, `${stat.label}:`, {
                fontSize: '14px',
                color: '#cccccc'
            });
            this.statusPanel.add(label);

            const value = this.add.text(100, y, `${stat.value}`, {
                fontSize: '14px',
                color: stat.color,
                fontStyle: 'bold'
            });
            this.statusPanel.add(value);

            // 进度条
            const barBg = this.add.rectangle(150, y + 8, 130, 12, 0x333333);
            barBg.setOrigin(0, 0.5);
            this.statusPanel.add(barBg);

            const bar = this.add.rectangle(150, y + 8, stat.value * 1.3, 12, parseInt(stat.color.replace('#', '0x')));
            bar.setOrigin(0, 0.5);
            this.statusPanel.add(bar);
        });
    }

    /**
     * 创建指令输入框（永久显示）
     */
    private createCommandInput(): void {
        this.commandPanel = this.add.container(440, 600);

        const bg = this.add.rectangle(0, 0, 800, 100, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(2, 0x4a90d9);
        bg.setOrigin(0, 0);
        this.commandPanel.add(bg);

        const title = this.add.text(10, 10, '💬 输入你的行动（可以做任何事）', {
            fontSize: '14px',
            color: '#4a90d9',
            fontStyle: 'bold'
        });
        this.commandPanel.add(title);

        // 创建输入框+提交按钮（使用HTML）
        const inputHTML = `
            <div style="display: flex; gap: 10px;">
                <input type="text" id="commandInput" 
                       placeholder="例如：拿起咖啡杯喝一口 / 砸向张经理 / 摸鱼刷手机 / 认真工作..."
                       style="width: 620px; 
                              padding: 10px; 
                              font-size: 14px; 
                              background: #2a2a3a; 
                              color: #ffffff; 
                              border: 1px solid #4a90d9; 
                              border-radius: 4px;
                              outline: none;" />
                <button id="commandSubmit"
                        style="width: 120px;
                               padding: 10px;
                               font-size: 14px;
                               background: #4a90d9;
                               color: #ffffff;
                               border: none;
                               border-radius: 4px;
                               cursor: pointer;
                               font-weight: bold;">
                    提交
                </button>
            </div>
        `;

        const input = this.add.dom(400, 60, 'div').createFromHTML(inputHTML);
        this.commandPanel.add(input);

        // 延迟绑定事件，确保DOM已渲染
        this.time.delayedCall(100, () => {
            const inputElement = document.getElementById('commandInput') as HTMLInputElement;
            const submitBtn = document.getElementById('commandSubmit') as HTMLButtonElement;

            const handleSubmit = () => {
                if (inputElement) {
                    const command = inputElement.value.trim();
                    if (command) {
                        this.processCommand(command);
                        inputElement.value = '';
                    }
                }
            };

            // 回车键提交
            if (inputElement) {
                inputElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        handleSubmit();
                    }
                });
            } else {
                console.error('输入框元素未找到');
            }

            // 按钮点击提交
            if (submitBtn) {
                submitBtn.addEventListener('click', handleSubmit);
                // 按钮悬停效果
                submitBtn.addEventListener('mouseenter', () => {
                    submitBtn.style.background = '#5aa0e9';
                });
                submitBtn.addEventListener('mouseleave', () => {
                    submitBtn.style.background = '#4a90d9';
                });
            }
        });

        this.commandPanel.setDepth(2000);
    }

    /**
     * 创建行为日志
     */
    private createActionLog(): void {
        const logBg = this.add.rectangle(1130, 500, 280, 180, 0x1a1a2e, 0.9);
        logBg.setStrokeStyle(2, 0x666666);
        logBg.setOrigin(1, 0);

        const logTitle = this.add.text(860, 510, '📜 行为记录', {
            fontSize: '14px',
            color: '#888888',
            fontStyle: 'bold'
        });

        this.logDisplay = this.add.text(860, 540, '', {
            fontSize: '12px',
            color: '#cccccc',
            wordWrap: { width: 260 },
            lineSpacing: 4
        });
    }

    /**
     * 处理玩家指令（AI驱动）
     */
    private async processCommand(command: string): Promise<void> {
        this.addLog(`你: ${command}`);

        // 显示“思考中”
        const thinkingText = this.add.text(640, 360, '判断后果中...', {
            fontSize: '18px',
            color: '#ffaa00',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(10000);

        // 延迟模拟思考时间
        await new Promise(resolve => setTimeout(resolve, 500));

        thinkingText.destroy();

        // 使用简单规则处理（等AI接口完善后再替换）
        this.processWithSimpleRules(command);
    }

    /**
     * 构建上下文信息
     */
    private buildContext(): string {
        let context = `心情: ${this.playerMood}, 压力: ${this.stressLevel}, 工作进度: ${this.workProgress}\n`;
        context += `同事关系:\n`;
        this.colleagues.forEach((col, name) => {
            context += `  ${name}(${col.position}): ${col.relationship}\n`;
        });
        context += `\n可见物品: `;
        context += Array.from(this.sceneObjects.keys()).join(', ');
        return context;
    }

    /**
     * 解析AI响应
     */
    private parseAIResponse(response: string): any {
        try {
            // 尝试从响应中提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败:', e);
        }

        // 默认返回
        return {
            feasible: true,
            description: response.substring(0, 100),
            consequences: '这个行为产生了一些影响...',
            changes: { mood: 0, stress: 0, workProgress: 0, relationships: {} },
            severity: 'normal'
        };
    }

    /**
     * 应用后果
     */
    private applyConsequences(result: any): void {
        // 显示行为描述
        this.addLog(`结果: ${result.description}`);

        if (!result.feasible) {
            this.addLog('系统: 这个行为无法执行！');
            return;
        }

        // 应用数值变化
        if (result.changes) {
            if (result.changes.mood) {
                this.playerMood = Math.max(0, Math.min(100, this.playerMood + result.changes.mood));
            }
            if (result.changes.stress) {
                this.stressLevel = Math.max(0, Math.min(100, this.stressLevel + result.changes.stress));
            }
            if (result.changes.workProgress) {
                this.workProgress = Math.max(0, Math.min(100, this.workProgress + result.changes.workProgress));
            }

            // 更新同事关系
            if (result.changes.relationships) {
                Object.entries(result.changes.relationships).forEach(([name, change]: [string, any]) => {
                    const colleague = this.colleagues.get(name);
                    if (colleague) {
                        colleague.relationship = Math.max(-100, Math.min(100, colleague.relationship + change));
                    }
                });
            }
        }

        // 显示后果
        this.addLog(`后果: ${result.consequences}`);

        // 根据严重性显示通知
        if (result.severity === 'critical') {
            notificationManager.error('严重后果', result.consequences, 8000);
        } else if (result.severity === 'warning') {
            notificationManager.warning('警告', result.consequences, 6000);
        }

        // 更新UI
        this.updateStatusDisplay();

        // 检查触发条件
        this.checkTriggers();
    }

    /**
     * 简单规则处理（替代AI）
     */
    private processWithSimpleRules(command: string): void {
        const lower = command.toLowerCase();

        if (lower.includes('工作') || lower.includes('代码') || lower.includes('电脑')) {
            this.playerMood -= 5;
            this.stressLevel += 5;
            this.workProgress += 10;
            this.addLog('你努力工作了一会儿...');
        } else if (lower.includes('摸鱼') || lower.includes('刷手机') || lower.includes('休息')) {
            this.playerMood += 10;
            this.stressLevel -= 5;
            this.workProgress -= 5;
            this.addLog('你偷偷摸鱼放松了一下...');
        } else if (lower.includes('砸') || lower.includes('攻击') || lower.includes('打')) {
            this.playerMood -= 20;
            this.stressLevel += 30;
            this.addLog('你做出了极端行为！！！');
            notificationManager.error('严重警告', '暴力行为可能导致被开除！', 10000);
        } else {
            this.addLog('你尝试了一些事情...');
        }

        this.updateStatusDisplay();
    }

    /**
     * 检查触发条件（升职、被开除等）
     */
    private checkTriggers(): void {
        // 工作进度满 → 升职机会
        if (this.workProgress >= 100) {
            notificationManager.success('恭喜', '你完成了今天的工作！老板注意到你了...', 8000);
            this.workProgress = 0;
        }

        // 压力过大 → 崩溃
        if (this.stressLevel >= 100) {
            notificationManager.error('压力爆表', '你精神崩溃了，需要休息！', 10000);
            this.stressLevel = 50;
            this.playerMood = 20;
        }

        // 心情过低 → 离职倾向
        if (this.playerMood <= 10) {
            notificationManager.warning('警告', '你的心情极度低落，考虑离职吗？', 8000);
        }
    }

    /**
     * 添加日志
     */
    private addLog(text: string): void {
        this.actionLog.unshift(text);
        if (this.actionLog.length > 8) {
            this.actionLog.pop();
        }
        this.logDisplay.setText(this.actionLog.join('\n'));
    }

    /**
     * 显示物品详情
     */
    private showObjectDetail(name: string, description: string): void {
        const detail = this.add.text(640, 360, `${name}\n\n${description}`, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000dd',
            padding: { x: 20, y: 15 },
            align: 'center',
            wordWrap: { width: 400 }
        }).setOrigin(0.5).setDepth(9999);

        this.time.delayedCall(2000, () => detail.destroy());
    }

    /**
     * 显示欢迎信息
     */
    private showWelcomeMessage(): void {
        this.addLog('欢迎来到职场！');
        this.addLog('你可以在下方输入任何想做的事...');
        this.addLog('点击物品查看详情');
        this.addLog('系统: AI会判断你行为的后果');
    }
}
