"""
职场沙盒游戏 - ModelScope 部署版本
企业反乌托邦设计风格
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
    skills: dict = {}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    npc_name: str
    player_message: str
    conversation_history: List[ChatMessage] = []
    player_info: Optional[Player] = None
    workplace_status: Optional[dict] = None

class ChatResponse(BaseModel):
    npc_response: str
    emotion: str = "neutral"
    relationship_change: int = 0

class TaskRequest(BaseModel):
    player_info: Player
    current_time: str = "09:00"

class Task(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    reward: float
    deadline: str
    type: str

class TaskResponse(BaseModel):
    tasks: List[Task]
    daily_message: str

# ========== NPC 配置 ==========
NPC_PROFILES = {
    "张经理": {
        "personality": "严肃但公正，注重效率，偶尔会关心下属，但更看重KPI",
        "position": "部门经理",
        "speaking_style": "简洁专业，偶尔使用管理术语，对KPI低的人态度冷淡",
        "faction": "管理派",
        "color": "#e63946"  # 警告红
    },
    "李同事": {
        "personality": "表面热情友好，实际上爱八卦、会抢功，对威胁到自己的人有敌意",
        "position": "资深员工",
        "speaking_style": "轻松随意，经常使用网络用语，但话里有话",
        "faction": "新人帮",
        "color": "#f4a261"  # 橙色
    },
    "王前辈": {
        "personality": "沉稳内敛，经验丰富，愿意指导新人，但不喜欢不努力的人",
        "position": "高级工程师",
        "speaking_style": "温和有耐心，喜欢用比喻解释问题，有时会透露职场真相",
        "faction": "元老派",
        "color": "#118ab2"  # 数据蓝
    }
}

# ========== FastAPI 端点 ==========

@fastapi_app.get("/")
async def root():
    return {
        "status": "running",
        "service": "职场沙盒 API",
        "timestamp": datetime.now().isoformat(),
        "ai_available": qwen_service is not None
    }

@fastapi_app.post("/api/chat", response_model=ChatResponse)
async def chat_with_npc(request: ChatRequest):
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
    if not qwen_service:
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

# ========== 自定义 CSS ==========
CUSTOM_CSS = """
/* ========== 企业反乌托邦设计系统 ========== */

/* 字体导入 */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* CSS 变量 - 色彩系统 */
:root {
    /* 主色调 */
    --bg-primary: #0f1419;
    --bg-secondary: #1a1f2e;
    --bg-tertiary: #252b3d;
    --bg-card: #1e2435;

    /* 强调色 */
    --accent-kpi: #06d6a0;      /* KPI 绿 */
    --accent-warning: #e63946;   /* 警告红 */
    --accent-info: #118ab2;      /* 数据蓝 */
    --accent-stress: #f4a261;    /* 压力橙 */
    --accent-purple: #9d4edd;    /* 派系紫 */

    /* 文字颜色 */
    --text-primary: #e8eaed;
    --text-secondary: #9aa0a6;
    --text-muted: #5f6368;

    /* 边框和阴影 */
    --border-color: #2d3748;
    --glow-kpi: 0 0 20px rgba(6, 214, 160, 0.3);
    --glow-warning: 0 0 20px rgba(230, 57, 70, 0.3);
}

/* 全局样式 */
.gradio-container {
    font-family: 'Space Grotesk', sans-serif !important;
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
}

/* 背景纹理 */
body {
    background:
        linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(26, 31, 46, 0.95) 100%),
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 214, 160, 0.03) 2px, rgba(6, 214, 160, 0.03) 4px);
    background-attachment: fixed;
}

/* 标题样式 */
h1, h2, h3 {
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em !important;
    color: var(--text-primary) !important;
}

h1 {
    font-size: 3rem !important;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-kpi) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 40px rgba(6, 214, 160, 0.3);
}

/* 主容器 */
.main-container {
    max-width: 1400px !important;
    margin: 0 auto !important;
    padding: 2rem !important;
}

/* 卡片样式 */
.custom-card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 12px !important;
    padding: 1.5rem !important;
    box-shadow:
        0 4px 6px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}

.custom-card:hover {
    border-color: var(--accent-kpi) !important;
    box-shadow:
        0 8px 12px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        var(--glow-kpi);
    transform: translateY(-2px);
}

/* 按钮样式 */
.primary-btn {
    background: linear-gradient(135deg, var(--accent-kpi) 0%, #059669 100%) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0.75rem 1.5rem !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    letter-spacing: 0.02em !important;
    transition: all 0.3s ease !important;
    box-shadow: var(--glow-kpi);
}

.primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(6, 214, 160, 0.5);
}

