"""
Qwen3 大模型服务
使用 ModelScope API 提供 AI 对话和任务生成功能
"""

from openai import OpenAI
from typing import List, Optional
import json
import re
import os


class QwenService:
    """Qwen3 API 服务封装"""

    def __init__(self):
        # 从环境变量读取 API key，如果不存在则使用默认值
        api_key = os.getenv('MODELSCOPE_API_KEY', 'ms-afd08d8f-34cf-4d75-9aa4-6387d6c34a96')

        self.client = OpenAI(
            base_url='https://api-inference.modelscope.cn/v1',
            api_key=api_key,
        )
        self.model = 'Qwen/Qwen3-235B-A22B-Instruct-2507'

    def is_available(self) -> bool:
        """检查 API 是否可用"""
        return self.client is not None

    async def chat_with_npc(
        self,
        npc_name: str,
        npc_profile: dict,
        player_message: str,
        conversation_history: List[dict] = None,
        player_info: dict = None,
        workplace_status: dict = None
    ) -> dict:
        """
        NPC 对话 - 支持职场政治和霸凌场景

        Args:
            npc_name: NPC 名称
            npc_profile: NPC 性格配置
            player_message: 玩家消息
            conversation_history: 对话历史
            player_info: 玩家信息
            workplace_status: 职场状态（KPI、压力、派系等）

        Returns:
            包含响应内容、情绪、关系变化的字典
        """
        # 构建系统提示 - 增加职场真实性
        system_prompt = f"""你是一个职场模拟游戏中的 NPC，名叫"{npc_name}"。

【角色设定】
- 职位：{npc_profile.get('position', '员工')}
- 性格：{npc_profile.get('personality', '普通')}
- 说话风格：{npc_profile.get('speaking_style', '正常')}
- 派系倾向：{npc_profile.get('faction', '无')}

【游戏背景】
这是一个真实的职场沙盒游戏，包含：
- 办公室政治：派系斗争、站队、拉拢、排挤
- 职场晋升：KPI考核、绩效评估、升职竞争
- 职场阴暗面：抢功、甩锅、背后议论、职场霸凌
- 人际关系：好感度影响对话态度和帮助意愿

【玩家信息】
{self._format_player_info(player_info, workplace_status)}

【回复要求】
1. 保持角色性格一致，要符合真实职场
2. 根据玩家的职场状态（KPI、压力、好感度）调整态度
3. 可以适当：
   - 透露办公室政治信息
   - 暗示站队利弊
   - 表达对玩家的真实看法（可以是负面的）
   - 如果好感度低，可以冷淡或敷衍
4. 回复要简洁自然，像真实职场对话（2-4句话）
5. 在回复末尾用 JSON 格式标注：
   {{"emotion": "happy|neutral|angry|sad|surprised|contempt|jealous", "relationship_change": -10到+10}}
   
【重要】不要在思考过程中输出 <think> 标签，直接输出对话内容。"""

        # 构建消息列表
        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            for msg in conversation_history[-6:]:  # 保留最近6条
                role = "user" if msg.get("role") == "player" else "assistant"
                messages.append(
                    {"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": player_message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=300,
                temperature=0.8,
                stream=False
            )

            response_text = response.choices[0].message.content

            # 清理可能的思考标签
            response_text = re.sub(r'<think>.*?</think>',
                                   '', response_text, flags=re.DOTALL)
            response_text = response_text.strip()

            # 解析情绪和关系变化
            emotion = "neutral"
            relationship_change = 0

            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                try:
                    meta = json.loads(json_match.group())
                    emotion = meta.get("emotion", "neutral")
                    relationship_change = int(
                        meta.get("relationship_change", 0))
                    # 限制范围
                    relationship_change = max(-10,
                                              min(10, relationship_change))
                    # 移除 JSON 部分
                    response_text = response_text.replace(
                        json_match.group(), "").strip()
                except:
                    pass

            return {
                "npc_response": response_text,
                "emotion": emotion,
                "relationship_change": relationship_change
            }

        except Exception as e:
            print(f"Qwen API 错误: {e}")
            return self._mock_npc_response(npc_name, player_info, workplace_status)

    async def generate_interview_question(
        self,
        player_info: dict,
        company_info: dict,
        job_info: dict,
        round_info: dict,
        conversation_history: List[dict] = None
    ) -> dict:
        """
        生成面试问题及示例回答
        """
        system_prompt = f"""你是一个职场模拟游戏的 AI 面试官。
        
【面试背景】
- 公司: {company_info.get('name', '某公司')} ({company_info.get('type', '中型企业')})
- 职位: {job_info.get('title', '应聘岗位')}
- 面试轮次: 第 {round_info.get('round', 1)} 轮
- 面试官身份: {round_info.get('interviewerRole', '面试官')}
- 压力面试模式: {"是" if round_info.get('isPressure', False) else "否"}

【候选人背景】
- 姓名: {player_info.get('name', '求职者')}
- 学历: {player_info.get('education', '本科')}
- 经验: {player_info.get('experience', 0)}年
- 技能: {', '.join(player_info.get('skills', []))}

【生成要求】
1. 根据当前背景和历史对话，生成一个专业的面试问题。
2. 问题要真实、有针对性。如果是压力面，问题要犀利、挑剔。
3. 同时生成一个【示例回答】。
   - 注意：【示例回答】必须是候选人（玩家）的回答，而不是面试官的问题！
   - 回答应该是高质量的、逻辑清晰的，能充分展示候选人的背景优势。
   - 不要重复面试官的问题，直接给出回答内容。
4. 返回格式必须为 JSON。

【返回格式】
{{
    "question": "面试官的问题内容",
    "sample_answer": "给玩家参考的示例回答",
    "type": "technical|behavioral|personal|stress",
    "display_type": "问题分类名(如: 技术理解)"
}}

不要输出思考过程，直接输出 JSON。"""

        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            for msg in conversation_history[-4:]:
                role = "user" if msg.get("role") == "player" else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=800,
                temperature=0.8,
                stream=False
            )

            response_text = response.choices[0].message.content
            response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL)
            
            json_match = re.search(r'\{[\s\S]+\}', response_text)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Qwen API 错误 (generate_interview_question): {e}")
            
        return {
            "question": "请简单介绍一下你自己。",
            "sample_answer": f"您好，我叫{player_info.get('name', '求职者')}，有{player_info.get('experience', 0)}年工作经验，毕业于{player_info.get('school', '某大学')}，{player_info.get('major', '计算机')}专业。我的技术栈包括{', '.join(player_info.get('skills', ['相关技术'])[:3])}。在之前的工作中，我主要负责核心业务模块的开发，具备较强的解决问题能力和团队合作精神。",
            "type": "personal",
            "display_type": "自我介绍"
        }

    async def generate_job_listings(self, player_info: dict, count: int = 15) -> List[dict]:
        """
        生成求职列表
        
        Args:
            player_info: 玩家信息（姓名、学历、经验、技能等）
            count: 生成数量
        """
        system_prompt = f"""你是一个职场模拟游戏的招聘职位生成器。
        
【玩家背景】
- 姓名: {player_info.get('name', '求职者')}
- 学历: {player_info.get('education', '本科')}
- 专业: {player_info.get('major', '计算机')}
- 经验: {player_info.get('experience', 2)}年
- 技能: {', '.join(player_info.get('skills', ['JavaScript']))}

【生成要求】
请生成 {count} 个招聘职位信息。
这些职位应该围绕玩家背景，但也要有一定的随机性和真实感。
包含：
1. 知名大厂、中型企业、初创公司、外企、甚至不靠谱的小公司。
2. 职位不仅限于技术，也可以有管理、销售、甚至一些奇怪的兼职。
3. 薪资要符合公司类型和要求。
4. 包含职位描述、任职要求、公司福利。

【返回格式】
必须返回一个包含 {count} 个对象的 JSON 数组。
对象格式：
{{
    "id": "job_随机ID",
    "company": {{
        "name": "公司名称",
        "type": "large|mid|startup|foreign|small",
        "industry": "行业",
        "size": "公司规模",
        "reputation": 1-5,
        "difficulty": 1-5,
        "salaryLevel": 1-5,
        "description": "公司简介"
    }},
    "position": {{
        "title": "职位名称",
        "department": "所属部门",
        "salaryRange": [最低月薪, 最高月薪],
        "requirements": ["要求1", "要求2", "要求3"],
        "benefits": ["福利1", "福利2"],
        "workType": "onsite|remote|hybrid",
        "experience": "经验要求(如: 1-3年)",
        "education": "学历要求(如: 本科)",
        "headcount": 招聘人数,
        "urgency": "normal|urgent|asap"
    }}
}}

不要输出思考过程，直接输出 JSON 数组。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"请生成 {count} 个招聘职位"}
                ],
                max_tokens=4000,
                temperature=0.8,
                stream=False
            )

            response_text = response.choices[0].message.content
            response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL)
            
            # 查找 JSON 数组
            json_match = re.search(r'\[[\s\S]+\]', response_text)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Qwen API 错误 (generate_job_listings): {e}")
            
        return self._mock_job_listings(count)

    def _mock_job_listings(self, count: int) -> List[dict]:
        """模拟职位列表"""
        import random
        listings = []
        for i in range(count):
            c_id = f"mock_job_{i}"
            listings.append({
                "id": c_id,
                "company": {
                    "name": f"模拟科技_{i}",
                    "type": random.choice(["large", "mid", "startup", "foreign"]),
                    "industry": "互联网",
                    "size": "100-500人",
                    "reputation": random.randint(1, 5),
                    "difficulty": random.randint(1, 5),
                    "salaryLevel": random.randint(1, 5),
                    "description": "一家正在快速发展的模拟公司。"
                },
                "position": {
                    "title": random.choice(["前端开发", "后端开发", "产品经理", "UI设计师", "销售经理"]),
                    "department": "技术部",
                    "salaryRange": [10000 + random.randint(0, 5000), 20000 + random.randint(0, 10000)],
                    "requirements": ["熟悉 JavaScript", "良好的沟通能力"],
                    "benefits": ["五险一金", "带薪休假"],
                    "workType": "onsite",
                    "experience": "1-3年",
                    "education": "本科",
                    "headcount": 1,
                    "urgency": "normal"
                }
            })
        return listings

    def _format_player_info(self, player_info: dict, workplace_status: dict) -> str:
        """格式化玩家信息"""
        if not player_info:
            return "新入职员工"

        info = f"""- 姓名: {player_info.get('name', '新同事')}
