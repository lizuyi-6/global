"""
职场沙盒游戏 - 后端服务
使用 FastAPI 提供 AI 对话和任务生成功能
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime
from qwen_service import qwen_service

# 创建 FastAPI 应用
app = FastAPI(
    title="职场沙盒 API",
    description="AI 驱动的职场沙盒游戏后端服务",
    version="0.1.0"
)

# CORS 配置 - 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
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
    role: str  # "player" 或 NPC 名字
    content: str


class ChatRequest(BaseModel):
    """对话请求"""
    npc_name: str
    player_message: str
    conversation_history: List[ChatMessage] = []
    player_info: Optional[Player] = None
    workplace_status: Optional[dict] = None  # 职场状态


class ChatResponse(BaseModel):
    """对话响应"""
    npc_response: str
    emotion: str = "neutral"  # neutral, happy, angry, sad, surprised
    relationship_change: int = 0  # -10 到 +10


class TaskRequest(BaseModel):
    """任务生成请求"""
    player_info: Player
    current_time: str = "09:00"


class Task(BaseModel):
    """工作任务"""
    id: str
    title: str
    description: str
    difficulty: str  # easy, medium, hard
    reward: float
    deadline: str
    type: str  # document, meeting, communication, emergency


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


# ========== API 端点 ==========

@app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "running",
        "service": "职场沙盒 API",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_npc(request: ChatRequest):
    """
    与 NPC 对话
    使用 Qwen3 API 实现 AI 对话
    """
    npc = NPC_PROFILES.get(request.npc_name)
    if not npc:
        raise HTTPException(
            status_code=404, detail=f"NPC '{request.npc_name}' 不存在")

    # 转换对话历史格式
    history = [{"role": msg.role, "content": msg.content}
               for msg in request.conversation_history]

    # 转换玩家信息格式
    player_dict = request.player_info.model_dump() if request.player_info else None

    # 调用 Qwen 服务
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


@app.post("/api/tasks", response_model=TaskResponse)
async def generate_daily_tasks(request: TaskRequest):
    """
    生成每日工作任务
    使用 Qwen3 API 动态生成任务
    """
    # 调用 Qwen 服务
    player_dict = request.player_info.model_dump()
    result = await qwen_service.generate_tasks(
        player_info=player_dict,
        current_time=request.current_time
    )

    # 转换任务格式
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

    return TaskResponse(
        tasks=tasks,
        daily_message=result["daily_message"]
    )


@app.get("/api/market")
async def get_market_data():
    """
    获取理财市场数据
    模拟股票/基金行情
    """
    import random

    stocks = [
        {"code": "TECH001", "name": "科技先锋", "price": round(
            random.uniform(80, 120), 2), "change": round(random.uniform(-5, 5), 2)},
        {"code": "FINA002", "name": "金融稳健", "price": round(
            random.uniform(50, 70), 2), "change": round(random.uniform(-3, 3), 2)},
        {"code": "CONS003", "name": "消费龙头", "price": round(random.uniform(
            100, 150), 2), "change": round(random.uniform(-4, 4), 2)},
    ]

    funds = [
        {"code": "FUND001", "name": "稳健理财A", "nav": round(random.uniform(
            1.0, 1.5), 4), "change": round(random.uniform(-1, 1), 2)},
        {"code": "FUND002", "name": "成长优选B", "nav": round(random.uniform(
            0.8, 1.2), 4), "change": round(random.uniform(-2, 2), 2)},
    ]

    return {
        "stocks": stocks,
        "funds": funds,
        "timestamp": datetime.now().isoformat()
    }


# ========== 启动配置 ==========

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
