# 职场沙盒游戏 - 运行指南

## 项目架构

这是一个完整的**3D职场沙盒游戏**，采用前后端分离架构：

```
globe/
├── client/          # 前端：Phaser 游戏引擎 + React
├── server/          # 后端：FastAPI + Qwen AI
└── DEPLOYMENT.md    # 本文件
```

## 本地运行

### 前端运行

```bash
cd client
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动

### 后端运行

```bash
cd server
pip install -r requirements.txt
python main.py
```

后端API将在 `http://localhost:8000` 启动

## API 端点

### 对话接口
- **POST** `/api/chat` - 与NPC对话
- **POST** `/api/tasks` - 生成每日任务
- **GET** `/api/market` - 获取市场数据

### 文档
- **GET** `/docs` - Swagger API 文档

## 游戏特性

- ✅ **3D办公室场景** - 可探索的完整环境
- ✅ **AI驱动的NPC** - 智能对话和行为系统
- ✅ **物理交互** - 使用水杯等物品与同事互动
- ✅ **任务系统** - AI生成每日工作任务
- ✅ **理财系统** - 股票、基金投资
- ✅ **手机系统** - 联系人和事件处理

## 技术栈

### 前端
- Phaser 3 - 2D/3D游戏引擎
- React + Vite - UI框架
- TypeScript - 类型安全

### 后端
- FastAPI - Python Web框架
- Qwen AI - 大语言模型
- Pydantic - 数据验证

## 开发说明

本项目是一个**完整的游戏项目**，不是简单的演示应用。

如需部署到ModelScope，需要：
1. 打包前端为静态文件
2. 创建Gradio入口应用
3. 或使用其他部署方案