- 职位: {player_info.get('position', '实习生')}
- 入职天数: 第{player_info.get('day', 1)}天"""

        if workplace_status:
            info += f"""
- KPI分数: {workplace_status.get('kpi', 60)}
- 压力值: {workplace_status.get('stress', 20)}
- 名声: {workplace_status.get('reputation', 0)}
- 所属派系: {workplace_status.get('faction', '无')}"""

        return info

    async def generate_tasks(self, player_info: dict, current_time: str = "09:00") -> dict:
        """生成每日工作任务"""
        system_prompt = f"""你是一个职场模拟游戏的任务生成器。

【玩家信息】
- 姓名: {player_info.get('name', '新员工')}
- 职位: {player_info.get('position', '实习生')}
- 入职天数: 第{player_info.get('day', 1)}天
- 当前时间: {current_time}

【任务生成要求】
生成3-5个真实的工作任务，要有职场真实性：
1. 可能包含"帮上司完成私活"等灰色任务
2. 有时间紧迫的紧急任务
3. 可能有需要与讨厌的同事合作的任务
4. 奖励要符合难度

用 JSON 格式返回：
{{
    "daily_message": "每日问候语（可以是讽刺或现实的）",
    "tasks": [
        {{
            "id": "task_001",
            "title": "任务标题",
            "description": "详细描述",
            "difficulty": "easy|medium|hard",
            "reward": 奖励金额,
            "deadline": "截止时间",
            "type": "document|meeting|communication|emergency"
        }}
    ]
}}

