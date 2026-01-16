import Phaser from 'phaser';
import { gameState } from '../GameState';
import type { KLineData, Stock } from '../StockMarket';
import { stockMarket } from '../StockMarket';

/**
 * 股票交易界面
 * 包含行情列表、K线图、买卖操作、持仓管理
 */
export class StockScene extends Phaser.Scene {
    private currentView: 'list' | 'detail' | 'position' = 'list';
    private selectedStock: Stock | null = null;
    private stockListContainer!: Phaser.GameObjects.Container;
    private detailContainer!: Phaser.GameObjects.Container;
    private positionContainer!: Phaser.GameObjects.Container;
    private headerContainer!: Phaser.GameObjects.Container;

    // K线图相关
    private klineGraphics!: Phaser.GameObjects.Graphics;
    private klinePeriod: 'day' | 'week' | 'month' = 'day';

    // 交易相关
    private tradeQuantity: number = 100;
    private tradePrice: number = 0;

    constructor() {
        super({ key: 'StockScene' });
    }

    create(): void {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2a);

        // 创建容器
        this.headerContainer = this.add.container(0, 0);
        this.stockListContainer = this.add.container(0, 0);
        this.detailContainer = this.add.container(0, 0);
        this.positionContainer = this.add.container(0, 0);

        // 绘制头部
        this.drawHeader();

        // 显示股票列表
        this.showStockList();

        // 启动行情更新
        stockMarket.startMarket();
        stockMarket.onUpdate((stocks) => this.onMarketUpdate(stocks));

