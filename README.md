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

## 项目概述

这是一个基于 ModelScope Studio 的 AI 竞赛项目，使用 Gradio 框架构建 Web 应用。

## 技术栈

- **框架**: Gradio
- **Python 版本**: 3.10
- **容器**: Docker
- **平台**: ModelScope Studio

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