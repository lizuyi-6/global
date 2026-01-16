/**
 * 股市系统
 * 模拟真实股票交易规则：涨跌停、K线、分时、手续费等
 */

// ========== 类型定义 ==========

/** 股票基本信息 */
export interface Stock {
    code: string;           // 股票代码
    name: string;           // 股票名称
    sector: string;         // 板块（科技、金融、消费等）

    // 当前行情
    price: number;          // 当前价
    open: number;           // 开盘价
    high: number;           // 最高价
    low: number;            // 最低价
    close: number;          // 昨收价（用于计算涨跌）
    volume: number;         // 成交量（手）
    amount: number;         // 成交额

    // 涨跌信息
    change: number;         // 涨跌额
    changePercent: number;  // 涨跌幅 (%)

    // 限制
    limitUp: number;        // 涨停价
    limitDown: number;      // 跌停价
    isLimitUp: boolean;     // 是否涨停
    isLimitDown: boolean;   // 是否跌停
}

/** K线数据（单根） */
export interface KLineData {
    time: number;           // 时间戳
    open: number;           // 开盘价
    high: number;           // 最高价
    low: number;            // 最低价
    close: number;          // 收盘价
    volume: number;         // 成交量
}

/** 分时数据 */
export interface TimeLineData {
    time: string;           // 时间 HH:mm
    price: number;          // 价格
    avgPrice: number;       // 均价
    volume: number;         // 成交量
}

/** 买卖盘口 */
export interface OrderBook {
    // 卖盘（从低到高）
    asks: { price: number; volume: number }[];
    // 买盘（从高到低）
    bids: { price: number; volume: number }[];
}

// ========== 股市管理器 ==========

class StockMarket {
    private stocks: Map<string, Stock> = new Map();
    private klineHistory: Map<string, KLineData[]> = new Map();
    private timelineData: Map<string, TimeLineData[]> = new Map();
    private updateInterval: number | null = null;
    private listeners: ((stocks: Stock[]) => void)[] = [];

    constructor() {
        this.initializeStocks();
    }

    /** 初始化股票列表 */
    private initializeStocks(): void {
        const stocksData = [
            // 科技板块
            { code: 'TECH001', name: '云计算科技', sector: '科技', basePrice: 88.50 },
            { code: 'TECH002', name: '芯片半导', sector: '科技', basePrice: 156.20 },
            { code: 'TECH003', name: '人工智能', sector: '科技', basePrice: 234.80 },
            { code: 'TECH004', name: '新能源车', sector: '科技', basePrice: 445.00 },

            // 金融板块
            { code: 'FINA001', name: '工商银行', sector: '金融', basePrice: 4.85 },
            { code: 'FINA002', name: '平安保险', sector: '金融', basePrice: 42.30 },
            { code: 'FINA003', name: '招商银行', sector: '金融', basePrice: 32.15 },

            // 消费板块
            { code: 'CONS001', name: '贵州茅台', sector: '消费', basePrice: 1688.00 },
            { code: 'CONS002', name: '五粮液', sector: '消费', basePrice: 142.50 },
            { code: 'CONS003', name: '海天味业', sector: '消费', basePrice: 38.90 },

            // 医药板块
            { code: 'MEDI001', name: '恒瑞医药', sector: '医药', basePrice: 43.20 },
            { code: 'MEDI002', name: '药明康德', sector: '医药', basePrice: 68.50 },

            // 新能源板块
            { code: 'ENER001', name: '宁德时代', sector: '新能源', basePrice: 198.00 },
            { code: 'ENER002', name: '隆基绿能', sector: '新能源', basePrice: 22.80 },
        ];

        stocksData.forEach(data => {
            const stock = this.createStock(data.code, data.name, data.sector, data.basePrice);
            this.stocks.set(data.code, stock);

            // 生成历史K线数据（最近60个交易日）
            this.generateKLineHistory(data.code, data.basePrice, 60);
        });
    }

