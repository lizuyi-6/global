---
domain: multi-modal
tags:
- competition
datasets:
  evaluation:
  test:
  train:
models:

## 启动文件
deployspec:
  entry_file: app.py
license: Apache License 2.0
---

# 职场人生 (Career Life Simulation) - AI 驱动的高沉浸式职场 RPG

> **Warning**
> 本项目正在积极开发中，部分功能可能随时更新。
> This project is under active development.

## 1. 项目简介 (Introduction)

**职场人生** 是一款结合了复古像素风格与现代 UI 设计的 2.5D 职场模拟游戏。不同于传统的模拟经营，本作利用 Generative AI 技术驱动 NPC 行为与对话，致力于还原最真实的职场生态。

玩家将扮演一名初入职场的员工，在高压的办公环境中求生存、谋发展。你不仅需要完成日常工作任务（通过小游戏），还要处理复杂的人际关系，管理自己的压力与情绪，甚至应对失业危机。

### 核心理念
*   **真实模拟**：拒绝剧本，每一次对话都是唯一的。
*   **通感体验**：通过视觉、听觉与数值反馈（压力、心情、金钱）构建沉浸感。
*   **开放结局**：成为职场卷王、摸鱼达人，还是创业大亨？由你决定。

---

## 2. 核心功能与玩法 (Features & Gameplay)

### 🏢 沉浸式办公室 (Improved Office Scene)
*   **2.5D 等距视角**：精美的像素艺术风格，还原现代办公室布局。
*   **自由探索**：使用 `W` `A` `S` `D` 控制角色移动，探索工位、茶水间、老板办公室等区域。
*   **智能交互**：
    *   **物品互动**：点击咖啡机喝咖啡提神，点击电脑开始工作。
    *   **NPC 对话**：点击同事进行对话，AI 将根据你们的关系值（Relationship）做出不同反应。
    *   **自由指令**：在底部输入框输入任意动作（如“砸电脑”、“偷懒”），系统将实时演绎你的行为后果。

### 💻 工作系统与小游戏 (Work & Mini-games)
通过办公室电脑接取任务，进入沉浸式工作模式。告别枯燥的进度条，通过完成小游戏来赚取薪酬：
*   **打字挑战 (Typing)**：快速输入屏幕上的代码/关键词，模拟程序员/文员的高速工作。
*   **分类归档 (Sorting)**：按顺序整理文件/数字，考验逻辑与反应。
*   **记忆配对 (Memory)**：翻牌配对，模拟复杂信息的处理能力。
*   **精准点击 (Clicking)**：快速消除屏幕上的 Bug 或弹窗。
*   **按劳所得**：任务不再有失败判定，根据你的表现（分数）按比例结算报酬。

### 📱 智能手机系统 (Phone System)
职场人的第二大脑，随时随地管理生活：
*   **资产管理**：查看银行余额，处理转账或理财。
*   **社交网络**：查看同事的朋友圈，点赞互动维持关系。
*   **招聘软件**：失业了？在这里投递简历，寻找新的工作机会。
*   **外卖/购物**：点一份下午茶回复心情，或购买奢侈品提升属性。

### 💼 求职与面试 (Job Hunt)
真实的求职体验：
*   浏览海量职位，筛选心仪的公司。
*   完善简历，匹配岗位要求。
*   **AI 面试**：与 HR 进行实时对话面试，你的回答将直接决定是否拿到 Offer。

---

## 3. 技术架构 (Technical Stack)

本项目采用前后端分离架构，确保高性能与可扩展性。

### 前端 (Client)
*   **引擎**：[Phaser 3](https://phaser.io/) - 强大的 H5 游戏引擎，负责渲染、物理与游戏逻辑。
*   **框架**：React / Vanilla TS - 用于处理复杂的 UI 界面（如手机、电脑窗口）。
*   **构建工具**：[Vite](https://vitejs.dev/) - 极速的开发服务器与打包构建。
*   **语言**：TypeScript - 强类型保障代码质量。
*   **UI 风格**：Tailwind CSS (Landing Page) + Custom Pixel Art + Glassmorphism。

### 后端 (Server)
*   **Web 服务**：Python (Quart/Flask) - 处理 API 请求与静态资源托管。
*   **AI 服务**：集成 Qwen (通义千问) 等大模型 API，提供 NPC 对话与行为逻辑支持。
*   **部署**：Docker 容器化部署，支持 ModelScope 平台一键运行。

---

## 4. 本地开发指南 (Development Guide)

### 环境要求
*   Node.js 16+
*   Python 3.10+
*   Git

### 步骤 1: 启动后端服务
后端负责提供 API 和静态文件服务。

```bash
# 1. 安装 Python 依赖
pip install -r requirements.txt

# 2. 启动服务器 (默认端口 7860)
python app.py
```

### 步骤 2: 启动前端开发环境
如果你需要修改游戏逻辑或 UI，建议开启前端热更新模式。

```bash
cd client

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```
此时访问终端显示的 Local 地址（通常是 `http://localhost:5173`）即可看到游戏。

> **注意**：前端开发模式下，API 请求会通过代理转发到后端服务器，请确保后端 `app.py` 也在运行。

---

## 5. 项目结构 (Project Structure)

```text
globe/
├── app.py                  # 后端入口 & 静态资源托管
├── requirements.txt        # Python 依赖列表
├── qwen_service.py         # AI 模型服务接口
├── Dockerfile              # 部署配置文件
├── client/                 # 前端源文件
│   ├── index.html          # 游戏入口 HTML
│   ├── package.json        # 前端依赖配置
│   ├── vite.config.ts      # Vite 构建配置
│   ├── public/             # 静态资源 (图片、音效)
│   └── src/                # 源代码
│       ├── main.ts         # 游戏初始化
│       ├── GameState.ts    # 全局状态管理 (Redux-like)
│       ├── APIService.ts   # 后端通信接口
│       └── scenes/         # 游戏场景
│           ├── LandingScene.ts        # 登录/开始界面
│           ├── ImprovedOfficeScene.ts # 核心办公室场景
│           ├── ComputerScene.ts       # 电脑交互界面
│           ├── PhoneScene.ts          # 手机交互界面
│           ├── TaskGameScene.ts       # 工作小游戏场景
│           ├── JobHuntScene.ts        # 求职招聘场景
│           └── ...
└── docs/                   # 文档与演示资源
```

## 6. 版本更新日志 (Recent Updates)

*   **v1.2.0 (Current)**
    *   ✨ 重构 **TaskGameScene**：适配 2K 分辨率，优化视觉效果。
    *   ✨ 新增 **比例薪酬系统**：移除任务失败判定，多劳多得。
    *   🐛 修复 UI 遮挡问题：解决输入框阻挡小游戏界面的 Bug。
    *   🎨 优化 **PreloadScene**：更流畅的加载体验。

*   **v1.1.0**
    *   新增 **Memory Game** (记忆翻牌) 与 **Sorting Game** (数据分类)。
    *   实现 **ImprovedOfficeScene** 2.5D 视角重构。

---
*Powered by ModelScope & Phaser*