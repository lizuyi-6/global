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

class JobGenerateRequest(BaseModel):
    player_resume: dict
    count: Optional[int] = 15

class InterviewQuestionRequest(BaseModel):
    player_info: dict
    company_info: dict
    job_info: dict
    round_info: dict
    conversation_history: List[dict] = []
    action: Optional[str] = "full"  # 'full' or 'analyze'

# ========== FastAPI 端点 ==========

@fastapi_app.post("/api/jobs/generate")
async def generate_jobs(request: JobGenerateRequest):
    """AI 生成招聘职位列表"""
    if not qwen_service:
        # 使用本地模拟数据
        from qwen_service import QwenService
        temp_service = QwenService()
        return temp_service._mock_job_listings(request.count)
    
    try:
        jobs = await qwen_service.generate_job_listings(
            player_info=request.player_resume,
            count=request.count
        )
        return jobs
    except Exception as e:
        print(f"生成职位列表失败: {e}")
        from qwen_service import QwenService
        temp_service = QwenService()
        return temp_service._mock_job_listings(request.count)

@fastapi_app.post("/api/interview/question")
async def generate_interview_question(request: InterviewQuestionRequest):
    """AI 生成面试问题及示例回答"""
    if not qwen_service:
        return {
            "question": "请简单介绍一下你自己。",
            "sample_answer": "面试官您好，我叫求职者，很荣幸参加面试...",
            "type": "personal",
            "display_type": "自我介绍"
        }
    
    try:
        result = await qwen_service.generate_interview_question(
            player_info=request.player_info,
            company_info=request.company_info,
            job_info=request.job_info,
            round_info=request.round_info,
            conversation_history=request.conversation_history,
            action=request.action
        )
        return result
    except Exception as e:
        print(f"生成面试问题失败: {e}")
        return {
            "question": "能聊聊你对这个职位的理解吗？",
            "sample_answer": "我认为这个职位需要扎实的技术功底和良好的沟通能力...",
            "type": "behavioral",
            "display_type": "职位理解"
        }

# 流式输出版本 - 防止超时
from fastapi.responses import StreamingResponse
import asyncio

@fastapi_app.post("/api/interview/question/stream")
async def generate_interview_question_stream(request: InterviewQuestionRequest):
    """AI 生成面试问题 - 流式输出版本"""
    
    async def generate():
        if not qwen_service:
            fallback = '{"question": "请简单介绍一下你自己。", "sample_answer": "面试官您好...", "type": "personal", "display_type": "自我介绍"}'
            yield f"data: {fallback}\n\n"
            return
        
        try:
            result = await qwen_service.generate_interview_question_stream(
                player_info=request.player_info,
                company_info=request.company_info,
                job_info=request.job_info,
                round_info=request.round_info,
                conversation_history=request.conversation_history
            )
            async for chunk in result:
                yield f"data: {chunk}\n\n"
        except Exception as e:
            print(f"流式生成面试问题失败: {e}")
            fallback = '{"question": "你为什么想加入我们公司？", "sample_answer": "贵公司的发展前景和企业文化让我非常感兴趣...", "type": "behavioral", "display_type": "求职动机"}'
            yield f"data: {fallback}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

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


# ========== 新增：玩家行动处理 ==========

class ActionRequest(BaseModel):
    action: str  # 玩家输入的行动描述
    player_info: Optional[Player] = None
    workplace_status: Optional[dict] = None
    visible_objects: List[str] = []  # 场景中可见的物品
    visible_npcs: List[str] = []  # 场景中可见的 NPC

class AnimationCommand(BaseModel):
    type: str  # throw, hit, debris, hurt, dodge, gather, flee, mood
    target: Optional[str] = None  # 目标 NPC 或物品
    params: dict = {}  # 额外参数