        // 定时刷新显示
        this.time.addEvent({
            delay: 1000,
            callback: () => this.refreshCurrentView(),
            loop: true
        });
    }

    /** 绘制头部 */
    private drawHeader(): void {
        this.headerContainer.removeAll(true);

        // 背景
        const bg = this.add.rectangle(640, 35, 1280, 70, 0x2a2a3a);
        this.headerContainer.add(bg);

        // 返回按钮
        const backBtn = this.add.text(50, 35, '← 返回', {
            fontSize: '18px',
            color: '#ffffff'
        });
        backBtn.setOrigin(0, 0.5);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.goBack());
        this.headerContainer.add(backBtn);

        // 标题
        const title = this.add.text(640, 35, '股票交易', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5, 0.5);
        this.headerContainer.add(title);

        // 账户信息
        const account = gameState.getAccount();
        const accountText = this.add.text(1100, 25, `可用: ¥${account.cash.toFixed(2)}`, {
            fontSize: '14px',
            color: '#00ff88'
        });
        accountText.setOrigin(0.5, 0.5);
        this.headerContainer.add(accountText);

        const profitText = this.add.text(1100, 45, `今日盈亏: ${account.todayProfit >= 0 ? '+' : ''}¥${account.todayProfit.toFixed(2)}`, {
            fontSize: '12px',
            color: account.todayProfit >= 0 ? '#00ff88' : '#ff4444'
        });
        profitText.setOrigin(0.5, 0.5);
        this.headerContainer.add(profitText);

        // 导航标签
        const tabs = [
            { name: '行情', view: 'list' as const },
            { name: '持仓', view: 'position' as const },
        ];

        tabs.forEach((tab, index) => {
            const x = 300 + index * 100;
            const isActive = this.currentView === tab.view || (this.currentView === 'detail' && tab.view === 'list');

            const tabBtn = this.add.text(x, 55, tab.name, {
                fontSize: '14px',
                color: isActive ? '#00ff88' : '#888888'
            });
            tabBtn.setOrigin(0.5, 0.5);
            tabBtn.setInteractive({ useHandCursor: true });
            tabBtn.on('pointerdown', () => {
                if (tab.view === 'list') this.showStockList();
                else if (tab.view === 'position') this.showPositions();
            });
            this.headerContainer.add(tabBtn);
        });
    }

    /** 显示股票列表 */
    showStockList(): void {
        this.currentView = 'list';
        this.stockListContainer.setVisible(true);
        this.detailContainer.setVisible(false);
        this.positionContainer.setVisible(false);
        this.stockListContainer.removeAll(true);
        this.drawHeader();

        // 列表头
        const headers = ['代码', '名称', '最新价', '涨跌幅', '涨跌额', '成交量'];
        const headerWidths = [100, 120, 100, 100, 100, 120];
        let headerX = 50;

        headers.forEach((header, index) => {
            const text = this.add.text(headerX, 90, header, {
                fontSize: '12px',
                color: '#888888'
            });
            this.stockListContainer.add(text);
            headerX += headerWidths[index];
        });

        // 股票列表
        const stocks = stockMarket.getAllStocks();
        stocks.forEach((stock, index) => {
            this.drawStockRow(stock, index, 120 + index * 35);
        });
    }

    /** 绘制股票行 */
    private drawStockRow(stock: Stock, index: number, y: number): void {
        const rowBg = this.add.rectangle(640, y, 1200, 32, index % 2 === 0 ? 0x252535 : 0x2a2a3a);
        rowBg.setInteractive({ useHandCursor: true });
        rowBg.on('pointerover', () => rowBg.setFillStyle(0x3a3a4a));
        rowBg.on('pointerout', () => rowBg.setFillStyle(index % 2 === 0 ? 0x252535 : 0x2a2a3a));
        rowBg.on('pointerdown', () => this.showStockDetail(stock.code));
        this.stockListContainer.add(rowBg);

        const changeColor = stock.changePercent > 0 ? '#ff4444' : stock.changePercent < 0 ? '#00ff88' : '#ffffff';

        // 代码
        const codeText = this.add.text(50, y, stock.code, {
            fontSize: '13px',
            color: '#ffffff'
        });
        codeText.setOrigin(0, 0.5);
        this.stockListContainer.add(codeText);

        // 名称
        const nameText = this.add.text(150, y, stock.name, {
            fontSize: '13px',
            color: '#ffffff'
        });
        nameText.setOrigin(0, 0.5);
        this.stockListContainer.add(nameText);

        // 最新价
        const priceText = this.add.text(270, y, stock.price.toFixed(2), {
            fontSize: '13px',
            color: changeColor
        });
        priceText.setOrigin(0, 0.5);
        this.stockListContainer.add(priceText);

        // 涨跌幅
        let changePercentStr = stock.changePercent.toFixed(2) + '%';
        if (stock.changePercent > 0) changePercentStr = '+' + changePercentStr;
        if (stock.isLimitUp) changePercentStr += ' 涨停';
        if (stock.isLimitDown) changePercentStr += ' 跌停';

        const changePercentText = this.add.text(370, y, changePercentStr, {
            fontSize: '13px',
            color: changeColor
        });
        changePercentText.setOrigin(0, 0.5);
        this.stockListContainer.add(changePercentText);

        // 涨跌额
        let changeStr = stock.change.toFixed(2);
        if (stock.change > 0) changeStr = '+' + changeStr;

        const changeText = this.add.text(480, y, changeStr, {
            fontSize: '13px',
            color: changeColor
        });
        changeText.setOrigin(0, 0.5);
        this.stockListContainer.add(changeText);

        // 成交量
        const volumeText = this.add.text(580, y, this.formatVolume(stock.volume), {
            fontSize: '13px',
            color: '#888888'
        });
        volumeText.setOrigin(0, 0.5);
        this.stockListContainer.add(volumeText);

        // 快捷买入按钮
        const buyBtn = this.add.text(700, y, '买入', {
            fontSize: '12px',
            color: '#ff4444',
            backgroundColor: '#442222',
            padding: { x: 8, y: 4 }
        });
        buyBtn.setOrigin(0, 0.5);
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', (e: Phaser.Input.Pointer) => {
            e.event.stopPropagation();
            this.showStockDetail(stock.code);
        });
        this.stockListContainer.add(buyBtn);
    }

    /** 显示股票详情 */
    showStockDetail(code: string): void {
        const stock = stockMarket.getStock(code);
        if (!stock) return;

        this.selectedStock = stock;
        this.tradePrice = stock.price;
        this.currentView = 'detail';

        this.stockListContainer.setVisible(false);
        this.detailContainer.setVisible(true);
        this.positionContainer.setVisible(false);
        this.detailContainer.removeAll(true);
        this.drawHeader();

        // 股票信息区
        this.drawStockInfo(stock);

        // K线图区
        this.drawKLineChart(stock);

        // 盘口区
        this.drawOrderBook(stock);

        // 交易区
        this.drawTradePanel(stock);
    }

    /** 绘制股票信息 */
    private drawStockInfo(stock: Stock): void {
        const changeColor = stock.changePercent > 0 ? '#ff4444' : stock.changePercent < 0 ? '#00ff88' : '#ffffff';

        // 背景
        const infoBg = this.add.rectangle(200, 160, 380, 180, 0x2a2a3a);
        this.detailContainer.add(infoBg);

        // 名称和代码
        const nameText = this.add.text(30, 90, `${stock.name} (${stock.code})`, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.detailContainer.add(nameText);

        // 当前价格
        const priceText = this.add.text(30, 130, stock.price.toFixed(2), {
            fontSize: '36px',
            color: changeColor,
            fontStyle: 'bold'
        });
        this.detailContainer.add(priceText);

        // 涨跌信息
        let changeInfo = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}  ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
        if (stock.isLimitUp) changeInfo += ' 涨停';
        if (stock.isLimitDown) changeInfo += ' 跌停';

        const changeInfoText = this.add.text(30, 175, changeInfo, {
            fontSize: '16px',
            color: changeColor
        });
        this.detailContainer.add(changeInfoText);

        // 详细数据
        const details = [
            [`开盘: ${stock.open.toFixed(2)}`, `最高: ${stock.high.toFixed(2)}`],
            [`昨收: ${stock.close.toFixed(2)}`, `最低: ${stock.low.toFixed(2)}`],
            [`涨停: ${stock.limitUp.toFixed(2)}`, `跌停: ${stock.limitDown.toFixed(2)}`],
            [`成交量: ${this.formatVolume(stock.volume)}`, `成交额: ${this.formatAmount(stock.amount)}`],
        ];

        details.forEach((row, rowIndex) => {
            row.forEach((item, colIndex) => {
                const x = 30 + colIndex * 170;
                const y = 210 + rowIndex * 22;
                const text = this.add.text(x, y, item, {
                    fontSize: '12px',
                    color: '#888888'
                });
                this.detailContainer.add(text);
            });
        });
    }

    /** 绘制K线图 */
    private drawKLineChart(stock: Stock): void {
        // K线图区域
        const chartBg = this.add.rectangle(640, 380, 460, 400, 0x1a1a2a);
        chartBg.setStrokeStyle(1, 0x333333);
        this.detailContainer.add(chartBg);

        // K线周期选择
        const periods: Array<{ name: string; value: 'day' | 'week' | 'month' }> = [
            { name: '日K', value: 'day' },
            { name: '周K', value: 'week' },
            { name: '月K', value: 'month' },
        ];

        periods.forEach((period, index) => {
            const x = 450 + index * 60;
            const isActive = this.klinePeriod === period.value;

            const btn = this.add.text(x, 200, period.name, {
                fontSize: '14px',
                color: isActive ? '#00ff88' : '#666666',
                backgroundColor: isActive ? '#2a3a2a' : 'transparent',
                padding: { x: 8, y: 4 }
            });
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this.klinePeriod = period.value;
                this.showStockDetail(stock.code);
            });
            this.detailContainer.add(btn);
        });

        // 绘制K线
        this.klineGraphics = this.add.graphics();
        this.detailContainer.add(this.klineGraphics);

        const klineData = stockMarket.getKLineData(stock.code, this.klinePeriod);
        this.drawKLines(klineData, 420, 240, 440, 320);
    }

    /** 绘制K线 */
    private drawKLines(data: KLineData[], startX: number, startY: number, width: number, height: number): void {
        if (data.length === 0) return;

        this.klineGraphics.clear();

        // 计算价格范围
        let minPrice = Math.min(...data.map(d => d.low));
        let maxPrice = Math.max(...data.map(d => d.high));
        const priceRange = maxPrice - minPrice || 1;
        minPrice -= priceRange * 0.05;
        maxPrice += priceRange * 0.05;
        const adjustedRange = maxPrice - minPrice;

        // 绘制网格线
        this.klineGraphics.lineStyle(1, 0x333333, 0.5);
        for (let i = 0; i <= 4; i++) {
            const y = startY + (height / 4) * i;
            this.klineGraphics.moveTo(startX, y);
            this.klineGraphics.lineTo(startX + width, y);

            // 价格标签
            const price = maxPrice - (adjustedRange / 4) * i;
            const priceLabel = this.add.text(startX + width + 5, y, price.toFixed(2), {
                fontSize: '10px',
                color: '#666666'
            });
            priceLabel.setOrigin(0, 0.5);
            this.detailContainer.add(priceLabel);
        }

        // 绘制K线
        const displayCount = Math.min(data.length, 60);
        const candleWidth = width / displayCount * 0.7;
        const candleGap = width / displayCount;

        for (let i = 0; i < displayCount; i++) {
            const d = data[data.length - displayCount + i];
            const x = startX + i * candleGap + candleGap / 2;

            const openY = startY + ((maxPrice - d.open) / adjustedRange) * height;
            const closeY = startY + ((maxPrice - d.close) / adjustedRange) * height;
            const highY = startY + ((maxPrice - d.high) / adjustedRange) * height;
            const lowY = startY + ((maxPrice - d.low) / adjustedRange) * height;

            const isUp = d.close >= d.open;
            const color = isUp ? 0xff4444 : 0x00ff88;

            // 上下影线
            this.klineGraphics.lineStyle(1, color, 1);
            this.klineGraphics.moveTo(x, highY);
            this.klineGraphics.lineTo(x, lowY);
            this.klineGraphics.strokePath();

            // K线实体
            this.klineGraphics.fillStyle(color, 1);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(openY - closeY), 1);
            this.klineGraphics.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        }
    }

    /** 绘制盘口 */
    private drawOrderBook(stock: Stock): void {
        const orderBook = stockMarket.getOrderBook(stock.code);

        // 盘口背景
        const bookBg = this.add.rectangle(1050, 230, 250, 300, 0x2a2a3a);
        this.detailContainer.add(bookBg);

        const title = this.add.text(940, 95, '五档盘口', {
            fontSize: '14px',
            color: '#888888'
        });
        this.detailContainer.add(title);

        // 卖盘（从高到低显示，即卖5到卖1）
        const reversedAsks = [...orderBook.asks].reverse();
        reversedAsks.forEach((ask, index) => {
            const y = 120 + index * 28;

            const label = this.add.text(940, y, `卖${5 - index}`, {
                fontSize: '12px',
                color: '#888888'
            });
            this.detailContainer.add(label);

            const price = this.add.text(1000, y, ask.price.toFixed(2), {
                fontSize: '12px',
                color: '#00ff88'
            });
            this.detailContainer.add(price);

            const volume = this.add.text(1100, y, ask.volume.toString(), {
                fontSize: '12px',
                color: '#888888'
            });
            this.detailContainer.add(volume);
        });

        // 分隔线
        const divider = this.add.rectangle(1050, 262, 220, 2, 0x444444);
        this.detailContainer.add(divider);

        // 当前价
        const currentPrice = this.add.text(1050, 280, stock.price.toFixed(2), {
            fontSize: '16px',
            color: stock.changePercent >= 0 ? '#ff4444' : '#00ff88',
            fontStyle: 'bold'
        });
        currentPrice.setOrigin(0.5, 0.5);
        this.detailContainer.add(currentPrice);

        // 买盘
        orderBook.bids.forEach((bid, index) => {
            const y = 305 + index * 28;

            const label = this.add.text(940, y, `买${index + 1}`, {
                fontSize: '12px',
                color: '#888888'
            });
            this.detailContainer.add(label);

            const price = this.add.text(1000, y, bid.price.toFixed(2), {
                fontSize: '12px',
                color: '#ff4444'
            });
            this.detailContainer.add(price);

            const volume = this.add.text(1100, y, bid.volume.toString(), {
                fontSize: '12px',
                color: '#888888'
            });
            this.detailContainer.add(volume);
        });
    }

    /** 绘制交易面板 */
    private drawTradePanel(stock: Stock): void {
        const account = gameState.getAccount();
        const position = gameState.getPosition(stock.code);

        // 交易面板背景
        const tradeBg = this.add.rectangle(1050, 530, 250, 220, 0x2a2a3a);
        this.detailContainer.add(tradeBg);

        // 委托价格
        const priceLabel = this.add.text(940, 440, '委托价格:', {
            fontSize: '12px',
            color: '#888888'
        });
        this.detailContainer.add(priceLabel);

        // 价格调整按钮
        const priceDown = this.add.text(940, 465, '-', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 2 }
        });
        priceDown.setInteractive({ useHandCursor: true });
        priceDown.on('pointerdown', () => {
            this.tradePrice = Math.max(stock.limitDown, parseFloat((this.tradePrice - 0.01).toFixed(2)));
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add(priceDown);

        const priceDisplay = this.add.text(1050, 465, this.tradePrice.toFixed(2), {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 5 }
        });
        priceDisplay.setOrigin(0.5, 0);
        this.detailContainer.add(priceDisplay);

        const priceUp = this.add.text(1130, 465, '+', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 2 }
        });
        priceUp.setInteractive({ useHandCursor: true });
        priceUp.on('pointerdown', () => {
            this.tradePrice = Math.min(stock.limitUp, parseFloat((this.tradePrice + 0.01).toFixed(2)));
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add(priceUp);

        // 委托数量
        const quantityLabel = this.add.text(940, 500, '委托数量:', {
            fontSize: '12px',
            color: '#888888'
        });
        this.detailContainer.add(quantityLabel);

        const quantityDown = this.add.text(940, 525, '-', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 2 }
        });
        quantityDown.setInteractive({ useHandCursor: true });
        quantityDown.on('pointerdown', () => {
            this.tradeQuantity = Math.max(100, this.tradeQuantity - 100);
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add(quantityDown);

        const quantityDisplay = this.add.text(1050, 525, this.tradeQuantity.toString(), {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 5 }
        });
        quantityDisplay.setOrigin(0.5, 0);
        this.detailContainer.add(quantityDisplay);

        const quantityUp = this.add.text(1130, 525, '+', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 2 }
        });
        quantityUp.setInteractive({ useHandCursor: true });
        quantityUp.on('pointerdown', () => {
            this.tradeQuantity += 100;
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add(quantityUp);

        // 快捷数量按钮
        const quickAmounts = [100, 500, 1000, '全仓'];
        quickAmounts.forEach((amount, index) => {
            const x = 950 + index * 55;
            const btn = this.add.text(x, 560, amount.toString(), {
                fontSize: '11px',
                color: '#888888',
                backgroundColor: '#333333',
                padding: { x: 5, y: 3 }
            });
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                if (amount === '全仓') {
                    this.tradeQuantity = Math.floor(account.cash / this.tradePrice / 100) * 100;
                } else {
                    this.tradeQuantity = amount as number;
                }
                this.showStockDetail(stock.code);
            });
            this.detailContainer.add(btn);
        });

        // 预估金额
        const estimatedCost = this.tradePrice * this.tradeQuantity;
        const estimatedText = this.add.text(1050, 595, `预估金额: ¥${estimatedCost.toFixed(2)}`, {
            fontSize: '12px',
            color: '#888888'
        });
        estimatedText.setOrigin(0.5, 0);
        this.detailContainer.add(estimatedText);

        // 可用/可卖
        const availableText = this.add.text(940, 615, `可用: ¥${account.cash.toFixed(2)}`, {
            fontSize: '11px',
            color: '#666666'
        });
        this.detailContainer.add(availableText);

        const sellableText = this.add.text(1100, 615, `可卖: ${position?.quantity || 0}股`, {
            fontSize: '11px',
            color: '#666666'
        });
        this.detailContainer.add(sellableText);

        // 买入/卖出按钮
        const buyBtn = this.add.rectangle(990, 660, 100, 40, 0xaa2222);
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerover', () => buyBtn.setFillStyle(0xcc3333));
        buyBtn.on('pointerout', () => buyBtn.setFillStyle(0xaa2222));
        buyBtn.on('pointerdown', () => this.executeBuy(stock));
        this.detailContainer.add(buyBtn);

        const buyText = this.add.text(990, 660, '买入', {
            fontSize: '16px',
            color: '#ffffff'
        });
        buyText.setOrigin(0.5, 0.5);
        this.detailContainer.add(buyText);

        const sellBtn = this.add.rectangle(1110, 660, 100, 40, 0x22aa22);
        sellBtn.setInteractive({ useHandCursor: true });
        sellBtn.on('pointerover', () => sellBtn.setFillStyle(0x33cc33));
        sellBtn.on('pointerout', () => sellBtn.setFillStyle(0x22aa22));
        sellBtn.on('pointerdown', () => this.executeSell(stock));
        this.detailContainer.add(sellBtn);

        const sellText = this.add.text(1110, 660, '卖出', {
            fontSize: '16px',
            color: '#ffffff'
        });
        sellText.setOrigin(0.5, 0.5);
        this.detailContainer.add(sellText);
    }

    /** 显示持仓 */
    showPositions(): void {
        this.currentView = 'position';
        this.stockListContainer.setVisible(false);
        this.detailContainer.setVisible(false);
        this.positionContainer.setVisible(true);
        this.positionContainer.removeAll(true);
        this.drawHeader();

        const positions = gameState.getPositions();
        const account = gameState.getAccount();

        // 账户汇总
        const summaryBg = this.add.rectangle(640, 140, 1200, 100, 0x2a2a3a);
        this.positionContainer.add(summaryBg);

        const summaryItems = [
            { label: '总资产', value: `¥${account.totalAssets.toFixed(2)}`, color: '#ffffff' },
            { label: '股票市值', value: `¥${account.stockValue.toFixed(2)}`, color: '#ffffff' },
            { label: '可用资金', value: `¥${account.cash.toFixed(2)}`, color: '#00ff88' },
            { label: '今日盈亏', value: `${account.todayProfit >= 0 ? '+' : ''}¥${account.todayProfit.toFixed(2)}`, color: account.todayProfit >= 0 ? '#ff4444' : '#00ff88' },
            { label: '累计盈亏', value: `${account.totalProfit >= 0 ? '+' : ''}¥${account.totalProfit.toFixed(2)}`, color: account.totalProfit >= 0 ? '#ff4444' : '#00ff88' },
        ];

        summaryItems.forEach((item, index) => {
            const x = 100 + index * 230;

            const label = this.add.text(x, 115, item.label, {
                fontSize: '12px',
                color: '#888888'
            });
            this.positionContainer.add(label);

            const value = this.add.text(x, 140, item.value, {
                fontSize: '18px',
                color: item.color,
                fontStyle: 'bold'
            });
            this.positionContainer.add(value);
        });

        // 持仓列表头
        if (positions.length > 0) {
            const headers = ['股票', '持仓', '成本价', '现价', '市值', '盈亏', '盈亏率', '操作'];
            const headerX = [50, 180, 280, 380, 480, 600, 720, 850];

            headers.forEach((header, index) => {
                const text = this.add.text(headerX[index], 210, header, {
                    fontSize: '12px',
                    color: '#888888'
                });
                this.positionContainer.add(text);
            });

            // 持仓列表
            positions.forEach((pos, index) => {
                // 更新当前价格
                const stock = stockMarket.getStock(pos.code);
                if (stock) {
                    gameState.updatePositionPrice(pos.code, stock.price);
                }

                const y = 250 + index * 45;
                const profitColor = pos.profit >= 0 ? '#ff4444' : '#00ff88';

                const rowBg = this.add.rectangle(640, y, 1200, 40, index % 2 === 0 ? 0x252535 : 0x2a2a3a);
                rowBg.setInteractive({ useHandCursor: true });
                rowBg.on('pointerdown', () => this.showStockDetail(pos.code));
                this.positionContainer.add(rowBg);

                // 股票名称
                const nameText = this.add.text(50, y, `${pos.name}\n${pos.code}`, {
                    fontSize: '12px',
                    color: '#ffffff',
                    lineSpacing: 2
                });
                nameText.setOrigin(0, 0.5);
                this.positionContainer.add(nameText);

                // 持仓数量
                const quantityText = this.add.text(180, y, pos.quantity.toString(), {
                    fontSize: '14px',
                    color: '#ffffff'
                });
                quantityText.setOrigin(0, 0.5);
                this.positionContainer.add(quantityText);

                // 成本价
                const costText = this.add.text(280, y, pos.costPrice.toFixed(2), {
                    fontSize: '14px',
                    color: '#ffffff'
                });
                costText.setOrigin(0, 0.5);
                this.positionContainer.add(costText);

                // 现价
                const currentText = this.add.text(380, y, pos.currentPrice.toFixed(2), {
                    fontSize: '14px',
                    color: profitColor
                });
                currentText.setOrigin(0, 0.5);
                this.positionContainer.add(currentText);

                // 市值
                const marketValue = pos.currentPrice * pos.quantity;
                const valueText = this.add.text(480, y, `¥${marketValue.toFixed(2)}`, {
                    fontSize: '14px',
                    color: '#ffffff'
                });
                valueText.setOrigin(0, 0.5);
                this.positionContainer.add(valueText);

                // 盈亏
                const profitText = this.add.text(600, y, `${pos.profit >= 0 ? '+' : ''}¥${pos.profit.toFixed(2)}`, {
                    fontSize: '14px',
                    color: profitColor
                });
                profitText.setOrigin(0, 0.5);
                this.positionContainer.add(profitText);

                // 盈亏率
                const rateText = this.add.text(720, y, `${pos.profitRate >= 0 ? '+' : ''}${(pos.profitRate * 100).toFixed(2)}%`, {
                    fontSize: '14px',
                    color: profitColor
                });
                rateText.setOrigin(0, 0.5);
                this.positionContainer.add(rateText);

                // 操作按钮
                const sellBtn = this.add.text(850, y, '卖出', {
                    fontSize: '12px',
                    color: '#00ff88',
                    backgroundColor: '#223322',
                    padding: { x: 10, y: 5 }
                });
                sellBtn.setOrigin(0, 0.5);
                sellBtn.setInteractive({ useHandCursor: true });
                sellBtn.on('pointerdown', (e: Phaser.Input.Pointer) => {
                    e.event.stopPropagation();
                    this.tradeQuantity = pos.quantity;
                    this.showStockDetail(pos.code);
                });
                this.positionContainer.add(sellBtn);
            });
        } else {
            const emptyText = this.add.text(640, 350, '暂无持仓\n\n去行情页面买入股票吧~', {
                fontSize: '18px',
                color: '#666666',
                align: 'center'
            });
            emptyText.setOrigin(0.5, 0.5);
            this.positionContainer.add(emptyText);
        }
    }

    /** 执行买入 */
    private executeBuy(stock: Stock): void {
        if (this.tradeQuantity <= 0) {
            this.showToast('请输入买入数量');
            return;
        }

        const result = gameState.buyStock(
            stock.code,
            stock.name,
            this.tradePrice,
            this.tradeQuantity
        );

        this.showToast(result.message, result.success);
        if (result.success) {
            this.showStockDetail(stock.code);
        }
    }

    /** 执行卖出 */
    private executeSell(stock: Stock): void {
        if (this.tradeQuantity <= 0) {
            this.showToast('请输入卖出数量');
            return;
        }

        const result = gameState.sellStock(
            stock.code,
            this.tradePrice,
            this.tradeQuantity
        );

        this.showToast(result.message, result.success);
        if (result.success) {
            this.showStockDetail(stock.code);
        }
    }

    /** 显示提示 */
    private showToast(message: string, success: boolean = true): void {
        const toast = this.add.text(640, 650, message, {
            fontSize: '16px',
            color: success ? '#00ff88' : '#ff4444',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        toast.setOrigin(0.5, 0.5);
        toast.setDepth(10000);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: 600,
            duration: 2000,
            onComplete: () => toast.destroy()
        });
    }

    /** 行情更新回调 */
    private onMarketUpdate(stocks: Stock[]): void {
        // 更新持仓价格
        const positions = gameState.getPositions();
        positions.forEach(pos => {
            const stock = stocks.find(s => s.code === pos.code);
            if (stock) {
                gameState.updatePositionPrice(pos.code, stock.price);
            }
        });
    }

    /** 刷新当前视图 */
    private refreshCurrentView(): void {
        if (this.currentView === 'list') {
            this.showStockList();
        } else if (this.currentView === 'detail' && this.selectedStock) {
            // 更新选中股票
            this.selectedStock = stockMarket.getStock(this.selectedStock.code) || null;
            if (this.selectedStock) {
                this.showStockDetail(this.selectedStock.code);
            }
        } else if (this.currentView === 'position') {
            this.showPositions();
        }
    }

    /** 返回 */
    private goBack(): void {
        if (this.currentView === 'detail') {
            this.showStockList();
        } else {
            stockMarket.stopMarket();
            this.scene.stop();
            this.scene.resume('PhoneScene');
        }
    }

    /** 格式化成交量 */
    private formatVolume(volume: number): string {
        if (volume >= 10000) {
            return (volume / 10000).toFixed(2) + '万';
        }
        return volume.toString();
    }

    /** 格式化成交额 */
    private formatAmount(amount: number): string {
        if (amount >= 100000000) {
            return (amount / 100000000).toFixed(2) + '亿';
        }
        if (amount >= 10000) {
            return (amount / 10000).toFixed(2) + '万';
        }
        return amount.toFixed(2);
    }
}