    /** 创建股票对象 */
    private createStock(code: string, name: string, sector: string, basePrice: number): Stock {
        const close = basePrice;
        // 随机生成今日开盘价（昨收±2%内）
        const openChange = (Math.random() - 0.5) * 0.04;
        const open = parseFloat((close * (1 + openChange)).toFixed(2));

        // 计算涨跌停价（A股涨跌停10%）
        const limitUp = parseFloat((close * 1.10).toFixed(2));
        const limitDown = parseFloat((close * 0.90).toFixed(2));

        // 当前价初始化为开盘价
        const price = open;

        return {
            code,
            name,
            sector,
            price,
            open,
            high: price,
            low: price,
            close,
            volume: Math.floor(Math.random() * 50000) + 10000,
            amount: 0,
            change: parseFloat((price - close).toFixed(2)),
            changePercent: parseFloat(((price - close) / close * 100).toFixed(2)),
            limitUp,
            limitDown,
            isLimitUp: false,
            isLimitDown: false
        };
    }

    /** 生成历史K线数据 */
    private generateKLineHistory(code: string, currentPrice: number, days: number): void {
        const klines: KLineData[] = [];
        let price = currentPrice * (0.7 + Math.random() * 0.3); // 从更早的价格开始

        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        for (let i = days; i > 0; i--) {
            // 随机涨跌（-5% 到 +5%）
            const changePercent = (Math.random() - 0.48) * 0.1; // 略微偏向上涨
            const open = price;
            const close = parseFloat((price * (1 + changePercent)).toFixed(2));

            // 生成最高和最低价
            const volatility = Math.random() * 0.03 + 0.01;
            const high = parseFloat((Math.max(open, close) * (1 + volatility)).toFixed(2));
            const low = parseFloat((Math.min(open, close) * (1 - volatility)).toFixed(2));

            klines.push({
                time: now - i * dayMs,
                open,
                high,
                low,
                close,
                volume: Math.floor(Math.random() * 100000) + 20000
            });

            price = close;
        }

        this.klineHistory.set(code, klines);
    }

    /** 启动行情更新 */
    startMarket(): void {
        if (this.updateInterval) return;

        // 每3秒更新一次行情
        this.updateInterval = window.setInterval(() => {
            this.updatePrices();
        }, 3000);
    }

    /** 停止行情更新 */
    stopMarket(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /** 更新股票价格 */
    private updatePrices(): void {
        this.stocks.forEach(stock => {
            // 如果已涨停或跌停，有小概率开板
            if (stock.isLimitUp || stock.isLimitDown) {
                if (Math.random() < 0.05) {
                    // 开板
                    stock.isLimitUp = false;
                    stock.isLimitDown = false;
                } else {
                    return; // 保持封板状态
                }
            }

            // 随机涨跌（-1% 到 +1%）
            const volatility = (Math.random() - 0.5) * 0.02;
            let newPrice = stock.price * (1 + volatility);

            // 涨跌停限制
            if (newPrice >= stock.limitUp) {
                newPrice = stock.limitUp;
                stock.isLimitUp = true;
            } else if (newPrice <= stock.limitDown) {
                newPrice = stock.limitDown;
                stock.isLimitDown = true;
            }

            newPrice = parseFloat(newPrice.toFixed(2));

            // 更新股票数据
            stock.price = newPrice;
            stock.high = Math.max(stock.high, newPrice);
            stock.low = Math.min(stock.low, newPrice);
            stock.change = parseFloat((newPrice - stock.close).toFixed(2));
            stock.changePercent = parseFloat(((newPrice - stock.close) / stock.close * 100).toFixed(2));
            stock.volume += Math.floor(Math.random() * 1000);
            stock.amount = stock.volume * stock.price;

            // 更新分时数据
            this.updateTimeline(stock);
        });

        // 通知监听者
        this.notifyListeners();
    }

    /** 更新分时数据 */
    private updateTimeline(stock: Stock): void {
        const timeline = this.timelineData.get(stock.code) || [];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // 计算均价
        const totalAmount = timeline.reduce((sum, t) => sum + t.price * t.volume, 0) + stock.price * 100;
        const totalVolume = timeline.reduce((sum, t) => sum + t.volume, 0) + 100;
        const avgPrice = totalAmount / totalVolume;

        timeline.push({
            time: timeStr,
            price: stock.price,
            avgPrice: parseFloat(avgPrice.toFixed(2)),
            volume: Math.floor(Math.random() * 500) + 100
        });

        // 只保留最近240条（4小时交易时间）
        if (timeline.length > 240) {
            timeline.shift();
        }

        this.timelineData.set(stock.code, timeline);
    }

    /** 获取所有股票 */
    getAllStocks(): Stock[] {
        return Array.from(this.stocks.values());
    }

    /** 获取单个股票 */
    getStock(code: string): Stock | undefined {
        return this.stocks.get(code);
    }

    /** 按板块获取股票 */
    getStocksBySector(sector: string): Stock[] {
        return this.getAllStocks().filter(s => s.sector === sector);
    }

    /** 获取涨幅榜 */
    getTopGainers(limit: number = 10): Stock[] {
        return this.getAllStocks()
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, limit);
    }