class ActionResponse(BaseModel):
    feasible: bool  # 行动是否可行
    description: str  # 行动描述
    animations: List[dict]  # 触发的动画序列
    npc_reactions: dict  # NPC 反应 {npc_name: reaction_type}
    state_changes: dict  # 状态变化
    dialogue: Optional[str] = None  # NPC 的台词（如果有）

@fastapi_app.post("/api/action")
async def execute_action(request: ActionRequest):
    """
    处理玩家行动，返回动画指令和状态变化
    AI 会判断行动是否可行，并返回应该播放的动画序列
    """
    if not qwen_service:
        # 使用本地规则处理
        return _process_action_locally(request)
    
    try:
        result = await qwen_service.process_player_action(
            action=request.action,
            player_info=request.player_info.model_dump() if request.player_info else None,
            workplace_status=request.workplace_status,
            visible_objects=request.visible_objects,
            visible_npcs=request.visible_npcs
        )
        return result
    except Exception as e:
        print(f"处理行动失败: {e}")
        return _process_action_locally(request)


def _process_action_locally(request: ActionRequest) -> dict:
    """本地规则处理玩家行动（减少 AI 调用）"""
    action = request.action.lower()
    
    animations = []
    npc_reactions = {}
    state_changes = {"mood": 0, "stress": 0, "work_progress": 0, "relationships": {}}
    feasible = True
    description = ""
    dialogue = None
    
    # 投掷类行动
    if any(word in action for word in ['砸', '扔', '投', '丢']):
        # 解析目标
        target_npc = None
        thrown_object = None
        
        for obj in request.visible_objects:
            if obj in action:
                thrown_object = obj
                break
        if not thrown_object:
            thrown_object = "水杯"  # 默认物品
            
        for npc in request.visible_npcs:
            if npc in action:
                target_npc = npc
                break
        if not target_npc and request.visible_npcs:
            target_npc = request.visible_npcs[0]  # 默认第一个 NPC
        
        if target_npc:
            description = f"你拿起{thrown_object}狠狠地砸向了{target_npc}！"
            animations = [
                {"type": "throw", "object": thrown_object, "target": target_npc, "duration": 500},
                {"type": "hit", "target": target_npc, "delay": 500},
                {"type": "debris", "object": thrown_object, "delay": 600},
                {"type": "hurt", "target": target_npc, "delay": 600}
            ]
            # 其他 NPC 反应
            for npc in request.visible_npcs:
                if npc != target_npc:
                    npc_reactions[npc] = random.choice(["gather", "flee", "shock"])
            npc_reactions[target_npc] = "hurt"
            
            state_changes = {
                "mood": -30,
                "stress": +50,
                "work_progress": -20,
                "relationships": {target_npc: -50}
            }
            dialogue = f"{target_npc}捂着头大喊：你疯了吗！"
        else:
            feasible = False
            description = "你找不到攻击目标。"
    
    # 攻击类行动
    elif any(word in action for word in ['打', '揍', '踢', '攻击']):
        target_npc = None
        for npc in request.visible_npcs:
            if npc in action:
                target_npc = npc
                break
        
        if target_npc:
            description = f"你冲向{target_npc}挥出了拳头！"
            animations = [
                {"type": "charge", "target": target_npc, "duration": 300},
                {"type": "hurt", "target": target_npc, "delay": 300}
            ]
            for npc in request.visible_npcs:
                if npc != target_npc:
                    npc_reactions[npc] = "gather"
            npc_reactions[target_npc] = "hurt"
            state_changes = {"mood": -40, "stress": +60, "relationships": {target_npc: -80}}
            dialogue = f"{target_npc}倒退几步，震惊地看着你。"
        else:
            feasible = False
            description = "你挥舞着拳头，但没有打中任何人。"
    
    # 工作类行动
    elif any(word in action for word in ['工作', '代码', '写', '做', '完成']):
        description = "你专注地开始工作..."
        animations = [{"type": "work", "duration": 2000}]
        state_changes = {"mood": -5, "stress": +10, "work_progress": +15}
        
    # 摸鱼类行动
    elif any(word in action for word in ['摸鱼', '休息', '偷懒', '刷手机']):
        description = "你偷偷摸起了鱼..."
        animations = [{"type": "idle", "variant": "phone", "duration": 2000}]
        state_changes = {"mood": +10, "stress": -10, "work_progress": -5}
        
        # 可能被发现
        if random.random() < 0.3:
            target_npc = random.choice(request.visible_npcs) if request.visible_npcs else "张经理"
            npc_reactions[target_npc] = "notice"
            dialogue = f"{target_npc}似乎注意到了你在摸鱼..."
    
    # 对话类行动
    elif any(word in action for word in ['说', '问', '聊', '告诉']):
        target_npc = None
        for npc in request.visible_npcs:
            if npc in action:
                target_npc = npc
                break
        
        if target_npc:
            description = f"你走向{target_npc}开始交谈。"
            animations = [{"type": "walk", "target": target_npc, "duration": 500}]
            npc_reactions[target_npc] = "talk"
        else:
            description = "你自言自语了几句。"
            
    # 默认行动
    else:
        description = f"你尝试{action}..."
        animations = [{"type": "generic", "duration": 1000}]
    
    return {
        "feasible": feasible,
        "description": description,
        "animations": animations,
        "npc_reactions": npc_reactions,
        "state_changes": state_changes,
        "dialogue": dialogue
    }