.secondary-btn {
    background: var(--bg-tertiary) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
    padding: 0.75rem 1.5rem !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500 !important;
    transition: all 0.3s ease;
}

.secondary-btn:hover {
    background: var(--accent-info) !important;
    border-color: var(--accent-info) !important;
    box-shadow: 0 0 20px rgba(17, 138, 178, 0.4);
}

/* 输入框样式 */
input[type="text"], textarea {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
    color: var(--text-primary) !important;
    padding: 0.75rem 1rem !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.9rem !important;
    transition: all 0.3s ease;
}

input[type="text"]:focus, textarea:focus {
    outline: none !important;
    border-color: var(--accent-kpi) !important;
    box-shadow: 0 0 0 3px rgba(6, 214, 160, 0.1);
}

/* 下拉框样式 */
.select-component {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 8px !important;
}

/* 统计数字样式 */
.stat-number {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 2.5rem !important;
    font-weight: 700 !important;
    color: var(--accent-kpi) !important;
    text-shadow: 0 0 20px rgba(6, 214, 160, 0.5);
}

.stat-label {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 0.85rem !important;
    color: var(--text-secondary) !important;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

/* NPC 对话框 */
.npc-message {
    background: var(--bg-tertiary) !important;
    border-left: 4px solid var(--accent-info) !important;
    border-radius: 8px !important;
    padding: 1rem 1.25rem !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 0.95rem !important;
    line-height: 1.6 !important;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* 数据网格 */
.data-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
    gap: 1rem !important;
    margin: 1.5rem 0 !important;
}

/* KPI 进度条 */
.kpi-bar {
    height: 8px !important;
    background: var(--bg-secondary) !important;
    border-radius: 4px !important;
    overflow: hidden !important;
    position: relative;
}

.kpi-fill {
    height: 100% !important;
    background: linear-gradient(90deg, var(--accent-kpi), var(--accent-info)) !important;
    border-radius: 4px !important;
    transition: width 0.8s ease;
    box-shadow: 0 0 10px rgba(6, 214, 160, 0.5);
}

/* 标签样式 */
.tag {
    display: inline-block !important;
    padding: 0.25rem 0.75rem !important;
    background: var(--bg-tertiary) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 6px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.75rem !important;
    color: var(--text-secondary) !important;
}

.tag.warning {
    border-color: var(--accent-warning) !important;
    color: var(--accent-warning) !important;
}

.tag.success {
    border-color: var(--accent-kpi) !important;
    color: var(--accent-kpi) !important;
}

/* 动画延迟 */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }

