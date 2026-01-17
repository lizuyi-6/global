import Phaser from 'phaser';
import { gameState } from '../GameState';
import type { KLineData, Stock } from '../StockMarket';
import { stockMarket } from '../StockMarket';
import { COLORS, FONTS, applyGlassEffect, createStyledButton } from '../UIConfig';

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
        // 背景 - 最高层级确保覆盖底层场景
        const bg = this.add.rectangle(640, 360, 1280, 720, COLORS.bg);
        bg.setDepth(60000);

        // 背景装饰
        const deco = this.add.graphics();
        deco.setDepth(60001);
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
        const headerContainer = this.add.container(640, 60);
        headerContainer.setDepth(60100);
        const titleText = this.add.text(0, -15, '📈 股票交易所', {
            fontSize: '36px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 25, 'STOCK MARKET / WEALTH ACCUMULATION STRATEGY', {
            fontSize: '12px',
            fontFamily: FONTS.mono,
            color: '#4a90d9',
            letterSpacing: 2
        }).setOrigin(0.5);
        headerContainer.add([titleText, subTitleText]);

        // 创建容器 - 都设置高深度
        this.headerContainer = this.add.container(0, 50);
        this.headerContainer.setDepth(60200);
        this.stockListContainer = this.add.container(0, 0);
        this.stockListContainer.setDepth(60150);
        this.detailContainer = this.add.container(0, 0);
        this.detailContainer.setDepth(60150);
        this.positionContainer = this.add.container(0, 0);
        this.positionContainer.setDepth(60150);

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

        // 背景 (磨砂玻璃)
        const bg = this.add.rectangle(640, 40, 1280, 80, COLORS.panel, 0.9);
        bg.setStrokeStyle(1, COLORS.primary, 0.2);
        applyGlassEffect(bg, 0.9);
        this.headerContainer.add(bg);

        // 返回按钮
        const backBtn = this.add.text(40, 40, '← BACK / 返回', {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#888888'));
        backBtn.on('pointerdown', () => this.goBack());
        this.headerContainer.add(backBtn);

        // 标题
        const title = this.add.text(640, 30, 'STOCK EXCHANGE / 股票交易所', {
            fontSize: '20px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 2
        }).setOrigin(0.5, 0.5);
        this.headerContainer.add(title);

        // 账户信息
        const account = gameState.getAccount();
        const accountBox = this.add.container(1100, 40);
        this.headerContainer.add(accountBox);

        const cashLabel = this.add.text(0, -10, 'AVAILABLE CASH', {
            fontSize: '10px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5);
        const cashValue = this.add.text(0, 10, `¥${account.cash.toLocaleString()}`, {
            fontSize: '18px',
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        accountBox.add([cashLabel, cashValue]);

        // 导航标签
        const tabs = [
            { name: 'MARKET 行情', view: 'list' as const, x: 300 },
            { name: 'POSITION 持仓', view: 'position' as const, x: 450 },
        ];

        tabs.forEach((tab) => {
            const isActive = this.currentView === tab.view || (this.currentView === 'detail' && tab.view === 'list');

            const tabBtn = this.add.text(tab.x, 40, tab.name, {
                fontSize: '14px',
                fontFamily: FONTS.main,
                color: isActive ? '#ffffff' : '#666666',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5, 0.5);

            if (isActive) {
                const indicator = this.add.rectangle(tab.x, 65, 40, 2, COLORS.primary);
                this.headerContainer.add(indicator);
            }

            tabBtn.setInteractive({ useHandCursor: true });
            tabBtn.on('pointerover', () => !isActive && tabBtn.setColor('#aaaaaa'));
            tabBtn.on('pointerout', () => !isActive && tabBtn.setColor('#666666'));
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

        // 列表背景 (磨砂卡片)
        const listBg = this.add.rectangle(640, 400, 1200, 560, COLORS.panel, 0.4);
        applyGlassEffect(listBg, 0.4);
        this.stockListContainer.add(listBg);

        // 列表头
        const headers = [
            { label: 'SYMBOL 代码', x: 80 },
            { label: 'NAME 名称', x: 200 },
            { label: 'LAST 最新', x: 350 },
            { label: 'CHG 涨跌幅', x: 500 },
            { label: 'AMOUNT 涨跌额', x: 650 },
            { label: 'VOL 成交量', x: 800 },
            { label: 'ACTION 操作', x: 1000 }
        ];

        headers.forEach((h) => {
            const text = this.add.text(h.x, 140, h.label, {
                fontSize: '11px',
                fontFamily: FONTS.mono,
                color: '#666666'
            });
            this.stockListContainer.add(text);
        });

        // 股票列表
        const stocks = stockMarket.getAllStocks();
        stocks.forEach((stock, index) => {
            this.drawStockRow(stock, index, 180 + index * 45);
        });
    }

    private drawStockRow(stock: Stock, index: number, y: number): void {
        const rowContainer = this.add.container(0, 0);
        this.stockListContainer.add(rowContainer);

        const rowBg = this.add.rectangle(640, y, 1160, 38, 0xffffff, index % 2 === 0 ? 0.02 : 0);
        rowBg.setInteractive({ useHandCursor: true });

        rowBg.on('pointerover', () => rowBg.setFillStyle(0xffffff, 0.05));
        rowBg.on('pointerout', () => rowBg.setFillStyle(0xffffff, index % 2 === 0 ? 0.02 : 0));
        rowBg.on('pointerdown', () => this.showStockDetail(stock.code));
        rowContainer.add(rowBg);

        const changeColor = stock.changePercent > 0 ? '#ff4444' : stock.changePercent < 0 ? '#00ff88' : '#ffffff';

        // 代码
        rowContainer.add(this.add.text(80, y, stock.code, {
            fontSize: '13px',
            fontFamily: FONTS.mono,
            color: '#ffffff'
        }).setOrigin(0, 0.5));

        // 名称
        rowContainer.add(this.add.text(200, y, stock.name, {
            fontSize: '14px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5));

        // 最新价
        rowContainer.add(this.add.text(350, y, stock.price.toFixed(2), {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: changeColor,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5));

        // 涨跌幅
        let changePercentStr = stock.changePercent.toFixed(2) + '%';
        if (stock.changePercent > 0) changePercentStr = '+' + changePercentStr;

        rowContainer.add(this.add.text(500, y, changePercentStr, {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: changeColor
        }).setOrigin(0, 0.5));

        // 涨跌额
        let changeStr = stock.change.toFixed(2);
        if (stock.change > 0) changeStr = '+' + changeStr;

        rowContainer.add(this.add.text(650, y, changeStr, {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: changeColor
        }).setOrigin(0, 0.5));

        // 成交量
        rowContainer.add(this.add.text(800, y, this.formatVolume(stock.volume), {
            fontSize: '13px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0, 0.5));

        // 操作按钮
        const tradeBtn = createStyledButton(this, 1040, y, 90, 26, 'TRADE', () => this.showStockDetail(stock.code));
        rowContainer.add(tradeBtn);
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

        // 信息面板 (磨砂卡片)
        const infoBg = this.add.rectangle(200, 210, 360, 220, COLORS.panel, 0.4);
        applyGlassEffect(infoBg, 0.4);
        this.detailContainer.add(infoBg);

        // 名称和代码
        const nameText = this.add.text(40, 130, `${stock.name}`, {
            fontSize: '24px',
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });
        const codeText = this.add.text(40, 165, `${stock.code}`, {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: '#888888'
        });
        this.detailContainer.add([nameText, codeText]);

        // 当前价格
        const priceText = this.add.text(40, 195, stock.price.toFixed(2), {
            fontSize: '42px',
            fontFamily: FONTS.mono,
            color: changeColor,
            fontStyle: 'bold'
        });
        this.detailContainer.add(priceText);

        // 涨跌信息
        let changeInfo = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}  ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
        if (stock.isLimitUp) changeInfo += ' [LIMIT UP]';
        if (stock.isLimitDown) changeInfo += ' [LIMIT DOWN]';

        const changeInfoText = this.add.text(40, 245, changeInfo, {
            fontSize: '14px',
            fontFamily: FONTS.mono,
            color: changeColor,
            fontStyle: 'bold'
        });
        this.detailContainer.add(changeInfoText);

        // 详细数据网格
        const details = [
            { label: 'OPEN / 今开', val: stock.open.toFixed(2) },
            { label: 'HIGH / 最高', val: stock.high.toFixed(2) },
            { label: 'PREV / 昨收', val: stock.close.toFixed(2) },
            { label: 'LOW  / 最低', val: stock.low.toFixed(2) },
            { label: 'VOL  / 成交量', val: this.formatVolume(stock.volume) },
            { label: 'VAL  / 成交额', val: this.formatAmount(stock.amount) }
        ];

        details.forEach((item, i) => {
            const x = 40 + (i % 2) * 160;
            const y = 280 + Math.floor(i / 2) * 25;

            const l = this.add.text(x, y, item.label, { fontSize: '10px', fontFamily: FONTS.mono, color: '#666666' });
            const v = this.add.text(x + 80, y, item.val, { fontSize: '10px', fontFamily: FONTS.mono, color: '#aaaaaa' });
            this.detailContainer.add([l, v]);
        });
    }

    /** 绘制K线图 */
    private drawKLineChart(stock: Stock): void {
        // K线图区域
        const chartBg = this.add.rectangle(640, 430, 480, 420, COLORS.panel, 0.2);
        chartBg.setStrokeStyle(1, 0xffffff, 0.1);
        applyGlassEffect(chartBg, 0.2);
        this.detailContainer.add(chartBg);

        // K线周期选择
        const periods: Array<{ name: string; value: 'day' | 'week' | 'month' }> = [
            { name: '1D', value: 'day' },
            { name: '1W', value: 'week' },
            { name: '1M', value: 'month' },
        ];

        periods.forEach((period, index) => {
            const x = 430 + index * 50;
            const isActive = this.klinePeriod === period.value;

            const btn = this.add.text(x, 245, period.name, {
                fontSize: '11px',
                fontFamily: FONTS.mono,
                color: isActive ? '#ffffff' : '#666666',
                backgroundColor: isActive ? COLORS.primary.toString(16) : 'transparent', // Will fix this later
                padding: { x: 6, y: 3 }
            });
            // Fix color string
            if (isActive) btn.setBackgroundColor('#4a90d9');

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
        this.drawKLines(klineData, 410, 270, 460, 320);
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

        // 盘口背景 (磨砂卡片)
        const bookBg = this.add.rectangle(1050, 280, 240, 360, COLORS.panel, 0.4);
        applyGlassEffect(bookBg, 0.4);
        this.detailContainer.add(bookBg);

        const title = this.add.text(940, 115, 'ORDER BOOK / 五档盘口', {
            fontSize: '10px',
            fontFamily: FONTS.mono,
            color: '#666666'
        });
        this.detailContainer.add(title);

        // 卖盘
        const reversedAsks = [...orderBook.asks].reverse();
        reversedAsks.forEach((ask, index) => {
            const y = 145 + index * 26;

            const label = this.add.text(940, y, `ASK${5 - index}`, { fontSize: '10px', fontFamily: FONTS.mono, color: '#888888' });
            const price = this.add.text(1000, y, ask.price.toFixed(2), { fontSize: '12px', fontFamily: FONTS.mono, color: '#00ff88' });
            const volume = this.add.text(1110, y, ask.volume.toString(), { fontSize: '11px', fontFamily: FONTS.mono, color: '#666666' }).setOrigin(1, 0);
            this.detailContainer.add([label, price, volume]);
        });

        // 当前价
        const divider = this.add.rectangle(1050, 280, 210, 1, 0xffffff, 0.1);
        const currentPrice = this.add.text(1050, 280, stock.price.toFixed(2), {
            fontSize: '18px',
            fontFamily: FONTS.mono,
            color: stock.changePercent >= 0 ? '#ff4444' : '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);
        this.detailContainer.add([divider, currentPrice]);

        // 买盘
        orderBook.bids.forEach((bid, index) => {
            const y = 315 + index * 26;

            const label = this.add.text(940, y, `BID${index + 1}`, { fontSize: '10px', fontFamily: FONTS.mono, color: '#888888' });
            const price = this.add.text(1000, y, bid.price.toFixed(2), { fontSize: '12px', fontFamily: FONTS.mono, color: '#ff4444' });
            const volume = this.add.text(1110, y, bid.volume.toString(), { fontSize: '11px', fontFamily: FONTS.mono, color: '#666666' }).setOrigin(1, 0);
            this.detailContainer.add([label, price, volume]);
        });
    }

    /** 绘制交易面板 */
    private drawTradePanel(stock: Stock): void {
        const account = gameState.getAccount();
        const position = gameState.getPosition(stock.code);

        // 交易面板背景 (磨砂卡片)
        const tradeBg = this.add.rectangle(1050, 580, 240, 220, COLORS.panel, 0.4);
        applyGlassEffect(tradeBg, 0.4);
        this.detailContainer.add(tradeBg);

        // 委托价格
        const priceLabel = this.add.text(940, 480, 'PRICE / 价格', { fontSize: '10px', fontFamily: FONTS.mono, color: '#666666' });
        this.detailContainer.add(priceLabel);

        const priceDown = this.add.text(940, 500, '-', { fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 2 } }).setInteractive({ useHandCursor: true });
        priceDown.on('pointerdown', () => {
            this.tradePrice = Math.max(stock.limitDown, parseFloat((this.tradePrice - 0.01).toFixed(2)));
            this.showStockDetail(stock.code);
        });

        const priceDisplay = this.add.text(1050, 500, this.tradePrice.toFixed(2), { fontSize: '16px', fontFamily: FONTS.mono, color: '#ffffff', backgroundColor: '#000000', padding: { x: 20, y: 5 } }).setOrigin(0.5, 0);

        const priceUp = this.add.text(1130, 500, '+', { fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 2 } }).setInteractive({ useHandCursor: true });
        priceUp.on('pointerdown', () => {
            this.tradePrice = Math.min(stock.limitUp, parseFloat((this.tradePrice + 0.01).toFixed(2)));
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add([priceDown, priceDisplay, priceUp]);

        // 委托数量
        const quantityLabel = this.add.text(940, 540, 'QUANTITY / 数量', { fontSize: '10px', fontFamily: FONTS.mono, color: '#666666' });
        this.detailContainer.add(quantityLabel);

        const quantityDown = this.add.text(940, 560, '-', { fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 2 } }).setInteractive({ useHandCursor: true });
        quantityDown.on('pointerdown', () => {
            this.tradeQuantity = Math.max(100, this.tradeQuantity - 100);
            this.showStockDetail(stock.code);
        });

        const quantityDisplay = this.add.text(1050, 560, this.tradeQuantity.toString(), { fontSize: '16px', fontFamily: FONTS.mono, color: '#ffffff', backgroundColor: '#000000', padding: { x: 20, y: 5 } }).setOrigin(0.5, 0);

        const quantityUp = this.add.text(1130, 560, '+', { fontSize: '20px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 2 } }).setInteractive({ useHandCursor: true });
        quantityUp.on('pointerdown', () => {
            this.tradeQuantity += 100;
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add([quantityDown, quantityDisplay, quantityUp]);

        // 快捷数量按钮
        const quickAmounts = [100, 500, 1000, 'MAX'];
        quickAmounts.forEach((amount, index) => {
            const x = 945 + index * 52;
            const btn = this.add.text(x, 605, amount.toString(), { fontSize: '10px', fontFamily: FONTS.mono, color: '#888888', backgroundColor: '#222222', padding: { x: 5, y: 3 } }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                if (amount === 'MAX') this.tradeQuantity = Math.floor(account.cash / this.tradePrice / 100) * 100;
                else this.tradeQuantity = amount as number;
                this.showStockDetail(stock.code);
            });
            this.detailContainer.add(btn);
        });

        // 预估金额
        const estimatedCost = this.tradePrice * this.tradeQuantity;
        const estimatedText = this.add.text(1050, 635, `ESTIMATED: ¥${estimatedCost.toLocaleString()}`, { fontSize: '11px', fontFamily: FONTS.mono, color: '#aaaaaa' }).setOrigin(0.5, 0);
        this.detailContainer.add(estimatedText);

        // 买入/卖出按钮
        const buyBtn = createStyledButton(this, 1000, 675, 90, 36, 'BUY', () => this.executeBuy(stock));
        const sellBtn = createStyledButton(this, 1100, 675, 90, 36, 'SELL', () => this.executeSell(stock));
        this.detailContainer.add([buyBtn, sellBtn]);
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

        // 账户汇总 (磨砂卡片)
        const summaryBg = this.add.rectangle(640, 160, 1200, 120, COLORS.panel, 0.4);
        applyGlassEffect(summaryBg, 0.4);
        this.positionContainer.add(summaryBg);

        const summaryItems = [
            { label: 'TOTAL ASSETS / 总资产', value: `¥${account.totalAssets.toLocaleString()}`, color: '#ffffff' },
            { label: 'MARKET VALUE / 市值', value: `¥${account.stockValue.toLocaleString()}`, color: '#ffffff' },
            { label: 'CASH / 可用资金', value: `¥${account.cash.toLocaleString()}`, color: '#00ff88' },
            { label: 'TODAY P&L / 今日盈亏', value: `${account.todayProfit >= 0 ? '+' : ''}¥${account.todayProfit.toLocaleString()}`, color: account.todayProfit >= 0 ? '#ff4444' : '#00ff88' },
            { label: 'TOTAL P&L / 累计盈亏', value: `${account.totalProfit >= 0 ? '+' : ''}¥${account.totalProfit.toLocaleString()}`, color: account.totalProfit >= 0 ? '#ff4444' : '#00ff88' },
        ];

        summaryItems.forEach((item, index) => {
            const x = 110 + index * 230;

            const label = this.add.text(x, 130, item.label, {
                fontSize: '10px',
                fontFamily: FONTS.mono,
                color: '#666666'
            });
            this.positionContainer.add(label);

            const value = this.add.text(x, 160, item.value, {
                fontSize: '20px',
                fontFamily: FONTS.mono,
                color: item.color,
                fontStyle: 'bold'
            });
            this.positionContainer.add(value);
        });

        // 持仓列表头
        if (positions.length > 0) {
            const headers = [
                { label: 'SYMBOL 股票', x: 80 },
                { label: 'QTY 持仓', x: 220 },
                { label: 'COST 成本', x: 340 },
                { label: 'LAST 现价', x: 460 },
                { label: 'MKT VAL 市值', x: 580 },
                { label: 'P&L 盈亏', x: 720 },
                { label: 'P&L% 盈亏率', x: 860 },
                { label: 'ACTION 操作', x: 1040 }
            ];

            headers.forEach((h) => {
                const text = this.add.text(h.x, 240, h.label, {
                    fontSize: '11px',
                    fontFamily: FONTS.mono,
                    color: '#666666'
                });
                this.positionContainer.add(text);
            });

            // 持仓列表
            positions.forEach((pos, index) => {
                const stock = stockMarket.getStock(pos.code);
                if (stock) gameState.updatePositionPrice(pos.code, stock.price);

                const y = 290 + index * 50;
                const profitColor = pos.profit >= 0 ? '#ff4444' : '#00ff88';

                const rowContainer = this.add.container(0, 0);
                this.positionContainer.add(rowContainer);

                const rowBg = this.add.rectangle(640, y, 1160, 44, 0xffffff, index % 2 === 0 ? 0.02 : 0);
                rowBg.setInteractive({ useHandCursor: true });
                rowBg.on('pointerdown', () => this.showStockDetail(pos.code));
                rowContainer.add(rowBg);

                // 股票
                rowContainer.add(this.add.text(80, y, `${pos.name}\n${pos.code}`, { fontSize: '12px', fontFamily: FONTS.main, color: '#ffffff', lineSpacing: 4 }).setOrigin(0, 0.5));

                // 数量
                rowContainer.add(this.add.text(220, y, pos.quantity.toString(), { fontSize: '14px', fontFamily: FONTS.mono, color: '#ffffff' }).setOrigin(0, 0.5));

                // 价格
                rowContainer.add(this.add.text(340, y, pos.costPrice.toFixed(2), { fontSize: '14px', fontFamily: FONTS.mono, color: '#ffffff' }).setOrigin(0, 0.5));
                rowContainer.add(this.add.text(460, y, pos.currentPrice.toFixed(2), { fontSize: '14px', fontFamily: FONTS.mono, color: profitColor }).setOrigin(0, 0.5));

                // 市值
                const mktVal = pos.currentPrice * pos.quantity;
                rowContainer.add(this.add.text(580, y, `¥${mktVal.toLocaleString()}`, { fontSize: '14px', fontFamily: FONTS.mono, color: '#ffffff' }).setOrigin(0, 0.5));

                // 盈亏
                rowContainer.add(this.add.text(720, y, `${pos.profit >= 0 ? '+' : ''}¥${pos.profit.toFixed(2)}`, { fontSize: '14px', fontFamily: FONTS.mono, color: profitColor }).setOrigin(0, 0.5));
                rowContainer.add(this.add.text(860, y, `${pos.profitRate >= 0 ? '+' : ''}${(pos.profitRate * 100).toFixed(2)}%`, { fontSize: '14px', fontFamily: FONTS.mono, color: profitColor }).setOrigin(0, 0.5));

                // 操作按钮
                const sellBtn = createStyledButton(this, 1080, y, 80, 26, 'SELL', () => {
                    this.tradeQuantity = pos.quantity;
                    this.showStockDetail(pos.code);
                });
                rowContainer.add(sellBtn);
            });
        } else {
            const emptyText = this.add.text(640, 450, 'NO POSITIONS FOUND\n\n数据为空，请前往行情页面进行交易。', {
                fontSize: '14px',
                fontFamily: FONTS.mono,
                color: '#444444',
                align: 'center'
            }).setOrigin(0.5);
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
