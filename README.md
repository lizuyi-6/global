---
# 详细文档见https://modelscope.cn/docs/%E5%88%9B%E7%A9%BA%E9%97%B4%E5%8D%A1%E7%89%87
domain: multi-modal
tags:
- competition
datasets: #关联数据集
  evaluation:
  test:
  train:
models: #关联模型

## 启动文件(若SDK为Gradio/Streamlit，默认为app.py, 若为Static HTML, 默认为index.html)
deployspec:
  entry_file: app.py
license: Apache License 2.0
---

# Global - ModelScope 竞赛项目

## 1、产品名称
**职场人生 (Career Life Simulation)** —— AI驱动的高沉浸式职场RPG

## 2、产品理念/亮点/功能
*   **核心理念**：拒绝脚本，AI驱动真实职场生态。每一次对话都在重塑人际关系，每一次选择都决定职业命运。
*   **功能亮点**：
    *   **AI 社交引擎**：基于 LLM 的 NPC 拥有独立记忆与性格，办公室政治不再是预设剧情。
    *   **真实经济模拟**：从求职面试到股市博弈，体验最真实的财富积累与阶层跨越。
    *   **沉浸式视觉**：Deep Slate 深色美学 + 动态 Bento Grid 布局，打造电影级交互体验。

## 3、产品展示页面
*   **落地页**：高对比度视觉冲击，不对称网格布局呈现核心卖点，光影质感拉满。
    
    ![Landing Hero](docs/assets/landing_hero.png)
    
    *核心特性展示 (Bento Grid)*
    ![Features](docs/assets/landing_features.png)

*   **游戏UI**：1080p+ 高清重制，可视化求职看板与沉浸式数据中心，清晰、专业、高级。
    
    ![Game UI](docs/assets/game_ui.png)

## 本地开发

### 环境要求

- Python 3.10+
- Git LFS
- Docker (可选，用于容器化部署)

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行应用

```bash
python app.py
```

应用将在 `http://localhost:7860` 启动。

## 部署到 ModelScope

### 首次部署

项目已配置好远程仓库，直接推送即可自动部署：

```bash
# 添加修改的文件
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到远程仓库（会自动触发部署）
git push
```

### 项目配置

- **远程仓库**: `http://www.modelscope.cn/studios/BreakFeeling/global.git`
- **应用入口**: `app.py`
- **服务端口**: 7860
- **Docker 镜像**: `modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10`

## 项目结构

```
globe/
├── app.py              # Gradio 应用入口
├── Dockerfile          # Docker 配置
├── requirements.txt    # Python 依赖
├── CLAUDE.md          # AI 助手协作指南
├── .gitignore         # Git 忽略文件
└── README.md          # 项目说明
```

## 开发工作流

1. 在本地修改代码并测试
2. 使用 `git add` 和 `git commit` 提交更改
3. 使用 `git push` 推送到远程
4. ModelScope 会自动构建和部署

## 多工具开发支持

本项目支持在多种开发环境中工作：
- **VSCode**: 推荐安装 Python 和 GitLens 插件
- **PyCharm**: 直接打开项目目录即可
- **Jupyter**: 可以创建 notebooks 进行实验
- **AI 编程助手**: Claude Code, Cursor, Copilot 等（参考 CLAUDE.md）

所有配置信息都在此文件中，任何工具都能快速了解项目。

#### Clone with HTTP
```bash
git clone https://www.modelscope.cn/studios/BreakFeeling/global.git
```