/* 响应式 */
@media (max-width: 768px) {
    h1 { font-size: 2rem !important; }
    .stat-number { font-size: 2rem !important; }
}
"""

# ========== Gradio 界面 ==========

def create_gradio_interface():
    """创建企业反乌托邦风格的 Gradio 界面"""

    with gr.Blocks(
        title="职场沙盒 - Office Sandbox",
        theme=gr.themes.Soft(),
        css=CUSTOM_CSS
    ) as demo:

        # 顶部横幅
        gr.HTML("""
            <div style="background: linear-gradient(135deg, rgba(6, 214, 160, 0.1) 0%, rgba(17, 138, 178, 0.1) 100%);
                       border-bottom: 2px solid rgba(6, 214, 160, 0.3);
                       padding: 2rem; margin-bottom: 2rem; border-radius: 12px;">
                <div style="max-width: 1400px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1 style="margin: 0; font-size: 3rem; font-weight: 700;
                                      font-family: 'Space Grotesk', sans-serif;
                                      background: linear-gradient(135deg, #e8eaed 0%, #06d6a0 100%);
                                      -webkit-background-clip: text;
                                      -webkit-text-fill-color: transparent;">
                                🏢 职场沙盒
                            </h1>
                            <p style="margin: 0.5rem 0 0 0; color: #9aa0a6; font-size: 1.1rem;">
                                AI 驱动的职场模拟 · 体验真实的办公室政治
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div class="stat-number" style="font-size: 1.5rem; color: #06d6a0;">第 1 天</div>
                            <div class="stat-label">入职时间</div>
                        </div>
                    </div>
                </div>
            </div>
        """)

        # 主要内容区
        with gr.Row():
            # 左侧列 - NPC 对话
            with gr.Column(scale=3):
                gr.Markdown(
                    """
                    ### 💬 NPC 对话系统
                    """,
                    elem_classes=["tag"]
                )

                with gr.Row():
                    with gr.Column():
                        npc_dropdown = gr.Dropdown(
                            choices=list(NPC_PROFILES.keys()),
                            value="张经理",
                            label="选择对话对象",
                            interactive=True
                        )

                        player_input = gr.Textbox(
                            label="你的消息",
                            placeholder="输入你想说的话...",
                            lines=3
                        )

                        chat_btn = gr.Button(
                            "发送消息",
                            variant="primary",
                            elem_classes=["primary-btn"]
                        )

                    with gr.Column():
                        npc_response = gr.Textbox(
                            label="NPC 回复",
                            interactive=False,
                            lines=5
                        )

                        with gr.Row():
                            relationship_indicator = gr.Textbox(
                                label="关系变化",
                                interactive=False,
                                scale=1
                            )
                            emotion_indicator = gr.Textbox(
                                label="当前情绪",
                                interactive=False,
                                scale=1
                            )

            # 右侧列 - 数据面板
            with gr.Column(scale=2):
                gr.Markdown(
                    """
                    ### 📊 职场数据
                    """,
                    elem_classes=["tag"]
                )

                # KPI 面板
                with gr.Box():
                    gr.HTML("""
                        <div style="padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span class="stat-label">当前 KPI</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; color: #06d6a0; font-weight: 700;">60/100</span>
                            </div>
                            <div class="kpi-bar">
                                <div class="kpi-fill" style="width: 60%;"></div>
                            </div>
                        </div>
                    """)

                # 压力值面板
                with gr.Box():
                    gr.HTML("""
                        <div style="padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span class="stat-label">压力值</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; color: #e63946; font-weight: 700;">20/100</span>
                            </div>
                            <div class="kpi-bar">
                                <div class="kpi-fill" style="width: 20%; background: linear-gradient(90deg, #e63946, #f4a261) !important;"></div>
                            </div>
                        </div>
                    """)

                # 市场数据按钮
                market_btn = gr.Button(
                    "刷新市场数据",
                    variant="secondary",
                    elem_classes=["secondary-btn"]
                )

                market_output = gr.JSON(label="股票/基金行情")

        # 底部信息
        gr.HTML("""
            <div style="margin-top: 2rem; padding: 1.5rem;
                       background: rgba(26, 31, 46, 0.5);
                       border: 1px solid rgba(45, 55, 72, 0.5);
                       border-radius: 8px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <div class="stat-label">职位</div>
                        <div style="font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; color: #e8eaed; margin-top: 0.25rem;">实习生</div>
                    </div>
                    <div>
                        <div class="stat-label">资金</div>
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; color: #06d6a0; margin-top: 0.25rem;">¥5,000</div>
                    </div>
                    <div>
                        <div class="stat-label">派系</div>
                        <div style="font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; color: #9d4edd; margin-top: 0.25rem;">无</div>
                    </div>
                    <div>
                        <div class="stat-label">名声</div>
                        <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; color: #118ab2; margin-top: 0.25rem;">0</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 1.5rem; text-align: center; color: #5f6368; font-size: 0.85rem;">
                <p style="margin: 0;">技术栈: FastAPI + Gradio + Qwen AI | 部署平台: ModelScope Studio</p>
            </div>
        """)

        # ========== 事件绑定 ==========

        async def chat(npc_name, message):
            """处理对话请求"""
            if not message or not qwen_service:
                return "请输入消息或检查 AI 服务是否可用", "N/A", "N/A"

            try:
                result = await qwen_service.chat_with_npc(
                    npc_name=npc_name,
                    npc_profile=NPC_PROFILES[npc_name],
                    player_message=message,
                    conversation_history=[],
                    player_info={"name": "新员工", "position": "实习生", "day": 1},
                    workplace_status={"kpi": 60, "stress": 20, "reputation": 0}
                )

                npc_color = NPC_PROFILES[npc_name]["color"]
                emotion_emoji = {
                    "happy": "😊", "neutral": "😐", "angry": "😠",
                    "sad": "😢", "surprised": "😲", "contempt": "😒",
                    "jealous": "😤"
                }.get(result["emotion"], "😐")

                return (
                    f"{emotion_emoji} {result['npc_response']}",
                    f"{result['relationship_change']:+d}",
                    f"{result['emotion'].upper()}"
                )
            except Exception as e:
                return f"错误: {str(e)}", "N/A", "ERROR"

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
            outputs=[npc_response, relationship_indicator, emotion_indicator]
        )

        market_btn.click(
            fn=get_market,
            outputs=market_output
        )

    return demo

# ========== 启动应用 ==========

if __name__ == "__main__":
    demo = create_gradio_interface()
    fastapi_app = gr.mount_gradio_app(fastapi_app, demo, path="/")

    uvicorn.run(
        fastapi_app,
        host="0.0.0.0",
        port=7860
    )
