"""
职场沙盒游戏 - ModelScope 部署版本
整合前后端的单文件应用
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uvicorn
import random
import os

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

@fastapi_app.get("/api/status")
async def root():
    return {
        "status": "running",
        "service": "职场沙盒游戏 API",
        "timestamp": datetime.now().isoformat(),
        "ai_available": qwen_service is not None
    }

# ========== 前端静态文件服务 ==========

# 检查前端构建目录是否存在
frontend_dir = "/home/user/app/client/dist"
if not os.path.exists(frontend_dir):
    # 如果构建目录不存在，使用本地路径
    frontend_dir = "client/dist"

# 挂载静态文件
if os.path.exists(frontend_dir):
    fastapi_app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
else:
    print(f"警告: 前端构建目录不存在 ({frontend_dir})")

@fastapi_app.get("/")
async def serve_frontend():
    """提供前端主页"""
    index_path = os.path.join(frontend_dir, "index.html")

    if not os.path.exists(index_path):
        return {
            "error": "前端未构建",
            "message": "请先运行 'cd client && npm install && npm run build' 构建前端",
            "frontend_dir": frontend_dir
        }

    return FileResponse(index_path)

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

# ========== 启动应用 ==========

if __name__ == "__main__":
    print("=" * 60)
    print("职场沙盒游戏 - ModelScope 部署版本")
    print("=" * 60)
    print(f"FastAPI 应用已启动")
    print(f"前端目录: {frontend_dir}")
    print(f"API 端点:")
    print(f"   - GET  /              (前端游戏)")
    print(f"   - GET  /api/status    (服务状态)")
    print(f"   - POST /api/chat      (NPC 对话)")
    print(f"   - GET  /api/market    (市场数据)")
    print("=" * 60)

    uvicorn.run(
        fastapi_app,
        host="0.0.0.0",
        port=7860
    )
