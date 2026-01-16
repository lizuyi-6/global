"""
Claude API 服务
负责与 Anthropic Claude API 交互，提供 AI 对话和任务生成功能
"""

import os
from typing import List, Optional
from anthropic import Anthropic
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class ClaudeService:
    """Claude API 服务封装"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("警告: ANTHROPIC_API_KEY 未设置，AI 功能将使用模拟响应")
            self.client = None
        else:
            self.client = Anthropic(api_key=api_key)

        self.model = "claude-3-5-sonnet-20241022"  # 使用最新的 Claude 模型

    def is_available(self) -> bool:
        """检查 Claude API 是否可用"""
        return self.client is not None

    async def chat_with_npc(
        self,
        npc_name: str,
        npc_profile: dict,
        player_message: str,
        conversation_history: List[dict] = None,
        player_info: dict = None
    ) -> dict:
        """
        NPC 对话

        Args:
            npc_name: NPC 名称
            npc_profile: NPC 性格配置
            player_message: 玩家消息
            conversation_history: 对话历史
            player_info: 玩家信息

        Returns:
            包含响应内容、情绪、关系变化的字典
        """
        if not self.client:
            return self._mock_npc_response(npc_name)

        # 构建系统提示
        system_prompt = f"""你是一个职场模拟游戏中的 NPC，名叫"{npc_name}"。

【角色设定】
- 职位：{npc_profile.get('position', '员工')}
- 性格：{npc_profile.get('personality', '普通')}
- 说话风格：{npc_profile.get('speaking_style', '正常')}

【游戏背景】
这是一个职场沙盒游戏，玩家扮演一个刚入职的新员工。你需要根据角色设定与玩家进行自然的对话。

【玩家信息】
{f"姓名: {player_info.get('name', '新同事')}, 职位: {player_info.get('position', '实习生')}, 入职第{player_info.get('day', 1)}天" if player_info else "新入职员工"}

【回复要求】
1. 保持角色性格一致
2. 回复简洁自然，像真实职场对话
3. 可以适当透露一些"办公室政治"或"工作技巧"
4. 在回复末尾用 JSON 格式标注情绪和关系变化：
   {{"emotion": "happy|neutral|angry|sad|surprised", "relationship_change": -5到+5的整数}}
"""

        # 构建消息列表
        messages = []
        if conversation_history:
            for msg in conversation_history[-10:]:  # 只保留最近10条
                messages.append({
                    "role": "user" if msg.get("role") == "player" else "assistant",
                    "content": msg.get("content", "")
                })

        messages.append({"role": "user", "content": player_message})

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=500,
                system=system_prompt,
                messages=messages
            )

            response_text = response.content[0].text

            # 解析情绪和关系变化
            emotion = "neutral"
            relationship_change = 0

            import json
            import re
            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                try:
                    meta = json.loads(json_match.group())
                    emotion = meta.get("emotion", "neutral")
                    relationship_change = meta.get("relationship_change", 0)
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
            print(f"Claude API 错误: {e}")
            return self._mock_npc_response(npc_name)

    async def generate_tasks(self, player_info: dict, current_time: str = "09:00") -> dict:
        """
        生成每日工作任务

        Args:
            player_info: 玩家信息
            current_time: 当前游戏时间

        Returns:
            包含任务列表和每日消息的字典
        """
        if not self.client:
            return self._mock_tasks()

        system_prompt = f"""你是一个职场模拟游戏的任务生成器。

【玩家信息】
- 姓名: {player_info.get('name', '新员工')}
- 职位: {player_info.get('position', '实习生')}
- 入职天数: 第{player_info.get('day', 1)}天
- 当前时间: {current_time}

【任务生成要求】
根据玩家的职位和入职时间，生成3-5个合理的工作任务。任务应该：
1. 符合职位级别（实习生的任务应该简单一些）
2. 有不同的难度和类型
3. 有合理的截止时间和奖励

请用以下 JSON 格式返回：
{{
    "daily_message": "每日问候语",
    "tasks": [
        {{
            "id": "task_001",
            "title": "任务标题",
            "description": "详细描述",
            "difficulty": "easy|medium|hard",
            "reward": 奖励金额(数字),
            "deadline": "截止时间如17:00",
            "type": "document|meeting|communication|emergency"
        }}
    ]
}}
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": "请为今天生成工作任务"}]
            )

            import json
            import re
            response_text = response.content[0].text
            json_match = re.search(r'\{[\s\S]+\}', response_text)
            if json_match:
                return json.loads(json_match.group())

        except Exception as e:
            print(f"Claude API 错误: {e}")

        return self._mock_tasks()

    def _mock_npc_response(self, npc_name: str) -> dict:
        """模拟 NPC 响应（API 不可用时使用）"""
        import random

        mock_responses = {
            "张经理": [
                "工作进展如何？记得按时提交报告。",
                "下周有个重要项目，需要你配合。",
                "有问题随时来找我，但先自己想想解决方案。"
            ],
            "李同事": [
                "嘿！新来的！中午一起吃饭吗？",
                "告诉你个八卦，听说隔壁部门要裁员了...",
                "这个任务我之前做过，我教你个技巧~"
            ],
            "王前辈": [
                "年轻人，慢慢来，不要急。",
                "这个问题嘛...就像种树，先把根扎稳。",
                "有什么不懂的可以问我，我当年也是这么过来的。"
            ]
        }

        responses = mock_responses.get(npc_name, ["你好。"])

        return {
            "npc_response": random.choice(responses),
            "emotion": "neutral",
            "relationship_change": random.randint(-1, 2)
        }

    def _mock_tasks(self) -> dict:
        """模拟任务生成（API 不可用时使用）"""
        import random

        return {
            "daily_message": random.choice([
                "新的一天开始了！加油打工人！",
                "今天任务不少，合理安排时间哦。",
                "听说今天有重要会议，做好准备！"
            ]),
            "tasks": [
                {
                    "id": "task_001",
                    "title": "完成季度报告初稿",
                    "description": "整理本季度的销售数据，完成报告初稿。",
                    "difficulty": "medium",
                    "reward": 200,
                    "deadline": "17:00",
                    "type": "document"
                },
                {
                    "id": "task_002",
                    "title": "参加项目周会",
                    "description": "下午3点在会议室B参加项目进度周会。",
                    "difficulty": "easy",
                    "reward": 50,
                    "deadline": "15:00",
                    "type": "meeting"
                },
                {
                    "id": "task_003",
                    "title": "回复客户邮件",
                    "description": "有3封客户询问邮件需要回复。",
                    "difficulty": "easy",
                    "reward": 80,
                    "deadline": "12:00",
                    "type": "communication"
                }
            ]
        }


# 全局服务实例
claude_service = ClaudeService()
