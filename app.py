"""
职场沙盒游戏 - ModelScope 部署版本
整合 FastAPI 后端和 Gradio 前端
"""

import gradio as gr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uvicorn

# ========== 导入后端服务 ==========
try:
    from qwen_service import qwen_service
except ImportError:
    print("警告: qwen_service.py 未找到，AI 功能将不可用")
    qwen_service = None

# ========== 创建 FastAPI 应用 ==========
fastapi_app = FastAPI(
    title="职场沙盒 API",
    description="AI 驱动的职场沙盒游戏后端服务",
    version="1.0.0"
)

# CORS 配置
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== 数据模型 ==========
class Player(BaseModel):
    """玩家信息"""
    name: str
    position: str = "实习生"
    money: float = 5000.0
    day: int = 1
    skills: dict = {}

class ChatMessage(BaseModel):
    """对话消息"""
    role: str
    content: str

class ChatRequest(BaseModel):
    """对话请求"""
    npc_name: str
    player_message: str
    conversation_history: List[ChatMessage] = []
    player_info: Optional[Player] = None
    workplace_status: Optional[dict] = None

class ChatResponse(BaseModel):
    """对话响应"""
    npc_response: str
    emotion: str = "neutral"
    relationship_change: int = 0

class TaskRequest(BaseModel):
    """任务生成请求"""
    player_info: Player
    current_time: str = "09:00"

class Task(BaseModel):
    """工作任务"""
    id: str
    title: str
    description: str
    difficulty: str
    reward: float
    deadline: str
    type: str

class TaskResponse(BaseModel):
    """任务列表响应"""
    tasks: List[Task]
    daily_message: str

# ========== NPC 配置 ==========
NPC_PROFILES = {
    "张经理": {
        "personality": "严肃但公正，注重效率，偶尔会关心下属，但更看重KPI",
        "position": "部门经理",
        "speaking_style": "简洁专业，偶尔使用管理术语，对KPI低的人态度冷淡",
        "faction": "管理派"
    },
    "李同事": {
        "personality": "表面热情友好，实际上爱八卦、会抢功，对威胁到自己的人有敌意",
        "position": "资深员工",
        "speaking_style": "轻松随意，经常使用网络用语，但话里有话",
        "faction": "新人帮"
    },
    "王前辈": {
        "personality": "沉稳内敛，经验丰富，愿意指导新人，但不喜欢不努力的人",
        "position": "高级工程师",
        "speaking_style": "温和有耐心，喜欢用比喻解释问题，有时会透露职场真相",
        "faction": "元老派"
    }
}

# ========== FastAPI 端点 ==========

@fastapi_app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "running",
        "service": "职场沙盒 API",
        "timestamp": datetime.now().isoformat(),
        "ai_available": qwen_service is not None
    }

@fastapi_app.post("/api/chat", response_model=ChatResponse)
async def chat_with_npc(request: ChatRequest):
    """与 NPC 对话"""
    if not qwen_service:
        raise HTTPException(status_code=503, detail="AI 服务不可用")

    npc = NPC_PROFILES.get(request.npc_name)
    if not npc:
        raise HTTPException(status_code=404, detail=f"NPC '{request.npc_name}' 不存在")

    history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
    player_dict = request.player_info.model_dump() if request.player_info else None

    result = await qwen_service.chat_with_npc(
        npc_name=request.npc_name,
        npc_profile=npc,
        player_message=request.player_message,
        conversation_history=history,
        player_info=player_dict,
        workplace_status=request.workplace_status
    )

    return ChatResponse(
        npc_response=result["npc_response"],
        emotion=result["emotion"],
        relationship_change=result["relationship_change"]
    )

@fastapi_app.post("/api/tasks", response_model=TaskResponse)
async def generate_daily_tasks(request: TaskRequest):
    """生成每日工作任务"""
    if not qwen_service:
        # 返回模拟任务
        return TaskResponse(
            tasks=[
                Task(
                    id="task_001",
                    title="完成季度报告初稿",
                    description="整理本季度的销售数据，完成报告初稿。",
                    difficulty="medium",
                    reward=200.0,
                    deadline="17:00",
                    type="document"
                )
            ],
            daily_message="AI 服务不可用，使用模拟任务"
        )

    player_dict = request.player_info.model_dump()
    result = await qwen_service.generate_tasks(
        player_info=player_dict,
        current_time=request.current_time
    )

    tasks = [
        Task(
            id=t["id"],
            title=t["title"],
            description=t["description"],
            difficulty=t["difficulty"],
            reward=float(t["reward"]),
            deadline=t["deadline"],
            type=t["type"]
        )
        for t in result["tasks"]
    ]

    return TaskResponse(tasks=tasks, daily_message=result["daily_message"])