# ========== 新增：职场事件生成 ==========

class EventRequest(BaseModel):
    player_info: Optional[Player] = None
    workplace_status: Optional[dict] = None
    event_type: str = "random"  # random, politics, bullying, opportunity, crisis

@fastapi_app.post("/api/event")
async def generate_event(request: EventRequest):
    """生成职场随机事件"""
    if not qwen_service:
        return _generate_mock_event(request.event_type)
    
    try:
        result = await qwen_service.generate_workplace_event(
            player_info=request.player_info.model_dump() if request.player_info else {},
            workplace_status=request.workplace_status or {},
            event_type=request.event_type
        )
        return result
    except Exception as e:
        print(f"生成事件失败: {e}")
        return _generate_mock_event(request.event_type)


def _generate_mock_event(event_type: str) -> dict:
    """模拟职场事件"""
    events = {
        "politics": {
            "title": "派系拉拢",
            "description": "张经理私下找到你，暗示如果你支持他的方案，可能会有好处...",
            "type": "politics",
            "choices": [
                {"text": "表示支持", "effects": {"kpi": 5, "reputation": -10, "relationship": {"张经理": 20}}},
                {"text": "保持中立", "effects": {"kpi": 0, "reputation": 5}},
                {"text": "婉拒并告密", "effects": {"kpi": -10, "reputation": 15, "relationship": {"张经理": -30}}}
            ]
        },
        "bullying": {
            "title": "功劳被抢",
            "description": "李同事在会议上把你的方案说成是他的想法，大家都在看着你...",
            "type": "bullying",
            "choices": [
                {"text": "当场揭穿", "effects": {"stress": 20, "reputation": 10, "relationship": {"李同事": -40}}},
                {"text": "忍气吞声", "effects": {"stress": 30, "reputation": -5}},
                {"text": "会后私下沟通", "effects": {"stress": 10, "relationship": {"李同事": -10}}}
            ]
        },
        "opportunity": {
            "title": "晋升机会",
            "description": "公司有一个管理岗位空缺，你被列入候选名单！",
            "type": "opportunity",
            "choices": [
                {"text": "积极争取", "effects": {"stress": 20, "kpi": 10}},
                {"text": "顺其自然", "effects": {"stress": 0}},
                {"text": "主动让贤", "effects": {"stress": -10, "reputation": 5}}
            ]
        }
    }
    
    if event_type == "random":
        event_type = random.choice(list(events.keys()))
    
    return events.get(event_type, events["opportunity"])

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
