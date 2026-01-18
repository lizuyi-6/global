/**
 * API 服务
 * 与后端通信，获取 AI 对话响应
 */

// 使用相对路径，在本地开发时代理到后端，部署时使用同一域名
const API_BASE_URL = import.meta.env.MODE === 'development'
    ? 'http://localhost:7860'
    : '';  // 生产环境使用相对路径

export interface InterviewQuestion {
    analysis?: string;
    question: string;
    sample_answer: string;
    type: string;
    display_type: string;
}

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
     * 生成招聘职位列表
     */
    async generateJobs(playerResume: any, count: number = 15): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/jobs/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_resume: playerResume,
                    count: count
                }),
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('职位生成失败:', error);
            return [];
        }
    }

    /**
     * 生成面试问题 (带 15 秒超时 - 增加时间因为增强 prompt 更复杂)
     */
    async generateInterviewQuestion(
        playerInfo: any,
        companyInfo: any,
        jobInfo: any,
        roundInfo: any,
        history: any[] = [],
        action: string = 'full'
    ): Promise<any> {
        // 设置 60 秒超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(`${this.baseUrl}/api/interview/question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    player_info: playerInfo,
                    company_info: companyInfo,
                    job_info: jobInfo,
                    round_info: roundInfo,
                    conversation_history: history,
                    action: action
                }),
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            // 区分超时和其他错误
            if ((error as Error).name === 'AbortError') {
                console.warn('面试问题生成超时 (15秒)，使用本地题库');
            } else {
                console.error('面试问题生成失败:', error);
            }

            // 返回多样化的备用问题
            const fallbacks = [
                {
                    question: "你为什么从上一家公司离职？",
                    type: "trap",
                    display_type: "离职原因",
                    sample: "我在上一家公司工作了两年，主要负责后端开发。虽然团队很好，但我希望接触更多高并发架构的挑战，而贵公司的业务规模正是我向往的。"
                },
                {
                    question: "你觉得自己最大的缺点是什么？",
                    type: "trap",
                    display_type: "自我认知",
                    sample: "我有时候对自己要求过于完美，导致项目初期进度较慢。现在我会设定明确的时间节点，在保证质量的前提下优先完成核心功能。"
                },
                {
                    question: "如果领导的决定明显是错的，你会怎么做？",
                    type: "behavioral",
                    display_type: "价值观",
                    sample: "我会先私下与领导沟通，用数据和事实说明我的顾虑。如果领导坚持，我会保留意见并全力执行，同时做好风险预案。"
                },
                {
                    question: "描述一次你和同事发生冲突的经历",
                    type: "behavioral",
                    display_type: "冲突处理",
                    sample: "之前在API接口定义上和前端同事有分歧。我通过画时序图梳理了业务流程，发现是我们对需求理解不一致。统一认知后，问题很快就解决了。"
                },
            ];
            const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

            return {
                question: fallback.question,
                sample_answer: fallback.sample,
                type: fallback.type,
                display_type: fallback.display_type
            };
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

    /**
     * 执行玩家行动 - 调用 /api/action
     */
    async executeAction(
        action: string,
        playerInfo?: { name: string; position: string; day: number },
        workplaceStatus?: { kpi: number; stress: number; reputation: number },
        visibleObjects: string[] = [],
        visibleNpcs: string[] = []
    ): Promise<ActionResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    player_info: playerInfo,
                    workplace_status: workplaceStatus,
                    visible_objects: visibleObjects,
                    visible_npcs: visibleNpcs
                }),
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('执行行动失败:', error);
            return this.getFallbackAction(action);
        }
    }

    /**
     * 备用行动响应
     */
    private getFallbackAction(action: string): ActionResponse {
        return {
            feasible: true,
            description: `你尝试${action}...`,
            animations: [{ type: 'generic', duration: 1000 }],
            npc_reactions: {},
            state_changes: { mood: 0, stress: 0, work_progress: 0, relationships: {} },
            dialogue: null
        };
    }
}

// 行动响应接口
export interface ActionResponse {
    feasible: boolean;
    description: string;
    animations: Array<{
        type: string;
        target?: string;
        object?: string;
        duration?: number;
        delay?: number;
        variant?: string;
    }>;
    npc_reactions: { [npcName: string]: string };
    state_changes: {
        mood?: number;
        stress?: number;
        work_progress?: number;
        relationships?: { [npcName: string]: number };
    };
    dialogue: string | null;
}

// 全局单例
export const apiService = new APIService();