不要输出思考过程，直接输出JSON。"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "请为今天生成工作任务"}
                ],
                max_tokens=800,
                temperature=0.7,
                stream=False
            )

            response_text = response.choices[0].message.content
            # 清理思考标签
            response_text = re.sub(r'<think>.*?</think>',
                                   '', response_text, flags=re.DOTALL)

            json_match = re.search(r'\{[\s\S]+\}', response_text)
            if json_match:
                return json.loads(json_match.group())

        except Exception as e:
            print(f"Qwen API 错误: {e}")

        return self._mock_tasks()

    async def generate_workplace_event(
        self,
        player_info: dict,
        workplace_status: dict,
        event_type: str = "random"
    ) -> dict:
        """
        生成职场事件（办公室政治、霸凌等）

        Args:
            player_info: 玩家信息
            workplace_status: 职场状态
            event_type: 事件类型 (random/politics/bullying/opportunity)
        """
        system_prompt = f"""你是职场事件生成器。生成一个真实的职场事件。

【玩家状态】
- 职位: {player_info.get('position', '实习生')}
- KPI: {workplace_status.get('kpi', 60)}
- 压力: {workplace_status.get('stress', 20)}
- 名声: {workplace_status.get('reputation', 0)}

【事件类型】{event_type}

【要求】
生成一个有选择的职场事件，要真实、有后果。可以是：
- 办公室政治（站队、拉拢、打小报告）
- 职场霸凌（抢功、孤立、言语攻击）
- 机会事件（晋升、加薪、重要项目）
- 危机事件（背锅、裁员、投诉）

用 JSON 格式返回：
{{
    "title": "事件标题",
    "description": "事件描述",
    "type": "politics|bullying|opportunity|crisis",
    "choices": [
        {{
            "text": "选项文字",
            "effects": {{
                "kpi": 变化值,
                "stress": 变化值,
                "reputation": 变化值,
                "relationship": {{"npc名": 变化值}}
            }}
        }}
    ]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"生成一个{event_type}类型的职场事件"}
                ],
                max_tokens=600,
                temperature=0.9,
                stream=False
            )

            response_text = response.choices[0].message.content
            response_text = re.sub(r'<think>.*?</think>',
                                   '', response_text, flags=re.DOTALL)

            json_match = re.search(r'\{[\s\S]+\}', response_text)
            if json_match:
                return json.loads(json_match.group())

        except Exception as e:
            print(f"Qwen API 错误: {e}")

        return None

    def _mock_npc_response(self, npc_name: str, player_info: dict = None, workplace_status: dict = None) -> dict:
        """模拟 NPC 响应（API 不可用时使用）"""
        import random

        # 根据职场状态调整响应
        kpi = workplace_status.get('kpi', 60) if workplace_status else 60
        reputation = workplace_status.get(
            'reputation', 0) if workplace_status else 0

        mock_responses = {
            "张经理": {
                "high": ["工作不错，继续保持。", "有潜力，好好干。"],
                "medium": ["工作要更上心一点。", "下周有个项目，做好准备。"],
                "low": ["你的KPI有点问题，要抓紧了。", "最近状态不太好啊。"]
            },
            "李同事": {
                "high": ["哇，最近混得不错嘛！", "请我吃饭呗，庆祝一下~"],
                "medium": ["嘿，新来的！有空聊聊？", "食堂红烧肉不错，一起去？"],
                "low": ["啊...你好。", "我有点忙，回头聊。"]
            },
            "王前辈": {
                "high": ["年轻人，不错，有前途。", "有什么问题尽管问。"],
                "medium": ["慢慢来，职场路很长。", "这个问题嘛...我给你讲讲。"],
                "low": ["做人做事都要稳重。", "年轻人要沉淀。"]
            }
        }

        level = "high" if kpi >= 75 else "low" if kpi < 50 else "medium"
        responses = mock_responses.get(npc_name, mock_responses["李同事"])

        # 根据名声调整关系变化
        base_change = random.randint(-1, 2)
        if reputation < -20:
            base_change -= 2
        elif reputation > 20:
            base_change += 1

        return {
            "npc_response": random.choice(responses[level]),
            "emotion": "neutral",
            "relationship_change": max(-5, min(5, base_change))
        }

    def _mock_tasks(self) -> dict:
        """模拟任务生成"""
        import random

        return {
            "daily_message": random.choice([
                "又是元气满满的一天！（才怪）",
                "今天任务有点多，加油打工人。",
                "听说今天有重要会议，别迟到。"
            ]),
            "tasks": [
                {
                    "id": "task_001",
                    "title": "完成季度报告初稿",
                    "description": "整理本季度的销售数据，完成报告初稿。张经理要看。",
                    "difficulty": "medium",
                    "reward": 200,
                    "deadline": "17:00",
                    "type": "document"
                },
                {
                    "id": "task_002",
                    "title": "参加项目周会",
                    "description": "下午3点在会议室B，注意别抢李同事的风头。",
                    "difficulty": "easy",
                    "reward": 50,
                    "deadline": "15:00",
                    "type": "meeting"
                },
                {
                    "id": "task_003",
                    "title": "回复客户邮件",
                    "description": "有3封客户询问邮件需要回复，别写错了。",
                    "difficulty": "easy",
                    "reward": 80,
                    "deadline": "12:00",
                    "type": "communication"
                }
            ]
        }


# 全局服务实例
qwen_service = QwenService()
