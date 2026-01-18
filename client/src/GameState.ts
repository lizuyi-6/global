/**
 * 游戏状态管理器
 * 管理所有游戏数据：玩家信息、时间、金钱、持仓等
 */

// ========== 类型定义 ==========

/** 玩家信息 */
export interface PlayerInfo {
    name: string;
    position: string;      // 职位
    salary: number;        // 月薪
    day: number;           // 入职天数
    skills: {
        communication: number;  // 沟通能力 0-100
        technical: number;      // 技术能力 0-100
        management: number;     // 管理能力 0-100
    };
}

/** 资金账户 */
export interface Account {
    cash: number;           // 可用现金
    stockValue: number;     // 股票市值
    totalAssets: number;    // 总资产
    todayProfit: number;    // 今日盈亏
    totalProfit: number;    // 总盈亏
}

/** 股票持仓 */
export interface StockPosition {
    code: string;           // 股票代码
    name: string;           // 股票名称
    quantity: number;       // 持有数量
    costPrice: number;      // 成本价
    currentPrice: number;   // 当前价
    profit: number;         // 盈亏金额
    profitRate: number;     // 盈亏比例
}

/** NPC 关系 */
export interface NPCRelationship {
    name: string;
    favorability: number;   // 好感度 -100 到 100
    interactions: number;   // 互动次数
    lastChat: string;       // 最后对话内容
}

/** 任务 */
export interface Task {
    id: string;
    title: string;
    description: string;
    type: 'document' | 'meeting' | 'communication' | 'emergency';
    difficulty: 'easy' | 'medium' | 'hard';
    reward: number;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;       // 0-100
}

/** 游戏时间 */
export interface GameTime {
    day: number;            // 第几天
    hour: number;           // 小时 (0-23)
    minute: number;         // 分钟 (0-59)
    weekday: number;        // 星期几 (1-7, 1=周一)
}

/** 完整游戏状态 */
export interface GameState {
    player: PlayerInfo;
    account: Account;
    positions: StockPosition[];
    relationships: Map<string, NPCRelationship>;
    tasks: Task[];
    gameTime: GameTime;
    settings: {
        soundEnabled: boolean;
        musicEnabled: boolean;
        autoSave: boolean;
    };
}

// ========== 事件系统 ==========

type GameEventType =
    | 'time_tick'           // 时间流逝
    | 'day_start'           // 新的一天开始
    | 'day_end'             // 一天结束
    | 'money_changed'       // 金钱变化
    | 'position_changed'    // 持仓变化
    | 'task_updated'        // 任务更新
    | 'relationship_changed' // 关系变化
    | 'market_update'       // 行情更新
    | 'game_win';           // 游戏胜利

type GameEventCallback = (data: any) => void;

// ========== 游戏状态管理器 ==========

class GameStateManager {
    private state: GameState;
    private listeners: Map<GameEventType, GameEventCallback[]> = new Map();
    private timeInterval: number | null = null;

    constructor() {
        this.state = this.createInitialState();
        this.generateDailyTasks(); // Generate initial tasks
    }

    /** 创建初始状态 */
    private createInitialState(): GameState {
        return {
            player: {
                name: '新员工',
                position: '实习生',
                salary: 5000,
                day: 1,
                skills: {
                    communication: 30,
                    technical: 40,
                    management: 20
                }
            },
            account: {
                cash: 10000,        // 初始资金 1万
                stockValue: 0,
                totalAssets: 10000,
                todayProfit: 0,
                totalProfit: 0
            },
            positions: [],
            relationships: new Map([
                ['张经理', { name: '张经理', favorability: 0, interactions: 0, lastChat: '' }],
                ['李同事', { name: '李同事', favorability: 10, interactions: 0, lastChat: '' }],
                ['王前辈', { name: '王前辈', favorability: 5, interactions: 0, lastChat: '' }]
            ]),
            tasks: [],
            gameTime: {
                day: 1,
                hour: 9,
                minute: 0,
                weekday: 1  // 周一
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                autoSave: true
            }
        };
    }

    // ========== 事件系统 ==========

