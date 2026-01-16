/**
 * API 服务
 * 与后端通信，获取 AI 对话响应
 */

// 使用相对路径，在本地开发时代理到后端，部署时使用同一域名
const API_BASE_URL = import.meta.env.MODE === 'development'
    ? 'http://localhost:8000'
    : '';  // 生产环境使用相对路径

export interface ChatRequest {
    npc_name: string;
    player_message: string;
    conversation_history?: { role: string; content: string }[];
    player_info?: {
        name: string;
        position: string;
        day: number;
    };
    workplace_status?: {
        kpi: number;
        stress: number;
        reputation: number;
        faction: string | null;
    };
}

export interface ChatResponse {
    npc_response: string;
    emotion: string;
    relationship_change: number;
}

export interface TaskResponse {
    tasks: {
        id: string;
        title: string;
        description: string;
        difficulty: string;
        reward: number;
        deadline: string;
        type: string;
    }[];
    daily_message: string;
}

class APIService {
    private baseUrl: string;
    private conversationHistory: Map<string, { role: string; content: string }[]> = new Map();

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * 与 NPC 对话
     */
    async chatWithNPC(
        npcName: string,
        playerMessage: string,
        playerInfo?: ChatRequest['player_info'],
        workplaceStatus?: ChatRequest['workplace_status']
    ): Promise<ChatResponse> {
        // 获取对话历史
        const history = this.conversationHistory.get(npcName) || [];

        const request: ChatRequest = {
            npc_name: npcName,
            player_message: playerMessage,
            conversation_history: history,
            player_info: playerInfo,
            workplace_status: workplaceStatus
        };

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            const result: ChatResponse = await response.json();

            // 更新对话历史
            history.push({ role: 'player', content: playerMessage });
            history.push({ role: npcName, content: result.npc_response });

            // 只保留最近10条
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }
            this.conversationHistory.set(npcName, history);

            return result;
        } catch (error) {
            console.error('API 调用失败:', error);
            // 返回备用响应
            return this.getFallbackResponse(npcName);
        }
    }

    /**
     * 生成每日任务
     */
    async generateTasks(playerInfo: ChatRequest['player_info']): Promise<TaskResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_info: playerInfo,
                    current_time: new Date().toTimeString().slice(0, 5)
                }),
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('任务生成失败:', error);
            return this.getFallbackTasks();
        }
    }

    /**
     * 清除对话历史
     */
    clearHistory(npcName?: string): void {
        if (npcName) {
            this.conversationHistory.delete(npcName);
        } else {
            this.conversationHistory.clear();
        }
    }

    /**
     * 备用响应（API 不可用时）
     */
    private getFallbackResponse(npcName: string): ChatResponse {
        const responses: { [key: string]: string[] } = {
            '张经理': ['嗯，继续努力。', '有什么事？', '工作进度如何？'],
            '李同事': ['嘿~', '最近忙吗？', '听说了吗...'],
            '王前辈': ['年轻人，慢慢来。', '有什么问题？', '想当年...']
        };

        const npcResponses = responses[npcName] || responses['李同事'];
        return {
            npc_response: npcResponses[Math.floor(Math.random() * npcResponses.length)],
            emotion: 'neutral',
            relationship_change: 0
        };
    }

    /**
     * 备用任务
     */
    private getFallbackTasks(): TaskResponse {
        return {
            daily_message: '新的一天开始了！',
            tasks: [
                {
                    id: 'task_001',
                    title: '完成季度报告',
                    description: '整理数据，完成报告初稿',
                    difficulty: 'medium',
                    reward: 200,
                    deadline: '17:00',
                    type: 'document'
                }
            ]
        };
    }
}

// 全局单例
export const apiService = new APIService();