    /** 获取跌幅榜 */
    getTopLosers(limit: number = 10): Stock[] {
        return this.getAllStocks()
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, limit);
    }

    /** 获取K线数据 */
    getKLineData(code: string, period: 'day' | 'week' | 'month' = 'day'): KLineData[] {
        const dailyData = this.klineHistory.get(code) || [];

        if (period === 'day') {
            return dailyData;
        }

        // 周K或月K需要合并数据
        const mergedData: KLineData[] = [];
        const periodDays = period === 'week' ? 5 : 20;

        for (let i = 0; i < dailyData.length; i += periodDays) {
            const slice = dailyData.slice(i, i + periodDays);
            if (slice.length === 0) continue;

            mergedData.push({
                time: slice[0].time,
                open: slice[0].open,
                high: Math.max(...slice.map(d => d.high)),
                low: Math.min(...slice.map(d => d.low)),
                close: slice[slice.length - 1].close,
                volume: slice.reduce((sum, d) => sum + d.volume, 0)
            });
        }

        return mergedData;
    }

    /** 获取分时数据 */
    getTimelineData(code: string): TimeLineData[] {
        return this.timelineData.get(code) || [];
    }

    /** 生成买卖盘口 */
    getOrderBook(code: string): OrderBook {
        const stock = this.stocks.get(code);
        if (!stock) {
            return { asks: [], bids: [] };
        }

        const asks: { price: number; volume: number }[] = [];
        const bids: { price: number; volume: number }[] = [];

        // 生成5档卖盘
        for (let i = 1; i <= 5; i++) {
            const price = parseFloat((stock.price + i * 0.01).toFixed(2));
            if (price <= stock.limitUp) {
                asks.push({
                    price,
                    volume: Math.floor(Math.random() * 5000) + 100
                });
            }
        }

        // 生成5档买盘
        for (let i = 1; i <= 5; i++) {
            const price = parseFloat((stock.price - i * 0.01).toFixed(2));
            if (price >= stock.limitDown) {
                bids.push({
                    price,
                    volume: Math.floor(Math.random() * 5000) + 100
                });
            }
        }

        return { asks, bids };
    }

    /** 添加行情更新监听器 */
    onUpdate(callback: (stocks: Stock[]) => void): void {
        this.listeners.push(callback);
    }

    /** 移除监听器 */
    offUpdate(callback: (stocks: Stock[]) => void): void {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /** 通知所有监听器 */
    private notifyListeners(): void {
        const stocks = this.getAllStocks();
        this.listeners.forEach(cb => cb(stocks));
    }

    /** 搜索股票 */
    searchStocks(keyword: string): Stock[] {
        const lowerKeyword = keyword.toLowerCase();
        return this.getAllStocks().filter(s =>
            s.code.toLowerCase().includes(lowerKeyword) ||
            s.name.toLowerCase().includes(lowerKeyword)
        );
    }

    /** 获取所有板块 */
    getSectors(): string[] {
        const sectors = new Set(this.getAllStocks().map(s => s.sector));
        return Array.from(sectors);
    }
}

// 全局单例
export const stockMarket = new StockMarket();