@fastapi_app.get("/api/market")
async def get_market_data():
    """获取理财市场数据"""
    import random

    stocks = [
        {"code": "TECH001", "name": "科技先锋", "price": round(random.uniform(80, 120), 2), "change": round(random.uniform(-5, 5), 2)},
        {"code": "FINA002", "name": "金融稳健", "price": round(random.uniform(50, 70), 2), "change": round(random.uniform(-3, 3), 2)},
        {"code": "CONS003", "name": "消费龙头", "price": round(random.uniform(100, 150), 2), "change": round(random.uniform(-4, 4), 2)},
    ]

    funds = [
        {"code": "FUND001", "name": "稳健理财A", "nav": round(random.uniform(1.0, 1.5), 4), "change": round(random.uniform(-1, 1), 2)},
        {"code": "FUND002", "name": "成长优选B", "nav": round(random.uniform(0.8, 1.2), 4), "change": round(random.uniform(-2, 2), 2)},
    ]

    return {
        "stocks": stocks,
        "funds": funds,
        "timestamp": datetime.now().isoformat()
    }

# ========== Gradio 界面 ==========

def create_gradio_interface():
    """创建 Gradio 用户界面"""

    with gr.Blocks(title="职场沙盒 - Office Sandbox", theme=gr.themes.Soft()) as demo:
        gr.Markdown(
            """
            # 🏢 职场沙盒 - Office Sandbox

            AI 驱动的职场模拟游戏，体验真实的办公室政治、人际关系和职业发展。

            ## 🎮 游戏特点
            - **AI 对话系统**：与 NPC 进行真实的职场对话
            - **办公室政治**：派系斗争、站队、KPI 竞争
            - **任务系统**：完成工作任务，获得奖励
            - **股市理财**：模拟股票和基金投资

            ## 📖 游戏说明

            这是一个基于 Web 的游戏，完整版本请使用以下方式访问：

            ### 方式 1：本地开发
            ```bash
            # 前端开发
            cd client
            npm install
            npm run dev

            # 后端 API
            cd server
            pip install -r requirements.txt
            python main.py
            ```

            ### 方式 2：API 集成
            本应用同时提供 REST API，可以与任何前端框架集成。

            ## 🔧 API 端点

            - `POST /api/chat` - 与 NPC 对话
            - `POST /api/tasks` - 生成每日任务
            - `GET /api/market` - 获取市场数据
            - `GET /docs` - API 文档（Swagger UI）

            ---
            **技术栈**：FastAPI + Gradio + Qwen AI | 部署平台：ModelScope Studio
            """
        )

        with gr.Row():
            with gr.Column():
                gr.Markdown("### 🤖 AI 对话测试")
                npc_dropdown = gr.Dropdown(
                    choices=["张经理", "李同事", "王前辈"],
                    value="张经理",
                    label="选择 NPC"
                )
                player_input = gr.Textbox(
                    label="你的消息",
                    placeholder="输入你想说的话..."
                )
                chat_btn = gr.Button("发送", variant="primary")
                npc_response = gr.Textbox(
                    label="NPC 回复",
                    interactive=False
                )

            with gr.Column():
                gr.Markdown("### 📊 市场数据")
                market_btn = gr.Button("刷新市场数据", variant="secondary")
                market_output = gr.JSON(label="股票/基金行情")

        # 事件绑定
        async def chat(npc_name, message):
            """处理对话请求"""
            if not message or not qwen_service:
                return "请输入消息或检查 AI 服务是否可用"

            try:
                result = await qwen_service.chat_with_npc(
                    npc_name=npc_name,
                    npc_profile=NPC_PROFILES[npc_name],
                    player_message=message,
                    conversation_history=[],
                    player_info={"name": "新员工", "position": "实习生", "day": 1},
                    workplace_status={"kpi": 60, "stress": 20, "reputation": 0}
                )
                return f"[{result['emotion']}] {result['npc_response']}\n(关系变化: {result['relationship_change']:+d})"
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
    # 创建 Gradio 界面
    demo = create_gradio_interface()

    # 将 Gradio 应用挂载到 FastAPI
    # 这样 Gradio 界面在根路径，API 在 /api/* 路径
    fastapi_app = gr.mount_gradio_app(fastapi_app, demo, path="/")

    # 使用 uvicorn 启动 FastAPI（包含 Gradio）
    uvicorn.run(
        fastapi_app,
        host="0.0.0.0",
        port=7860
    )
