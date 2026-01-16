"""
职场沙盒游戏 - ModelScope 部署版本
整合前后端的单文件应用
"""

import gradio as gr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uvicorn
import random

# ========== 导入后端服务 ==========
try:
    from qwen_service import qwen_service
except ImportError:
    print("警告: qwen_service.py 未找到，AI 功能将使用模拟模式")
    qwen_service = None

# ========== 创建 FastAPI 应用 ==========
fastapi_app = FastAPI(
    title="职场沙盒游戏 API",
    description="AI 驱动的职场沙盒游戏",
    version="1.0.0"
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== 数据模型 ==========
class Player(BaseModel):
    name: str
    position: str = "实习生"
    money: float = 5000.0
    day: int = 1

class ChatRequest(BaseModel):
    npc_name: str
    player_message: str
    conversation_history: List[dict] = []
    player_info: Optional[Player] = None
    workplace_status: Optional[dict] = None

# ========== NPC 配置 ==========
NPC_PROFILES = {
    "张经理": {
        "personality": "严肃但公正，注重效率，偶尔会关心下属，但更看重KPI",
        "position": "部门经理",
        "color": "#e63946"
    },
    "李同事": {
        "personality": "表面热情友好，实际上爱八卦、会抢功，对威胁到自己的人有敌意",
        "position": "资深员工",
        "color": "#f4a261"
    },
    "王前辈": {
        "personality": "沉稳内敛，经验丰富，愿意指导新人，但不喜欢不努力的人",
        "position": "高级工程师",
        "color": "#118ab2"
    }
}

# ========== FastAPI 端点 ==========

@fastapi_app.get("/")
async def root():
    return {
        "status": "running",
        "service": "职场沙盒游戏 API",
        "timestamp": datetime.now().isoformat(),
        "ai_available": qwen_service is not None
    }

@fastapi_app.post("/api/chat")
async def chat_with_npc(request: ChatRequest):
    """与 NPC 对话"""
    if not qwen_service:
        return {
            "npc_response": "AI 服务暂时不可用。这是一个完整的 3D 职场沙盒游戏，请查看部署说明了解如何运行完整版本。",
            "emotion": "neutral",
            "relationship_change": 0
        }

    npc = NPC_PROFILES.get(request.npc_name)
    if not npc:
        raise HTTPException(status_code=404, detail=f"NPC '{request.npc_name}' 不存在")

    result = await qwen_service.chat_with_npc(
        npc_name=request.npc_name,
        npc_profile=npc,
        player_message=request.player_message,
        conversation_history=request.conversation_history,
        player_info=request.player_info.model_dump() if request.player_info else None,
        workplace_status=request.workplace_status
    )

    return result

@fastapi_app.get("/api/market")
async def get_market_data():
    """获取市场数据"""
    stocks = [
        {"code": "TECH001", "name": "科技先锋", "price": round(random.uniform(80, 120), 2), "change": round(random.uniform(-5, 5), 2)},
        {"code": "FINA002", "name": "金融稳健", "price": round(random.uniform(50, 70), 2), "change": round(random.uniform(-3, 3), 2)},
    ]

    funds = [
        {"code": "FUND001", "name": "稳健理财A", "nav": round(random.uniform(1.0, 1.5), 4), "change": round(random.uniform(-1, 1), 2)},
    ]

    return {
        "stocks": stocks,
        "funds": funds,
        "timestamp": datetime.now().isoformat()
    }

# ========== Gradio 界面 ==========

def create_gradio_interface():
    """创建游戏演示界面"""

    with gr.Blocks(
        title="职场沙盒游戏 - Office Sandbox"
    ) as demo:

        gr.HTML("""
            <div style="text-align: center; padding: 3rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 2rem;">
                <h1 style="color: white; font-size: 3rem; margin: 0;">🏢 职场沙盒游戏</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 1.2rem; margin-top: 1rem;">3D Office Sandbox with AI-Driven NPCs</p>
            </div>
        """)

        with gr.Row():
            with gr.Column(scale=2):
                gr.Markdown("### 🎮 游戏介绍")

                gr.HTML("""
                    <div style="padding: 1.5rem; background: #f8f9fa; border-radius: 8px; line-height: 1.8;">
                        <p><strong>职场沙盒游戏</strong>是一款完整的 3D 职场模拟游戏，具有以下核心特性：</p>

                        <h4>🎯 核心玩法</h4>
                        <ul>
                            <li><strong>3D 办公室场景</strong>：使用 Phaser 游戏引擎构建完整办公室环境</li>
                            <li><strong>AI NPC 系统</strong>：由 Qwen 大模型驱动的智能同事和上司</li>
                            <li><strong>物理交互</strong>：可以拿起水杯等物品与同事互动</li>
                            <li><strong>任务系统</strong>：AI 生成每日工作任务</li>
                            <li><strong>理财系统</strong>：股票、基金投资，即使工作失败也能通过理财存活</li>
                            <li><strong>手机系统</strong>：联系人管理、事件处理</li>
                        </ul>

                        <h4>🏗️ 技术架构</h4>
                        <ul>
                            <li><strong>前端</strong>：Phaser 3 + React + Vite + TypeScript</li>
                            <li><strong>后端</strong>：FastAPI + Python 3.10</li>
                            <li><strong>AI 引擎</strong>：ModelScope Qwen3 大语言模型</li>
                        </ul>
                    </div>
                """)

            with gr.Column(scale=1):
                gr.Markdown("### 💬 AI 对话演示")

                npc_dropdown = gr.Dropdown(
                    choices=list(NPC_PROFILES.keys()),
                    value="张经理",
                    label="选择 NPC"
                )

                player_input = gr.Textbox(
                    label="你的消息",
                    placeholder="输入你想说的话...",
                    lines=3
                )

                chat_btn = gr.Button("发送消息", variant="primary")

                npc_response = gr.Textbox(
                    label="NPC 回复",
                    interactive=False,
                    lines=5
                )

                gr.Markdown("### 📊 市场数据演示")

                market_btn = gr.Button("获取市场数据")
                market_output = gr.JSON(label="股票/基金")

        gr.Markdown("---")
        gr.Markdown("### 🚀 如何运行完整游戏")

        gr.HTML("""
            <div style="padding: 2rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <h4>⚠️ 重要说明</h4>
                <p>这是一个<strong>完整的前后端分离游戏项目</strong>，而不仅仅是一个简单的演示界面。</p>

                <h4>📦 本地运行完整版本：</h4>
                <pre style="background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto;">
# 1. 启动后端 API
cd server
pip install -r requirements.txt
python main.py

# 2. 启动前端游戏（新终端）
cd client
npm install
npm run dev

# 3. 打开浏览器访问
http://localhost:5179
                </pre>

                <h4>📂 项目结构</h4>
                <pre style="background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto;">
globe/
├── client/          # 前端游戏（Phaser + React）
│   ├── src/         # TypeScript 源代码
│   ├── public/      # 静态资源
│   └── package.json
├── server/          # 后端 API（FastAPI）
│   ├── main.py      # API 服务器
│   ├── qwen_service.py  # Qwen AI 集成
│   └── requirements.txt
└── DEPLOYMENT.md    # 详细部署说明
                </pre>

                <p style="margin-top: 1rem;">
                    <strong>🎮 这是一个真正的游戏项目，包含完整的 3D 场景、物理引擎、AI NPC、任务系统等所有功能！</strong>
                </p>
            </div>
        """)

        # ========== 事件绑定 ==========

        async def chat(npc_name, message):
            """处理对话请求"""
            if not message:
                return "请输入消息"

            try:
                if qwen_service:
                    result = await qwen_service.chat_with_npc(
                        npc_name=npc_name,
                        npc_profile=NPC_PROFILES[npc_name],
                        player_message=message,
                        conversation_history=[],
                        player_info={"name": "新员工", "position": "实习生", "day": 1},
                        workplace_status={"kpi": 60, "stress": 20, "reputation": 0}
                    )

                    emotion_emoji = {
                        "happy": "😊", "neutral": "😐", "angry": "😠",
                        "sad": "😢", "surprised": "😲"
                    }.get(result.get("emotion", "neutral"), "😐")

                    return f"{emotion_emoji} {result['npc_response']}\n(关系变化: {result['relationship_change']:+d})"
                else:
                    return "AI 服务不可用，请运行完整版本体验完整功能。"
            except Exception as e:
                return f"错误: {str(e)}"

        async def get_market():
            """获取市场数据"""
            try:
                data = await get_market_data()
                return data
            except Exception as e:
                return {"error": str(e)}

        chat_btn.click(
            fn=chat,
            inputs=[npc_dropdown, player_input],
            outputs=npc_response
        )

        market_btn.click(
            fn=get_market,
            outputs=market_output
        )

    return demo

# ========== 启动应用 ==========

if __name__ == "__main__":
    demo = create_gradio_interface()

    # 将 Gradio 挂载到 FastAPI
    fastapi_app = gr.mount_gradio_app(fastapi_app, demo, path="/")

    # 启动服务器
    uvicorn.run(
        fastapi_app,
        host="0.0.0.0",
        port=7860
    )