    /** 订阅事件 */
    on(event: GameEventType, callback: GameEventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    /** 取消订阅 */
    off(event: GameEventType, callback: GameEventCallback): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /** 触发事件 */
    private emit(event: GameEventType, data?: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(data));
        }
    }

    // ========== 时间系统 ==========

    /** 启动时间流逝 */
    startTime(): void {
        if (this.timeInterval) return;

        // 每秒游戏时间流逝 5 分钟
        this.timeInterval = window.setInterval(() => {
            this.advanceTime(5);
        }, 1000);
    }

    /** 停止时间 */
    stopTime(): void {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }

    /** 推进时间 */
    advanceTime(minutes: number): void {
        const time = this.state.gameTime;
        time.minute += minutes;

        while (time.minute >= 60) {
            time.minute -= 60;
            time.hour++;
        }

        // 下班时间检查 (18:00)
        if (time.hour >= 18) {
            this.endDay();
            return;
        }

        this.emit('time_tick', { ...time });
    }

    /** 结束一天 */
    private endDay(): void {
        this.emit('day_end', { day: this.state.gameTime.day });

        // 发工资（每月第1天）
        if (this.state.gameTime.day % 30 === 0) {
            this.addCash(this.state.player.salary, '工资收入');
        }

        // 进入新的一天
        this.state.gameTime.day++;
        this.state.gameTime.hour = 9;
        this.state.gameTime.minute = 0;
        this.state.gameTime.weekday = (this.state.gameTime.weekday % 7) + 1;

        // 重置今日盈亏
        this.state.account.todayProfit = 0;

        this.state.player.day++;

        // 生成新任务
        this.generateDailyTasks();

        this.emit('day_start', { day: this.state.gameTime.day });
    }

    /** 获取格式化时间 */
    getFormattedTime(): string {
        const time = this.state.gameTime;
        const h = time.hour.toString().padStart(2, '0');
        const m = time.minute.toString().padStart(2, '0');
        const weekdays = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        return `第${time.day}天 ${weekdays[time.weekday]} ${h}:${m}`;
    }

    // ========== 资金系统 ==========

    /** 获取账户信息 */
    getAccount(): Account {
        return { ...this.state.account };
    }

    /** 添加现金 */
    addCash(amount: number, reason: string): boolean {
        this.state.account.cash += amount;
        this.updateTotalAssets();
        this.emit('money_changed', { amount, reason, newCash: this.state.account.cash });
        return true;
    }

    /** 扣除现金 */
    deductCash(amount: number, reason: string): boolean {
        if (this.state.account.cash < amount) {
            return false;
        }
        this.state.account.cash -= amount;
        this.updateTotalAssets();
        this.emit('money_changed', { amount: -amount, reason, newCash: this.state.account.cash });
        return true;
    }

    /** 更新总资产 */
    private updateTotalAssets(): void {
        const stockValue = this.state.positions.reduce((sum, pos) => {
            return sum + pos.currentPrice * pos.quantity;
        }, 0);
        this.state.account.stockValue = stockValue;
        this.state.account.totalAssets = this.state.account.cash + stockValue;

        // 检查胜利条件 (资产突破 100万)
        if (this.state.account.totalAssets >= 1000000) {
            this.emit('game_win', {
                success: true,
                reason: `资产达到 ¥${this.state.account.totalAssets.toLocaleString()}，实现财富自由！`
            });
        }
    }

    // ========== 持仓系统 ==========

    /** 获取所有持仓 */
    getPositions(): StockPosition[] {
        return [...this.state.positions];
    }

    /** 获取单个持仓 */
    getPosition(code: string): StockPosition | undefined {
        return this.state.positions.find(p => p.code === code);
    }

    /** 更新持仓价格 */
    updatePositionPrice(code: string, newPrice: number): void {
        const position = this.state.positions.find(p => p.code === code);
        if (position) {
            position.currentPrice = newPrice;
            position.profit = (newPrice - position.costPrice) * position.quantity;
            position.profitRate = (newPrice - position.costPrice) / position.costPrice;
            this.updateTotalAssets();
        }
    }

    /** 买入股票 */
    buyStock(code: string, name: string, price: number, quantity: number): { success: boolean; message: string } {
        // 必须是100的整数倍（1手 = 100股）
        if (quantity % 100 !== 0) {
            return { success: false, message: '买入数量必须是100的整数倍' };
        }

        // 计算费用（含手续费）
        const commission = Math.max(price * quantity * 0.0003, 5); // 佣金万3，最低5元
        const totalCost = price * quantity + commission;

        if (this.state.account.cash < totalCost) {
            return { success: false, message: '可用资金不足' };
        }

        // 扣除资金
        this.state.account.cash -= totalCost;

        // 更新持仓
        const existingPosition = this.state.positions.find(p => p.code === code);
        if (existingPosition) {
            // 计算新的成本价（加权平均）
            const totalQuantity = existingPosition.quantity + quantity;
            const totalCostValue = existingPosition.costPrice * existingPosition.quantity + price * quantity;
            existingPosition.costPrice = totalCostValue / totalQuantity;
            existingPosition.quantity = totalQuantity;
            existingPosition.currentPrice = price;
            existingPosition.profit = (price - existingPosition.costPrice) * totalQuantity;
            existingPosition.profitRate = (price - existingPosition.costPrice) / existingPosition.costPrice;
        } else {
            // 新建持仓
            this.state.positions.push({
                code,
                name,
                quantity,
                costPrice: price,
                currentPrice: price,
                profit: 0,
                profitRate: 0
            });
        }

        this.updateTotalAssets();
        this.emit('position_changed', { action: 'buy', code, quantity, price });

        return { success: true, message: `成功买入 ${name} ${quantity}股，成交价 ${price.toFixed(2)}` };
    }

    /** 卖出股票 */
    sellStock(code: string, price: number, quantity: number): { success: boolean; message: string } {
        const position = this.state.positions.find(p => p.code === code);

        if (!position) {
            return { success: false, message: '没有该股票持仓' };
        }

        if (quantity % 100 !== 0) {
            return { success: false, message: '卖出数量必须是100的整数倍' };
        }

        if (position.quantity < quantity) {
            return { success: false, message: '持仓数量不足' };
        }

        // 计算费用
        const commission = Math.max(price * quantity * 0.0003, 5);  // 佣金
        const stampTax = price * quantity * 0.001;                  // 印花税千1
        const totalFee = commission + stampTax;
        const revenue = price * quantity - totalFee;

        // 计算盈亏
        const costValue = position.costPrice * quantity;
        const profit = revenue - costValue;

        // 更新今日盈亏
        this.state.account.todayProfit += profit;
        this.state.account.totalProfit += profit;

        // 增加资金
        this.state.account.cash += revenue;

        // 更新持仓
        position.quantity -= quantity;
        if (position.quantity === 0) {
            const index = this.state.positions.indexOf(position);
            this.state.positions.splice(index, 1);
        }

        this.updateTotalAssets();
        this.emit('position_changed', { action: 'sell', code, quantity, price, profit });

        const profitText = profit >= 0 ? `盈利 ¥${profit.toFixed(2)}` : `亏损 ¥${Math.abs(profit).toFixed(2)}`;
        return { success: true, message: `成功卖出 ${position.name} ${quantity}股，${profitText}` };
    }

    // ========== 关系系统 ==========

    /** 更新关系 */
    updateRelationship(npcName: string, change: number, lastChat?: string): void {
        const rel = this.state.relationships.get(npcName);
        if (rel) {
            rel.favorability = Math.max(-100, Math.min(100, rel.favorability + change));
            rel.interactions++;
            if (lastChat) {
                rel.lastChat = lastChat;
            }
            this.emit('relationship_changed', { npcName, ...rel });
        }
    }

    /** 获取关系 */
    getRelationship(npcName: string): NPCRelationship | undefined {
        return this.state.relationships.get(npcName);
    }

    // ========== 任务系统 ==========

    /** 生成每日任务 */
    generateDailyTasks(): void {
        const types = ['coding', 'report', 'meeting', 'clicking'];
        // Generate 3-5 tasks
        const count = 3 + Math.floor(Math.random() * 3);

        // Clear old pending tasks (optional: keep them? stick to clearing for now)
        this.state.tasks = this.state.tasks.filter(t => t.status === 'completed');

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            let title = '';
            let description = '';
            let reward = 0;

            switch (type) {
                case 'coding':
                    title = '修复关键Bug';
                    description = '系统核心模块出现了严重的逻辑错误，需要立即修复。';
                    reward = 800 + Math.floor(Math.random() * 500);
                    break;
                case 'report':
                    title = '撰写季度报告';
                    description = '整理本季度的业务数据，生成详细的分析报告。';
                    reward = 600 + Math.floor(Math.random() * 400);
                    break;
                case 'meeting':
                    title = '参加跨部门会议';
                    description = '与产品和设计团队协调新功能的开发进度。';
                    reward = 400 + Math.floor(Math.random() * 300);
                    break;
                case 'clicking':
                    title = '数据录入';
                    description = '将纸质文档的数据录入到电子系统中，枯燥但必要。';
                    reward = 300 + Math.floor(Math.random() * 200);
                    break;
            }

            this.addTask({
                id: `task_${this.state.gameTime.day}_${i}_${Date.now()}`,
                title: title,
                description: description,
                type: type as any,
                difficulty: 'medium',
                reward: reward,
                deadline: '18:00',
                status: 'pending',
                progress: 0
            });
        }
        console.log(`[GameState] Generated ${count} new tasks for Day ${this.state.gameTime.day}`);
    }

    /** 添加任务 */
    addTask(task: Task): void {
        this.state.tasks.push(task);
        this.emit('task_updated', { action: 'add', task });
    }

    /** 更新任务进度 */
    updateTaskProgress(taskId: string, progress: number): void {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            task.progress = Math.min(100, progress);
            if (task.progress >= 100) {
                task.status = 'completed';
                this.addCash(task.reward, `完成任务: ${task.title}`);
            }
            this.emit('task_updated', { action: 'update', task });
        }
    }

    /** 获取今日任务 */
    getTodayTasks(): Task[] {
        return this.state.tasks.filter(t => t.status !== 'completed' && t.status !== 'failed');
    }

    // ========== 玩家信息 ==========

    /** 获取玩家信息 */
    getPlayer(): PlayerInfo {
        return { ...this.state.player };
    }

    /** 设置玩家名字 */
    setPlayerName(name: string): void {
        this.state.player.name = name;
    }

    /** 获取游戏时间 */
    getGameTime(): GameTime {
        return { ...this.state.gameTime };
    }

    // ========== 存档系统 ==========

    /** 保存游戏 */
    saveGame(): void {
        const saveData = {
            player: this.state.player,
            account: this.state.account,
            positions: this.state.positions,
            relationships: Array.from(this.state.relationships.entries()),
            tasks: this.state.tasks,
            gameTime: this.state.gameTime,
            settings: this.state.settings,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('office_sandbox_save', JSON.stringify(saveData));
        console.log('游戏已保存');
    }

    /** 加载游戏 */
    loadGame(): boolean {
        const saveData = localStorage.getItem('office_sandbox_save');
        if (!saveData) {
            return false;
        }

        try {
            const data = JSON.parse(saveData);
            this.state.player = data.player;
            this.state.account = data.account;
            this.state.positions = data.positions;
            this.state.relationships = new Map(data.relationships);
            this.state.tasks = data.tasks;
            this.state.gameTime = data.gameTime;
            this.state.settings = data.settings;
            console.log('游戏已加载');
            return true;
        } catch (e) {
            console.error('加载存档失败:', e);
            return false;
        }
    }

    /** 重置游戏 */
    resetGame(): void {
        this.state = this.createInitialState();
        localStorage.removeItem('office_sandbox_save');
        console.log('游戏已重置');
    }

    /** 检查是否有存档 */
    hasSaveData(): boolean {
        return localStorage.getItem('office_sandbox_save') !== null;
    }
}

// 全局单例
export const gameState = new GameStateManager();
