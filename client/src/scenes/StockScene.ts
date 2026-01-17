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
        // 背景 - (1280, 720) center, 2560x1440
        const bg = this.add.rectangle(1280, 720, 2560, 1440, COLORS.bg);
        bg.setDepth(60000);

        // 背景装饰 - Loop to 2560/1440
        const deco = this.add.graphics();
        deco.setDepth(60001);
        deco.lineStyle(2, COLORS.primary, 0.1);
        for (let i = 0; i < 2560; i += 80) { // Increased step to 80
            deco.moveTo(i, 0);
            deco.lineTo(i, 1440);
        }
        for (let i = 0; i < 1440; i += 80) {
            deco.moveTo(0, i);
            deco.lineTo(2560, i);
        }
        deco.strokePath();

        // 标题容器 - Y=120
        const headerContainer = this.add.container(1280, 120);
        headerContainer.setDepth(60100);
        const titleText = this.add.text(0, -30, '📈 股票交易所', {
            fontSize: '72px', // 36 -> 72
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const subTitleText = this.add.text(0, 50, 'STOCK MARKET / WEALTH ACCUMULATION STRATEGY', {
            fontSize: '24px', // 12 -> 24
            fontFamily: FONTS.mono,
            color: '#6366f1',
            letterSpacing: 4 // 2 -> 4
        }).setOrigin(0.5);
        headerContainer.add([titleText, subTitleText]);

        // 创建容器 - 2x Depth
        this.headerContainer = this.add.container(0, 100); // y=50 -> 100
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

        // 背景 (磨砂玻璃) - 2560 width, x=1280 center
        const bg = this.add.rectangle(1280, 80, 2560, 160, COLORS.panel, 0.9);
        bg.setStrokeStyle(2, COLORS.primary, 0.2);
        applyGlassEffect(bg, 0.9);
        this.headerContainer.add(bg);

        // 返回按钮
        const backBtn = this.add.text(80, 80, '← BACK / 返回', {
            fontSize: '28px', // 14 -> 28
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#888888'));
        backBtn.on('pointerdown', () => this.goBack());
        this.headerContainer.add(backBtn);

        // 标题
        const title = this.add.text(1280, 60, 'STOCK EXCHANGE / 股票交易所', {
            fontSize: '40px', // 20 -> 40
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 4
        }).setOrigin(0.5, 0.5);
        this.headerContainer.add(title);

        // 账户信息
        const account = gameState.getAccount();
        const accountBox = this.add.container(2200, 80); // 1100 -> 2200
        this.headerContainer.add(accountBox);

        const cashLabel = this.add.text(0, -20, 'AVAILABLE CASH', {
            fontSize: '20px', // 10 -> 20
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0.5);
        const cashValue = this.add.text(0, 20, `¥${account.cash.toLocaleString()}`, {
            fontSize: '36px', // 18 -> 36
            fontFamily: FONTS.mono,
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        accountBox.add([cashLabel, cashValue]);

        // 导航标签
        const tabs = [
            { name: 'MARKET 行情', view: 'list' as const, x: 600 }, // 300 -> 600
            { name: 'POSITION 持仓', view: 'position' as const, x: 900 }, // 450 -> 900
        ];

        tabs.forEach((tab) => {
            const isActive = this.currentView === tab.view || (this.currentView === 'detail' && tab.view === 'list');

            const tabBtn = this.add.text(tab.x, 80, tab.name, {
                fontSize: '28px', // 14 -> 28
                fontFamily: FONTS.main,
                color: isActive ? '#ffffff' : '#666666',
                fontStyle: isActive ? 'bold' : 'normal'
            }).setOrigin(0.5, 0.5);

            if (isActive) {
                const indicator = this.add.rectangle(tab.x, 130, 80, 4, COLORS.primary); // y 65->130, w 40->80
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

        // 列表背景 (磨砂卡片) - 2560 width, x=1280 center
        // y=400 -> 800 | w=1200->2400 | h=560->1120
        const listBg = this.add.rectangle(1280, 800, 2400, 1120, COLORS.panel, 0.4);
        applyGlassEffect(listBg, 0.4);
        this.stockListContainer.add(listBg);

        // 列表头 - Scaled X positions
        const headers = [
            { label: 'SYMBOL 代码', x: 160 },
            { label: 'NAME 名称', x: 400 },
            { label: 'LAST 最新', x: 700 },
            { label: 'CHG 涨跌幅', x: 1000 },
            { label: 'AMOUNT 涨跌额', x: 1300 },
            { label: 'VOL 成交量', x: 1600 },
            { label: 'ACTION 操作', x: 2000 }
        ];

        headers.forEach((h) => {
            const text = this.add.text(h.x, 280, h.label, { // y=140->280
                fontSize: '22px', // 11 -> 22
                fontFamily: FONTS.mono,
                color: '#666666'
            });
            this.stockListContainer.add(text);
        });

        // 股票列表
        const stocks = stockMarket.getAllStocks();
        stocks.forEach((stock, index) => {
            // y start 180 -> 360. Step 45 -> 90.
            this.drawStockRow(stock, index, 360 + index * 90);
        });
    }

    private drawStockRow(stock: Stock, index: number, y: number): void {
        const rowContainer = this.add.container(0, 0);
        this.stockListContainer.add(rowContainer);

        // 1280 -> 2560 width is logical width, bg slightly smaller (2320)
        const rowBg = this.add.rectangle(1280, y, 2320, 76, 0xffffff, index % 2 === 0 ? 0.02 : 0); // h 38->76
        rowBg.setInteractive({ useHandCursor: true });

        rowBg.on('pointerover', () => rowBg.setFillStyle(0xffffff, 0.05));
        rowBg.on('pointerout', () => rowBg.setFillStyle(0xffffff, index % 2 === 0 ? 0.02 : 0));
        rowBg.on('pointerdown', () => this.showStockDetail(stock.code));
        rowContainer.add(rowBg);

        const changeColor = stock.changePercent > 0 ? '#ff4444' : stock.changePercent < 0 ? '#00ff88' : '#ffffff';

        // 代码
        rowContainer.add(this.add.text(160, y, stock.code, {
            fontSize: '26px', // 13 -> 26
            fontFamily: FONTS.mono,
            color: '#ffffff'
        }).setOrigin(0, 0.5));

        // 名称
        rowContainer.add(this.add.text(400, y, stock.name, {
            fontSize: '28px', // 14 -> 28
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5));

        // 最新价
        rowContainer.add(this.add.text(700, y, stock.price.toFixed(2), {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: changeColor,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5));

        // 涨跌幅
        let changePercentStr = stock.changePercent.toFixed(2) + '%';
        if (stock.changePercent > 0) changePercentStr = '+' + changePercentStr;

        rowContainer.add(this.add.text(1000, y, changePercentStr, {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: changeColor
        }).setOrigin(0, 0.5));

        // 涨跌额
        let changeStr = stock.change.toFixed(2);
        if (stock.change > 0) changeStr = '+' + changeStr;

        rowContainer.add(this.add.text(1300, y, changeStr, {
            fontSize: '28px',
            fontFamily: FONTS.mono,
            color: changeColor
        }).setOrigin(0, 0.5));

        // 成交量
        rowContainer.add(this.add.text(1600, y, this.formatVolume(stock.volume), {
            fontSize: '26px',
            fontFamily: FONTS.mono,
            color: '#888888'
        }).setOrigin(0, 0.5));

        // 操作按钮
        // x 1000 -> 2080. w 90->180. h 26->52
        const tradeBtn = createStyledButton(this, 2080, y, 180, 52, 'TRADE', () => this.showStockDetail(stock.code));
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
        // x=200->400, y=210->420, w=360->720, h=220->440
        const infoBg = this.add.rectangle(400, 420, 720, 440, COLORS.panel, 0.4);
        applyGlassEffect(infoBg, 0.4);
        this.detailContainer.add(infoBg);

        // 名称和代码
        const nameText = this.add.text(80, 260, `${stock.name}`, {
            fontSize: '48px', // 24 -> 48
            fontFamily: FONTS.main,
            color: '#ffffff',
            fontStyle: 'bold'
        });
        const codeText = this.add.text(80, 330, `${stock.code}`, {
            fontSize: '28px', // 14 -> 28
            fontFamily: FONTS.mono,
            color: '#888888'
        });
        this.detailContainer.add([nameText, codeText]);

        // 当前价格
        const priceText = this.add.text(80, 390, stock.price.toFixed(2), {
            fontSize: '84px', // 42 -> 84
            fontFamily: FONTS.mono,
            color: changeColor,
            fontStyle: 'bold'
        });
        this.detailContainer.add(priceText);

        // 涨跌信息
        let changeInfo = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}  ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
        if (stock.isLimitUp) changeInfo += ' [LIMIT UP]';
        if (stock.isLimitDown) changeInfo += ' [LIMIT DOWN]';

        const changeInfoText = this.add.text(80, 490, changeInfo, {
            fontSize: '28px', // 14 -> 28
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
            const x = 80 + (i % 2) * 320; // 40 -> 80, 160 -> 320
            const y = 560 + Math.floor(i / 2) * 50; // 280 -> 560. 25 -> 50

            const l = this.add.text(x, y, item.label, { fontSize: '20px', fontFamily: FONTS.mono, color: '#666666' });
            const v = this.add.text(x + 160, y, item.val, { fontSize: '20px', fontFamily: FONTS.mono, color: '#aaaaaa' });
            this.detailContainer.add([l, v]);
        });
    }

    /** 绘制K线图 */
    private drawKLineChart(stock: Stock): void {
        // K线图区域
        // x=640->1280, y=430->860, w=480->960, h=420->840
        const chartBg = this.add.rectangle(1280, 860, 960, 840, COLORS.panel, 0.2);
        chartBg.setStrokeStyle(2, 0xffffff, 0.1);
        applyGlassEffect(chartBg, 0.2);
        this.detailContainer.add(chartBg);

        // K线周期选择
        const periods: Array<{ name: string; value: 'day' | 'week' | 'month' }> = [
            { name: '1D', value: 'day' },
            { name: '1W', value: 'week' },
            { name: '1M', value: 'month' },
        ];

        periods.forEach((period, index) => {
            const x = 860 + index * 100; // 430->860. Step 50->100
            const isActive = this.klinePeriod === period.value;

            const btn = this.add.text(x, 490, period.name, { // y=245->490
                fontSize: '22px', // 11 -> 22
                fontFamily: FONTS.mono,
                color: isActive ? '#ffffff' : '#666666',
                backgroundColor: isActive ? COLORS.primary.toString(16) : 'transparent',
                padding: { x: 12, y: 6 }
            });
            // Fix color string
            if (isActive) btn.setBackgroundColor('#6366f1');

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
        // Draw area: x 410 -> 820. y 270 -> 540. w 460 -> 920. h 320 -> 640
        this.drawKLines(klineData, 820, 540, 920, 640);
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
            const priceLabel = this.add.text(startX + width + 10, y, price.toFixed(2), {
                fontSize: '20px', // 10 -> 20
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
            this.klineGraphics.lineStyle(2, color, 1); // width 1->2
            this.klineGraphics.moveTo(x, highY);
            this.klineGraphics.lineTo(x, lowY);
            this.klineGraphics.strokePath();

            // K线实体
            this.klineGraphics.fillStyle(color, 1);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(openY - closeY), 2); // min 1->2
            this.klineGraphics.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        }
    }

    /** 绘制盘口 */
    private drawOrderBook(stock: Stock): void {
        const orderBook = stockMarket.getOrderBook(stock.code);

        // 盘口背景 (磨砂卡片)
        // x=1050->2100, y=280->560, w=240->480, h=360->720
        const bookBg = this.add.rectangle(2100, 560, 480, 720, COLORS.panel, 0.4);
        applyGlassEffect(bookBg, 0.4);
        this.detailContainer.add(bookBg);

        const title = this.add.text(1880, 230, 'ORDER BOOK / 五档盘口', { // x=940->1880, y=115->230
            fontSize: '20px', // 10 -> 20
            fontFamily: FONTS.mono,
            color: '#666666'
        });
        this.detailContainer.add(title);

        // 卖盘
        const reversedAsks = [...orderBook.asks].reverse();
        reversedAsks.forEach((ask, index) => {
            const y = 290 + index * 52; // y=145->290, step 26->52

            const label = this.add.text(1880, y, `ASK${5 - index}`, { fontSize: '20px', fontFamily: FONTS.mono, color: '#888888' });
            const price = this.add.text(2000, y, ask.price.toFixed(2), { fontSize: '24px', fontFamily: FONTS.mono, color: '#00ff88' });
            const volume = this.add.text(2220, y, ask.volume.toString(), { fontSize: '22px', fontFamily: FONTS.mono, color: '#666666' }).setOrigin(1, 0);
            this.detailContainer.add([label, price, volume]);
        });

        // 当前价
        // x=1050->2100, y=280->560, w=210->420
        const divider = this.add.rectangle(2100, 560, 420, 2, 0xffffff, 0.1);
        const currentPrice = this.add.text(2100, 560, stock.price.toFixed(2), {
            fontSize: '36px', // 18 -> 36
            fontFamily: FONTS.mono,
            color: stock.changePercent >= 0 ? '#ff4444' : '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);
        this.detailContainer.add([divider, currentPrice]);

        // 买盘
        orderBook.bids.forEach((bid, index) => {
            const y = 630 + index * 52; // y=315->630

            const label = this.add.text(1880, y, `BID${index + 1}`, { fontSize: '20px', fontFamily: FONTS.mono, color: '#888888' });
            const price = this.add.text(2000, y, bid.price.toFixed(2), { fontSize: '24px', fontFamily: FONTS.mono, color: '#ff4444' });
            const volume = this.add.text(2220, y, bid.volume.toString(), { fontSize: '22px', fontFamily: FONTS.mono, color: '#666666' }).setOrigin(1, 0);
            this.detailContainer.add([label, price, volume]);
        });
    }

    /** 绘制交易面板 */
    private drawTradePanel(stock: Stock): void {
        const account = gameState.getAccount();
        const position = gameState.getPosition(stock.code);

        // 交易面板背景 (磨砂卡片)
        // x=1050->2100, y=580->1160, w=240->480, h=220->440
        const tradeBg = this.add.rectangle(2100, 1160, 480, 440, COLORS.panel, 0.4);
        applyGlassEffect(tradeBg, 0.4);
        this.detailContainer.add(tradeBg);

        // 委托价格
        const priceLabel = this.add.text(1880, 960, 'PRICE / 价格', { fontSize: '20px', fontFamily: FONTS.mono, color: '#666666' });
        this.detailContainer.add(priceLabel);

        const priceDown = this.add.text(1880, 1000, '-', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 4 } }).setInteractive({ useHandCursor: true });
        priceDown.on('pointerdown', () => {
            this.tradePrice = Math.max(stock.limitDown, parseFloat((this.tradePrice - 0.01).toFixed(2)));
            this.showStockDetail(stock.code);
        });

        const priceDisplay = this.add.text(2100, 1000, this.tradePrice.toFixed(2), { fontSize: '32px', fontFamily: FONTS.mono, color: '#ffffff', backgroundColor: '#000000', padding: { x: 40, y: 10 } }).setOrigin(0.5, 0);

        const priceUp = this.add.text(2260, 1000, '+', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 4 } }).setInteractive({ useHandCursor: true });
        priceUp.on('pointerdown', () => {
            this.tradePrice = Math.min(stock.limitUp, parseFloat((this.tradePrice + 0.01).toFixed(2)));
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add([priceDown, priceDisplay, priceUp]);

        // 委托数量
        const quantityLabel = this.add.text(1880, 1080, 'QUANTITY / 数量', { fontSize: '20px', fontFamily: FONTS.mono, color: '#666666' });
        this.detailContainer.add(quantityLabel);

        const quantityDown = this.add.text(1880, 1120, '-', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 4 } }).setInteractive({ useHandCursor: true });
        quantityDown.on('pointerdown', () => {
            this.tradeQuantity = Math.max(100, this.tradeQuantity - 100);
            this.showStockDetail(stock.code);
        });

        const quantityDisplay = this.add.text(2100, 1120, this.tradeQuantity.toString(), { fontSize: '32px', fontFamily: FONTS.mono, color: '#ffffff', backgroundColor: '#000000', padding: { x: 40, y: 10 } }).setOrigin(0.5, 0);

        const quantityUp = this.add.text(2260, 1120, '+', { fontSize: '40px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 4 } }).setInteractive({ useHandCursor: true });
        quantityUp.on('pointerdown', () => {
            this.tradeQuantity += 100;
            this.showStockDetail(stock.code);
        });
        this.detailContainer.add([quantityDown, quantityDisplay, quantityUp]);

        // 快捷数量按钮
        const quickAmounts = [100, 500, 1000, 'MAX'];
        quickAmounts.forEach((amount, index) => {
            const x = 1890 + index * 104; // 945->1890. 52->104
            const btn = this.add.text(x, 1210, amount.toString(), { fontSize: '20px', fontFamily: FONTS.mono, color: '#888888', backgroundColor: '#222222', padding: { x: 10, y: 6 } }).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                if (amount === 'MAX') this.tradeQuantity = Math.floor(account.cash / this.tradePrice / 100) * 100;
                else this.tradeQuantity = amount as number;
                this.showStockDetail(stock.code);
            });
            this.detailContainer.add(btn);
        });

        // 预估金额
        const estimatedCost = this.tradePrice * this.tradeQuantity;
        const estimatedText = this.add.text(2100, 1270, `ESTIMATED: ¥${estimatedCost.toLocaleString()}`, { fontSize: '22px', fontFamily: FONTS.mono, color: '#aaaaaa' }).setOrigin(0.5, 0);
        this.detailContainer.add(estimatedText);

        // 买入/卖出按钮
        // 1000->2000, 1100->2200. W 90->180, H 36->72
        const buyBtn = createStyledButton(this, 2000, 1350, 180, 72, 'BUY', () => this.executeBuy(stock));
        const sellBtn = createStyledButton(this, 2200, 1350, 180, 72, 'SELL', () => this.executeSell(stock));
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
        // x=640->1280, y=160->320, w=1200->2400, h=120->240
        const summaryBg = this.add.rectangle(1280, 320, 2400, 240, COLORS.panel, 0.4);
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
            const x = 220 + index * 460; // 110->220. 230->460

            const label = this.add.text(x, 260, item.label, { // y=130->260
                fontSize: '20px', // 10 -> 20
                fontFamily: FONTS.mono,
                color: '#666666'
            });
            this.positionContainer.add(label);

            const value = this.add.text(x, 320, item.value, { // y=160->320
                fontSize: '40px', // 20 -> 40
                fontFamily: FONTS.mono,
                color: item.color,
                fontStyle: 'bold'
            });
            this.positionContainer.add(value);
        });

        // 持仓列表头
        if (positions.length > 0) {
            const headers = [
                { label: 'SYMBOL 股票', x: 160 },
                { label: 'QTY 持仓', x: 440 },
                { label: 'COST 成本', x: 680 },
                { label: 'LAST 现价', x: 920 },
                { label: 'MKT VAL 市值', x: 1160 },
                { label: 'P&L 盈亏', x: 1440 },
                { label: 'P&L% 盈亏率', x: 1720 },
                { label: 'ACTION 操作', x: 2080 }
            ];

            headers.forEach((h) => {
                const text = this.add.text(h.x, 480, h.label, { // y=240->480
                    fontSize: '22px', // 11 -> 22
                    fontFamily: FONTS.mono,
                    color: '#666666'
                });
                this.positionContainer.add(text);
            });

            // 持仓列表
            positions.forEach((pos, index) => {
                const stock = stockMarket.getStock(pos.code);
                if (stock) gameState.updatePositionPrice(pos.code, stock.price);

                const y = 580 + index * 100; // y=290->580, step 50->100
                const profitColor = pos.profit >= 0 ? '#ff4444' : '#00ff88';

                const rowContainer = this.add.container(0, 0);
                this.positionContainer.add(rowContainer);

                // w=1160->2320, h=44->88, x=1280
                const rowBg = this.add.rectangle(1280, y, 2320, 88, 0xffffff, index % 2 === 0 ? 0.02 : 0);
                rowBg.setInteractive({ useHandCursor: true });
                rowBg.on('pointerdown', () => this.showStockDetail(pos.code));
                rowContainer.add(rowBg);

                // 股票
                rowContainer.add(this.add.text(160, y, `${pos.name}\n${pos.code}`, { fontSize: '24px', fontFamily: FONTS.main, color: '#ffffff', lineSpacing: 8 }).setOrigin(0, 0.5));

                // 数量
                rowContainer.add(this.add.text(440, y, pos.quantity.toString(), { fontSize: '28px', fontFamily: FONTS.mono, color: '#ffffff' }).setOrigin(0, 0.5));

                // 价格
                rowContainer.add(this.add.text(680, y, pos.costPrice.toFixed(2), { fontSize: '28px', fontFamily: FONTS.mono, color: '#ffffff' }).setOrigin(0, 0.5));
                rowContainer.add(this.add.text(920, y, pos.currentPrice.toFixed(2), { fontSize: '28px', fontFamily: FONTS.mono, color: profitColor }).setOrigin(0, 0.5));

                // 市值
                const mktVal = pos.currentPrice * pos.quantity;
                rowContainer.add(this.add.text(1160, y, `¥${mktVal.toLocaleString()}`, { fontSize: '28px', fontFamily: FONTS.mono, color: '#ffffff' }).setOrigin(0, 0.5));

                // 盈亏
                rowContainer.add(this.add.text(1440, y, `${pos.profit >= 0 ? '+' : ''}¥${pos.profit.toFixed(2)}`, { fontSize: '28px', fontFamily: FONTS.mono, color: profitColor }).setOrigin(0, 0.5));
                rowContainer.add(this.add.text(1720, y, `${pos.profitRate >= 0 ? '+' : ''}${(pos.profitRate * 100).toFixed(2)}%`, { fontSize: '28px', fontFamily: FONTS.mono, color: profitColor }).setOrigin(0, 0.5));

                // 操作按钮
                const sellBtn = createStyledButton(this, 2160, y, 160, 52, 'SELL', () => { // x 1080->2160
                    this.tradeQuantity = pos.quantity;
                    this.showStockDetail(pos.code);
                });
                rowContainer.add(sellBtn);
            });
        } else {
            const emptyText = this.add.text(1280, 900, 'NO POSITIONS FOUND\n\n数据为空，请前往行情页面进行交易。', {
                fontSize: '28px',
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
