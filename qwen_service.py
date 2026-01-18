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
        conversation_history: List[dict] = None,
        action: str = "full"
    ) -> dict:
        """
        生成面试问题（或仅分析）
        action: 'full' (分析+提问+示例) | 'analyze' (仅分析)
        """
        if not self.client:
            return self._mock_interview_question()

        interviewer_role = round_info.get('interviewerRole', '面试官')
        is_pressure = round_info.get('isPressure', False)

        # ====== 仅分析模式 ======
        if action == 'analyze':
            prompt = f"""
你是一位严厉的{interviewer_role}。请点评候选人刚才的回答。
当前是否压力面试：{'是' if is_pressure else '否'}。
【要求】
1. 简短犀利地点评上一句话（analysis）。
2. 如果是压力面，要挑刺、质疑。
3. 如果是普通面，指出亮点或不足。
4. **不要**生成新问题，只需点评。

【返回格式】
{{ "analysis": "你的点评内容" }}
直接输出JSON。
"""
            messages = [{"role": "system", "content": prompt}]
            if conversation_history:
                # 只需最近的一轮对话用于分析
                last_exchange = conversation_history[-2:]
                for msg in last_exchange:
                     role = "user" if msg.get("role") == "player" else "assistant"
                     messages.append({"role": role, "content": msg.get("content", "")})

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=200, # 只需要很少token
                    temperature=0.8,
                    stream=False
                )
                txt = response.choices[0].message.content
                txt = re.sub(r'<think>.*?</think>', '', txt, flags=re.DOTALL)
                match = re.search(r'\{[\s\S]+\}', txt)
                if match:
                    res = json.loads(match.group())
                    return {
                        "analysis": res.get("analysis", "（点头记录）"),
                        "question": "",
                        "sample_answer": "",
                        "type": "",
                        "display_type": ""
                    }
            except Exception as e:
                print(f"Analysis error: {e}")
                return { "analysis": "（沉思...）", "question": "", "sample_answer": "", "type": "", "display_type": "" }

        # ====== 完整模式 (旧逻辑) ======
        # 分析历史对话，提取已问过的问题类型
        history_summary = ""
        asked_topics = []
        if conversation_history:
            for i, msg in enumerate(conversation_history):
                if msg.get("role") == "assistant":
                    asked_topics.append(msg.get("content", "")[:50])
            if asked_topics:
                history_summary = f"""
【已问过的问题摘要】
{chr(10).join(f'- {t}...' for t in asked_topics[-3:])}

【重要】不要重复上述问题类型，换一个全新的角度提问！"""

        # 分析玩家之前的回答，用于生成改进版示例
        last_player_answer = ""
        answer_improvement_hint = ""
        if conversation_history:
            for msg in reversed(conversation_history):
                if msg.get("role") == "player":
                    last_player_answer = msg.get("content", "")
                    break
            
            if last_player_answer:
                # 关键改进：把玩家的上次回答直接告诉 AI
                answer_improvement_hint = f"""
【玩家上次的回答内容】
"{last_player_answer}"

【示例回答生成要求 - 非常重要！】
玩家刚才的回答可能不够完整。你需要生成一个**改进版**的示例回答：
1. **不要**重复玩家已经说过的内容
2. **在玩家回答的基础上扩展**，添加以下内容：
   - 具体的数据和数字（如：提升了30%的性能、管理5人团队）
   - 真实的项目案例细节
   - 解决问题的具体方法和成果
   - 体现个人成长和反思
3. 示例回答应该是一个**完整的、高质量的回答**，不是追问或评论
4. 帮助玩家理解如何把简短回答扩展成详细回答"""

        # 根据面试轮次选择问题风格
        round_num = round_info.get('round', 1)
        interviewer_role = round_info.get('interviewerRole', '面试官')
        is_pressure = round_info.get('isPressure', False)
        
        # 专业面试技巧指导（使用抽象指令而非具体例子，防止模型抄袭）
        interviewing_techniques = """
【面试官的高级技巧】
1. **深度追问**：不要满足于表面的答案。使用"Why", "How", "What else" 挖掘细节。如果候选人提到用了某个技术，问他为什么不用替代方案，底层原理是什么。
2. **场景假设**：不要问"你会不会..."，而要问"现在发生了...你会怎么做？"。构建具体的、带有冲突的业务场景。
3. **压力测试**：直接指出候选人简历或回答中的逻辑矛盾。用怀疑的语气提问。
4. **行为面试**：挖掘过去的具体行为实例（STAR法则），关注候选人的真实行动和结果，而不是理论。
5. **价值观探测**：通过两难选择（如：进度vs质量，个人vs团队）来探测候选人的真实优先级。
"""

        role_specific_questions = ""
        if interviewer_role == "HR":
            role_specific_questions = """
【HR关注点】
- 重点考察：稳定性、薪资性价比、文化匹配度、情商。
- 提问策略：挖掘离职的真实原因（任何理由都要质疑一下），考察对加班/出差的态度，测试其抗压能力和沟通技巧。不要问通用的"你有什么缺点"，要结合具体工作习惯来问。
"""
        elif interviewer_role == "技术面试官":
            role_specific_questions = """
【技术面试官关注点】
- 重点考察：技术深度、广度、解决问题的思路、学习能力。
- 提问策略：抓住简历上的一个技术点死磕到底，直到候选人答不上来为止。考察系统设计能力（高并发、高可用）。关注对新技术的看法，要求说明技术选型的思考过程。
"""
        elif interviewer_role == "部门主管" or is_pressure:
            role_specific_questions = """
【主管/压力面关注点】
- 重点考察：宏观视野、项目管理、抗压能力、商业意识。
- 提问策略：质疑候选人的过往成就（"这不都是别人的功劳吗？"），给出不可能完成的任务看反应，考察对行业趋势的理解。必须非常犀利，不留情面。
"""

        # 根据轮次设定侧重点
        round_focus = ""
        if round_num == 1:
            round_focus = """
【当前是第一轮面试 - 侧重基础与核实】
- 重点考察：基础知识是否扎实、简历内容是否真实、沟通能力是否达标。
- 提问方向：
  1. 简历上提到的技能点的基础原理
  2. 以前项目的具体职责和产出
  3. 离职原因和求职动机
- 风格：相对平和，但要确认有没有撒谎
"""
        else:
            round_focus = """
【当前是第二轮/终面 - 侧重深度与潜力】
- 重点考察：解决复杂问题的能力、技术深度、系统设计思维、文化契合度。
- 提问方向：
  1. 开放性的系统设计问题（如：如何设计高并发系统）
  2. 追问项目中最难的技术难点，深挖底层
  3. 考察抗压能力和临场反应
  4. 价值观和职业规划的深层匹配
- 风格：更加犀利、更有挑战性，不要问太基础的问题
"""

        # 根据公司类型定制风格
        company_type = company_info.get('type', '')
        company_desc = company_info.get('description', '')
        company_context_prompt = ""
        
        if "初创" in company_type or "Startup" in company_type or "天使" in company_type:
            company_context_prompt = """
【公司特定背景 - 初创公司/创业团队】
- ⚠️ 核心痛点：人少事多，变化快，资源少。
- 面试官心态：我们需要"即插即用"的特种兵，不仅要技术好，还要能抗压、能加班、能接受所有事情都不完善的状态。
- 提问倾向：
  * 考察多面手能力（"前端后端运维你能否一肩挑？"）
  * 考察对混乱的容忍度（"如果我们只有目标没有文档，全靠口头沟通，你能干活吗？"）
  * 考察创业激情和加班意愿（"996对我们是常态，你家里人支持吗？"）
"""
        elif "大厂" in company_type or "集团" in company_type or "上市" in company_type or "500强" in company_type:
            company_context_prompt = """
【公司特定背景 - 大厂/上市公司】
- ⚠️ 核心痛点：流程复杂，协同困难，造轮子多。
- 面试官心态：我们需要"螺丝钉"但要有大局观，看重规范、文档、方法论和跨部门协作。
- 提问倾向：
  * 考察流程规范（"你的代码如何保证可维护性？Code Review流程是怎样的？"）
  * 考察协作能力（"产品经理的需求如果不合理，你会怎么推回去？"）
  * 考察深度和造轮子（"为什么不用开源库而要自己写这个组件？底层原理是什么？"）
"""
        elif "国企" in company_type or "事业单位" in company_type:
            company_context_prompt = """
【公司特定背景 - 国企/稳定性企业】
- ⚠️ 核心痛点：稳定压倒一切，层级森严。
- 面试官心态：我们需要踏实肯干、听话、不惹事的人，技术不用最顶尖但要稳。
- 提问倾向：
  * 考察文字功底和汇报能力
  * 考察稳定性（"你能在这个岗位干5年以上吗？"）
  * 考察对加班/奉献的看法
"""
        else:
            company_context_prompt = """
【公司特定背景 - 中型成长企业】
- 注重实效和业务落地，要求技术能快速转化为业务价值。
- 关注解决实际问题的能力，而不是过分追求理论。
"""

        # 压力面试专用提示
        pressure_instruction = ""
        if is_pressure:
            pressure_instruction = """
【🔥 压力面试模式 - 必须要非常有压迫感！】
你需要扮演一个**非常挑剔、甚至带有攻击性**的面试官。
- **态度**：冷淡、怀疑、不耐烦、直接打断。
- **常用话术**：
  * "我不觉得这个项目有什么难点，这不就是CRUD吗？"
  * "你说了半天由于时间关系我打断一下，你直接告诉我结果。"
  * "你的简历上说精通这个，但我看你的回答很肤浅啊。"
  * "如果是这样的话，我觉得你可能不太适合我们这个岗位。"
- **目标**：击穿候选人的心理防线，看他在被否定时是否还能逻辑清晰地反驳。
"""

        # 系统提示词构建
        system_prompt = f"""你是一个经验丰富、眼光犀利的面试官。你的目标是通过精心设计的问题，看穿候选人的真实水平和性格。

【面试背景】
- 公司: {company_info.get('name', '某公司')} ({company_type})
- 职位: {job_info.get('title', '应聘岗位')}
- 面试轮次: 第 {round_num} 轮
- 面试官身份: {interviewer_role}
- 压力面试: {"是" if is_pressure else "否"}

{round_focus}
{company_context_prompt}
{pressure_instruction}

【生成要求 - 拒绝平庸】
1. **场景化提问**：不要干巴巴地问"你有什么缺点"。要结合具体工作场景！
   - ❌ 差："你遇到过什么困难？"
   - ✅ 好："假设明天就要上线了，突然发现一个严重Bug，但是修复在这个Bug可能会导致数据丢失，而不修复会影响用户体验，这时候只有你一个人在，你会怎么做？"
2. **结合公司属性**：必须参考上方的【公司特定背景】，问出符合公司调性的问题。如果是初创公司就问抗压，大厂就问流程。
3. **针对性追问**：参考【候选人信息】，针对简历里的疑点进行提问。如果简历很完美，就找茬。
4. **问题长度**：问题必须包含**背景描述**和**具体情境**，长度不少于50字，让问题听起来像真人在说话，有语气和情绪。

【候选人信息】
- 姓名: {player_info.get('name', '求职者')}
- 年龄: {player_info.get('age', 25)}岁
- 学历: {player_info.get('education', '本科')} - {player_info.get('school', '某大学')}
- 专业: {player_info.get('major', '计算机')}
- 工作经验: {player_info.get('experience', 0)}年
- 技能: {', '.join(player_info.get('skills', []))}
- 项目经历: {', '.join(player_info.get('projects', [])[:2]) if player_info.get('projects') else '无'}
{history_summary}

【生成要求】
1. **回顾与点评**：首先，针对【玩家上次的回答内容】（如果有），生成一段简短、犀利的点评（analysis）。
   - 如果是压力面，要挑刺、质疑或者冷嘲热讽。
   - 如果是普通面，要指出回答中的亮点或不足。
2. **新问题**：根据当前背景和历史对话，生成一个**全新的**面试问题。
3. **绝对不要**问与历史相似的问题！每次都要换一个完全不同的方向。
4. **生成示例回答**：
   - 必须是候选人（玩家）的回答，而不是面试官的问题！
   - **即使在压力面，也要回答得不卑不亢、有理有据**。
   - **必须包含具体数据**（如：QPS提升50%，由3人扩充到10人团队）。
   - **必须包含具体场景**（如：在双11大促期间...）。

【返回格式】
{{
    "analysis": "面试官对上一轮回答的点评（1-2句话，要符合人设）",
    "question": "面试官的新问题（包含场景描述）",
    "sample_answer": "给玩家参考的高质量回答（数据详实、逻辑严密）",
    "type": "technical|behavioral|personal|stress",
    "display_type": "问题分类名(如: 架构设计)"
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
                max_tokens=1000,
                temperature=0.9,  # 提高温度增加多样性
                stream=False
            )

            response_text = response.choices[0].message.content
            response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL)
            
            json_match = re.search(r'\{[\s\S]+\}', response_text)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Qwen API 错误 (generate_interview_question): {e}")
            
        # 备用问题 - 也添加多样性
        import random
        fallback_questions = [
            ("请简单介绍一下你自己。", "自我介绍", "personal"),
            ("你最大的优点和缺点是什么？", "优缺点分析", "behavioral"),
            ("为什么想加入我们公司？", "求职动机", "behavioral"),
            ("你的职业规划是什么？", "职业规划", "personal"),
            ("描述一个你解决过的难题。", "问题解决", "technical"),
        ]
        q, display, qtype = random.choice(fallback_questions)
        
        return {
            "analysis": "（连接略有波动，面试官正在查阅题库...）",
            "question": q,
            "sample_answer": "建议结合自身经历，使用STAR法则（情境、任务、行动、结果）进行结构化回答。",
            "type": qtype,
            "display_type": display
        }

    async def generate_interview_question_stream(
        self,
        player_info: dict,
        company_info: dict,
        job_info: dict,
        round_info: dict,
        conversation_history: List[dict] = None
    ):
        """
        流式生成面试问题 - 防止超时
        使用与非流式版本相同的prompt，但返回异步生成器
        """
        # 直接调用非流式版本，封装成流式响应
        # 这样可以复用所有逻辑，同时防止超时
        try:
            result = await self.generate_interview_question(
                player_info=player_info,
                company_info=company_info,
                job_info=job_info,
                round_info=round_info,
                conversation_history=conversation_history
            )
            # 将结果转为JSON字符串返回
            yield json.dumps(result, ensure_ascii=False)
        except Exception as e:
            print(f"流式生成失败: {e}")
            # 返回备用问题
            fallback = {
                "question": "你为什么想加入我们公司？",
                "sample_answer": "贵公司的发展前景和企业文化让我非常感兴趣...",
                "type": "behavioral",
                "display_type": "求职动机"
            }
            yield json.dumps(fallback, ensure_ascii=False)

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
