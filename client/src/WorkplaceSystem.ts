/**
 * 职场生态系统
 * 包含晋升系统、办公室政治、职场事件（含霸凌）
 */

// ========== 类型定义 ==========

/** 职位等级 */
export interface Position {
    level: number;          // 等级 1-10
    title: string;          // 职位名称
    salary: number;         // 基础薪资
    influence: number;      // 影响力
    requiredKPI: number;    // 晋升所需KPI
    requiredDays: number;   // 晋升所需天数
}

/** 绩效数据 */
export interface Performance {
    kpiScore: number;           // KPI分数 0-100
    taskCompletion: number;     // 任务完成率
    attendanceRate: number;     // 出勤率
    socialScore: number;        // 人际关系分
    bossImpression: number;     // 上司印象分
    consecutiveGoodDays: number; // 连续良好表现天数
    warnings: number;           // 警告次数
    lastReviewDay: number;      // 上次考核日
}

/** 派系 */
export interface Faction {
    id: string;
    name: string;
    leader: string;           // 派系领袖（NPC名字）
    members: string[];        // 成员列表
    power: number;            // 势力值 0-100
    attitude: 'friendly' | 'neutral' | 'hostile';  // 对玩家态度
}

/** 职场事件 */
export interface WorkplaceEvent {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'critical';
    category: 'promotion' | 'politics' | 'bullying' | 'opportunity' | 'crisis' | 'social';
    title: string;
    description: string;
    trigger: EventTrigger;
    choices: EventChoice[];
    probability: number;      // 发生概率 0-1
    cooldownDays: number;     // 冷却天数
    minLevel: number;         // 最低等级要求
    maxLevel: number;         // 最高等级限制
}

/** 事件触发条件 */
export interface EventTrigger {
    type: 'random' | 'kpi_low' | 'kpi_high' | 'relationship' | 'day' | 'position' | 'faction';
    condition?: string;       // 具体条件
}

/** 事件选项 */
export interface EventChoice {
    text: string;
    requirements?: {          // 选项要求
        money?: number;
        relationship?: { npc: string; min: number };
        position?: number;
        faction?: string;
    };
    effects: EventEffect[];
    nextEventId?: string;     // 触发后续事件
}

/** 事件效果 */
export interface EventEffect {
    type: 'money' | 'kpi' | 'relationship' | 'position' | 'faction' | 'stress' | 'reputation' | 'warning' | 'fired';
    target?: string;          // 目标（NPC名字或派系ID）
    value: number;
    description?: string;
}

/** 玩家职场状态 */
export interface WorkplaceStatus {
    position: Position;
    performance: Performance;
    currentFaction: string | null;  // 当前所属派系
    stress: number;           // 压力值 0-100
    reputation: number;       // 名声 -100 到 100
    isOnProbation: boolean;   // 是否在试用期/观察期
    probationEndDay: number;
    activeBullying: BullyingEvent[];  // 当前遭受的霸凌
}

/** 霸凌事件 */
export interface BullyingEvent {
    id: string;
    perpetrator: string;      // 施暴者
    type: 'isolation' | 'credit_steal' | 'sabotage' | 'verbal' | 'overwork';
    severity: number;         // 严重程度 1-5
    startDay: number;
    duration: number;         // 持续天数
    effects: EventEffect[];
}

// ========== 职位等级定义 ==========

export const POSITIONS: Position[] = [
    { level: 1, title: '实习生', salary: 3000, influence: 5, requiredKPI: 0, requiredDays: 0 },
    { level: 2, title: '初级员工', salary: 5000, influence: 10, requiredKPI: 60, requiredDays: 30 },
    { level: 3, title: '员工', salary: 8000, influence: 20, requiredKPI: 65, requiredDays: 60 },
    { level: 4, title: '资深员工', salary: 12000, influence: 35, requiredKPI: 70, requiredDays: 90 },
    { level: 5, title: '组长', salary: 18000, influence: 50, requiredKPI: 75, requiredDays: 150 },
    { level: 6, title: '主管', salary: 25000, influence: 65, requiredKPI: 80, requiredDays: 240 },
    { level: 7, title: '经理', salary: 35000, influence: 80, requiredKPI: 85, requiredDays: 365 },
    { level: 8, title: '高级经理', salary: 50000, influence: 90, requiredKPI: 90, requiredDays: 500 },
    { level: 9, title: '总监', salary: 80000, influence: 95, requiredKPI: 95, requiredDays: 730 },
    { level: 10, title: '副总裁', salary: 150000, influence: 100, requiredKPI: 98, requiredDays: 1000 },
];

// ========== 派系定义 ==========

export const FACTIONS: Faction[] = [
    {
        id: 'management',
        name: '管理派',
        leader: '张经理',
        members: ['张经理'],
        power: 60,
        attitude: 'neutral'
    },
    {
        id: 'veterans',
        name: '元老派',
        leader: '王前辈',
        members: ['王前辈'],
        power: 40,
        attitude: 'friendly'
    },
    {
        id: 'newcomers',
        name: '新人帮',
        leader: '李同事',
        members: ['李同事'],
        power: 20,
        attitude: 'friendly'
    }
];

// ========== 职场事件库 ==========

export const WORKPLACE_EVENTS: WorkplaceEvent[] = [
    // ========== 正面事件 ==========
    {
        id: 'promotion_opportunity',
        type: 'positive',
        category: 'promotion',
        title: '晋升机会',
        description: '张经理找你谈话，表示有一个晋升机会，但需要你在接下来的项目中表现出色。',
        trigger: { type: 'kpi_high', condition: 'kpi >= 80' },
        probability: 0.3,
        cooldownDays: 30,
        minLevel: 1,
        maxLevel: 8,
        choices: [
            {
                text: '全力以赴争取',
                effects: [
                    { type: 'kpi', value: 5, description: 'KPI目标提高' },
                    { type: 'stress', value: 15, description: '压力增加' },
                    { type: 'relationship', target: '张经理', value: 5 }
                ]
            },
            {
                text: '保持现状，稳扎稳打',
                effects: [
                    { type: 'relationship', target: '张经理', value: -5 },
                    { type: 'reputation', value: -5, description: '被认为缺乏进取心' }
                ]
            }
        ]
    },
    {
        id: 'mentor_guidance',
        type: 'positive',
        category: 'opportunity',
        title: '前辈指点',
        description: '王前辈主动找你，说愿意在工作上指导你。',
        trigger: { type: 'relationship', condition: '王前辈 >= 20' },
        probability: 0.4,
        cooldownDays: 14,
        minLevel: 1,
        maxLevel: 5,
        choices: [
            {
                text: '虚心接受指导',
                effects: [
                    { type: 'kpi', value: 10, description: '工作能力提升' },
                    { type: 'relationship', target: '王前辈', value: 10 }
                ]
            },
            {
                text: '礼貌婉拒',
                effects: [
                    { type: 'relationship', target: '王前辈', value: -10 }
                ]
            }
        ]
    },
    {
        id: 'bonus_reward',
        type: 'positive',
        category: 'opportunity',
        title: '绩效奖金',
        description: '由于上个月表现优秀，公司决定给你发放额外奖金！',
        trigger: { type: 'kpi_high', condition: 'kpi >= 85' },
        probability: 0.5,
        cooldownDays: 30,
        minLevel: 2,
        maxLevel: 10,
        choices: [
            {
                text: '感谢公司',
                effects: [
                    { type: 'money', value: 2000, description: '获得奖金' },
                    { type: 'reputation', value: 5 }
                ]
            }
        ]
    },

    // ========== 办公室政治事件 ==========
    {
        id: 'faction_invitation',
        type: 'neutral',
        category: 'politics',
        title: '派系邀请',
        description: '李同事私下找你，说他们几个新人准备抱团，问你要不要加入。',
        trigger: { type: 'day', condition: 'day >= 15' },
        probability: 0.3,
        cooldownDays: 60,
        minLevel: 1,
        maxLevel: 4,
        choices: [
            {
                text: '加入新人帮',
                effects: [
                    { type: 'faction', target: 'newcomers', value: 1, description: '加入新人帮' },
                    { type: 'relationship', target: '李同事', value: 15 },
                    { type: 'relationship', target: '张经理', value: -10, description: '张经理不喜欢拉帮结派' }
                ]
            },
            {
                text: '委婉拒绝',
                effects: [
                    { type: 'relationship', target: '李同事', value: -5 }
                ]
            },
            {
                text: '告诉张经理',
                effects: [
                    { type: 'relationship', target: '张经理', value: 10 },
                    { type: 'relationship', target: '李同事', value: -30, description: '李同事视你为叛徒' },
                    { type: 'reputation', value: -15, description: '被认为是告密者' }
                ]
            }
        ]
    },
    {
        id: 'power_struggle',
        type: 'neutral',
        category: 'politics',
        title: '权力暗斗',
        description: '你无意中发现张经理和王前辈在争夺一个重要项目的主导权。他们都在拉拢人。',
        trigger: { type: 'day', condition: 'day >= 30' },
        probability: 0.25,
        cooldownDays: 45,
        minLevel: 2,
        maxLevel: 6,
        choices: [
            {
                text: '站队张经理',
                effects: [
                    { type: 'relationship', target: '张经理', value: 20 },
                    { type: 'relationship', target: '王前辈', value: -25 },
                    { type: 'faction', target: 'management', value: 1 }
                ]
            },
            {
                text: '站队王前辈',
                effects: [
                    { type: 'relationship', target: '王前辈', value: 20 },
                    { type: 'relationship', target: '张经理', value: -25 },
                    { type: 'faction', target: 'veterans', value: 1 }
                ]
            },
            {
                text: '保持中立',
                effects: [
                    { type: 'relationship', target: '张经理', value: -5 },
                    { type: 'relationship', target: '王前辈', value: -5 },
                    { type: 'stress', value: 10, description: '两边都不讨好，压力增加' }
                ]
            }
        ]
    },
    {
        id: 'gossip_spreading',
        type: 'negative',
        category: 'politics',
        title: '流言蜚语',
        description: '你听说有人在背后议论你，说你是靠关系进来的。',
        trigger: { type: 'random' },
        probability: 0.2,
        cooldownDays: 20,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '找出造谣者当面对质',
                effects: [
                    { type: 'reputation', value: 10, description: '展现了勇气' },
                    { type: 'stress', value: 15 },
                    { type: 'relationship', target: '李同事', value: -10, description: '可能得罪人' }
                ]
            },
            {
                text: '用实力说话，不理会',
                effects: [
                    { type: 'kpi', value: 5, description: '更加努力工作' },
                    { type: 'stress', value: 10 }
                ]
            },
            {
                text: '向张经理诉苦',
                effects: [
                    { type: 'relationship', target: '张经理', value: -5, description: '张经理不喜欢处理这种事' },
                    { type: 'reputation', value: -5, description: '被认为爱打小报告' }
                ]
            }
        ]
    },

    // ========== 职场霸凌事件 ==========
    {
        id: 'credit_stealing',
        type: 'negative',
        category: 'bullying',
        title: '功劳被抢',
        description: '你辛苦完成的报告，被同事拿去邀功了。张经理以为是他做的，还表扬了他。',
        trigger: { type: 'kpi_high', condition: 'kpi >= 70' },
        probability: 0.25,
        cooldownDays: 30,
        minLevel: 1,
        maxLevel: 5,
        choices: [
            {
                text: '当众揭穿',
                effects: [
                    { type: 'reputation', value: 15, description: '维护了自己' },
                    { type: 'relationship', target: '李同事', value: -40, description: '彻底得罪' },
                    { type: 'stress', value: 20 }
                ]
            },
            {
                text: '私下找张经理说明',
                effects: [
                    { type: 'relationship', target: '张经理', value: 5 },
                    { type: 'kpi', value: 5, description: '功劳被认可' },
                    { type: 'relationship', target: '李同事', value: -15 }
                ]
            },
            {
                text: '忍气吞声',
                effects: [
                    { type: 'stress', value: 25, description: '压力暴增' },
                    { type: 'reputation', value: -10, description: '被认为好欺负' },
                    { type: 'kpi', value: -10, description: '功劳被抢' }
                ],
                nextEventId: 'continued_bullying'
            }
        ]
    },
    {
        id: 'continued_bullying',
        type: 'negative',
        category: 'bullying',
        title: '变本加厉',
        description: '看你上次没有反抗，那个同事开始频繁把杂活推给你，还在背后说你坏话。',
        trigger: { type: 'random' },
        probability: 1,
        cooldownDays: 0,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '忍无可忍，向HR举报',
                effects: [
                    { type: 'stress', value: -20, description: '终于发泄出来' },
                    { type: 'relationship', target: '李同事', value: -50 },
                    { type: 'reputation', value: -5, description: '被认为不好相处' }
                ]
            },
            {
                text: '寻求王前辈帮助',
                requirements: { relationship: { npc: '王前辈', min: 30 } },
                effects: [
                    { type: 'relationship', target: '王前辈', value: 10 },
                    { type: 'stress', value: -15 },
                    { type: 'reputation', value: 5, description: '有人撑腰了' }
                ]
            },
            {
                text: '继续忍耐',
                effects: [
                    { type: 'stress', value: 30, description: '压力濒临崩溃' },
                    { type: 'kpi', value: -15, description: '工作状态受影响' }
                ]
            }
        ]
    },
    {
        id: 'isolation',
        type: 'negative',
        category: 'bullying',
        title: '被孤立',
        description: '你发现最近同事们聚餐、讨论都不叫你了。午餐时，你一个人坐在角落。',
        trigger: { type: 'relationship', condition: 'average < 0' },
        probability: 0.3,
        cooldownDays: 30,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '主动示好，请大家喝奶茶',
                requirements: { money: 200 },
                effects: [
                    { type: 'money', value: -200 },
                    { type: 'relationship', target: '李同事', value: 15 },
                    { type: 'reputation', value: 10 }
                ]
            },
            {
                text: '专注工作，不在乎',
                effects: [
                    { type: 'stress', value: 15 },
                    { type: 'kpi', value: 5, description: '把精力放在工作上' }
                ]
            },
            {
                text: '找张经理反映',
                effects: [
                    { type: 'relationship', target: '张经理', value: -10, description: '张经理觉得你事多' },
                    { type: 'reputation', value: -10 }
                ]
            }
        ]
    },
    {
        id: 'sabotage',
        type: 'negative',
        category: 'bullying',
        title: '暗中使绊',
        description: '你发现提交的重要文件被人改过了，里面有明显错误，幸好你在最后检查时发现了。',
        trigger: { type: 'random' },
        probability: 0.15,
        cooldownDays: 45,
        minLevel: 2,
        maxLevel: 10,
        choices: [
            {
                text: '保存证据，向上级汇报',
                effects: [
                    { type: 'relationship', target: '张经理', value: 5 },
                    { type: 'stress', value: 15 },
                    { type: 'reputation', value: 5 }
                ]
            },
            {
                text: '悄悄改回来，不声张',
                effects: [
                    { type: 'stress', value: 10 },
                    { type: 'kpi', value: 0, description: '问题解决了' }
                ]
            },
            {
                text: '公开质问是谁干的',
                effects: [
                    { type: 'reputation', value: -5, description: '显得咄咄逼人' },
                    { type: 'stress', value: 20 }
                ]
            }
        ]
    },
    {
        id: 'overtime_abuse',
        type: 'negative',
        category: 'bullying',
        title: '强制加班',
        description: '张经理要求你这周每天加班到10点，而其他同事却可以正常下班。',
        trigger: { type: 'position', condition: 'level <= 3' },
        probability: 0.35,
        cooldownDays: 14,
        minLevel: 1,
        maxLevel: 3,
        choices: [
            {
                text: '服从安排',
                effects: [
                    { type: 'kpi', value: 10, description: '工作量大增' },
                    { type: 'stress', value: 25, description: '身心俱疲' },
                    { type: 'relationship', target: '张经理', value: 5 }
                ]
            },
            {
                text: '委婉表示身体不适',
                effects: [
                    { type: 'relationship', target: '张经理', value: -15 },
                    { type: 'reputation', value: -5, description: '被认为不够努力' }
                ]
            },
            {
                text: '询问加班费',
                effects: [
                    { type: 'relationship', target: '张经理', value: -20, description: '张经理很不高兴' },
                    { type: 'money', value: 500, description: '勉强拿到一点加班费' }
                ]
            }
        ]
    },
    {
        id: 'verbal_abuse',
        type: 'negative',
        category: 'bullying',
        title: '言语羞辱',
        description: '在部门会议上，张经理当众批评你的工作，用词非常尖刻，让你下不来台。',
        trigger: { type: 'kpi_low', condition: 'kpi < 60' },
        probability: 0.4,
        cooldownDays: 20,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '当场道歉，承诺改进',
                effects: [
                    { type: 'stress', value: 30, description: '非常难堪' },
                    { type: 'reputation', value: -15, description: '同事们都看到了' },
                    { type: 'relationship', target: '张经理', value: 5, description: '态度还不错' }
                ]
            },
            {
                text: '据理力争',
                effects: [
                    { type: 'relationship', target: '张经理', value: -30, description: '彻底惹怒张经理' },
                    { type: 'reputation', value: 10, description: '同事们暗暗佩服' },
                    { type: 'stress', value: 20 }
                ]
            },
            {
                text: '沉默不语',
                effects: [
                    { type: 'stress', value: 35, description: '憋在心里更难受' },
                    { type: 'reputation', value: -10 }
                ]
            }
        ]
    },

    // ========== 危机事件 ==========
    {
        id: 'layoff_rumor',
        type: 'critical',
        category: 'crisis',
        title: '裁员传闻',
        description: '公司最近业绩不好，听说要裁员。你的名字出现在了疑似裁员名单上。',
        trigger: { type: 'kpi_low', condition: 'kpi < 50' },
        probability: 0.2,
        cooldownDays: 60,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '拼命表现，争取留下',
                effects: [
                    { type: 'stress', value: 40 },
                    { type: 'kpi', value: 15, description: '疯狂工作' }
                ]
            },
            {
                text: '开始偷偷找下家',
                effects: [
                    { type: 'stress', value: 20 },
                    { type: 'kpi', value: -10, description: '分心了' }
                ]
            },
            {
                text: '找张经理打听消息',
                effects: [
                    { type: 'relationship', target: '张经理', value: -5 },
                    { type: 'stress', value: 25 }
                ]
            }
        ]
    },
    {
        id: 'performance_review',
        type: 'critical',
        category: 'crisis',
        title: '绩效考核',
        description: '季度绩效考核来了。你的KPI是 ${kpi}，${kpi >= 70 ? "还不错" : kpi >= 50 ? "刚及格" : "很危险"}。',
        trigger: { type: 'day', condition: 'day % 30 === 0' },
        probability: 1,
        cooldownDays: 30,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '接受考核结果',
                effects: [] // 根据KPI动态计算
            }
        ]
    },
    {
        id: 'project_failure',
        type: 'critical',
        category: 'crisis',
        title: '项目失败',
        description: '你参与的项目出了大问题，虽然不是你的主要责任，但你也被牵连了。',
        trigger: { type: 'random' },
        probability: 0.1,
        cooldownDays: 60,
        minLevel: 2,
        maxLevel: 10,
        choices: [
            {
                text: '主动承担部分责任',
                effects: [
                    { type: 'reputation', value: 15, description: '有担当' },
                    { type: 'kpi', value: -15 },
                    { type: 'relationship', target: '张经理', value: 10 }
                ]
            },
            {
                text: '撇清关系',
                effects: [
                    { type: 'reputation', value: -20, description: '被认为推卸责任' },
                    { type: 'relationship', target: '李同事', value: -20 }
                ]
            },
            {
                text: '提出改进方案',
                effects: [
                    { type: 'kpi', value: 5, description: '展现了能力' },
                    { type: 'reputation', value: 10 },
                    { type: 'relationship', target: '张经理', value: 15 }
                ]
            }
        ]
    },

    // ========== 社交事件 ==========
    {
        id: 'team_dinner',
        type: 'positive',
        category: 'social',
        title: '团建聚餐',
        description: '部门组织团建聚餐，费用AA。要不要参加？',
        trigger: { type: 'day', condition: 'day % 14 === 0' },
        probability: 0.6,
        cooldownDays: 14,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '参加，好好表现',
                requirements: { money: 150 },
                effects: [
                    { type: 'money', value: -150 },
                    { type: 'relationship', target: '李同事', value: 10 },
                    { type: 'relationship', target: '王前辈', value: 5 },
                    { type: 'stress', value: -10, description: '放松了一下' }
                ]
            },
            {
                text: '参加，主动买单',
                requirements: { money: 800 },
                effects: [
                    { type: 'money', value: -800 },
                    { type: 'relationship', target: '李同事', value: 25 },
                    { type: 'relationship', target: '王前辈', value: 15 },
                    { type: 'relationship', target: '张经理', value: 10 },
                    { type: 'reputation', value: 15, description: '大方' }
                ]
            },
            {
                text: '找借口不去',
                effects: [
                    { type: 'relationship', target: '李同事', value: -10 },
                    { type: 'reputation', value: -5, description: '不合群' }
                ]
            }
        ]
    },
    {
        id: 'birthday_collection',
        type: 'neutral',
        category: 'social',
        title: '生日随份子',
        description: '李同事过生日，大家在凑钱买礼物，每人100块。',
        trigger: { type: 'random' },
        probability: 0.3,
        cooldownDays: 30,
        minLevel: 1,
        maxLevel: 10,
        choices: [
            {
                text: '掏钱',
                requirements: { money: 100 },
                effects: [
                    { type: 'money', value: -100 },
                    { type: 'relationship', target: '李同事', value: 5 }
                ]
            },
            {
                text: '多出一点（200）',
                requirements: { money: 200 },
                effects: [
                    { type: 'money', value: -200 },
                    { type: 'relationship', target: '李同事', value: 15 },
                    { type: 'reputation', value: 5 }
                ]
            },
            {
                text: '找借口不出',
                effects: [
                    { type: 'relationship', target: '李同事', value: -15 },
                    { type: 'reputation', value: -10, description: '被认为小气' }
                ]
            }
        ]
    }
];

// ========== 职场系统管理器 ==========

class WorkplaceSystem {
    private status: WorkplaceStatus;
    private eventHistory: Map<string, number> = new Map(); // 事件ID -> 最后触发天数
    private listeners: ((event: WorkplaceEvent, choice?: EventChoice) => void)[] = [];

    constructor() {
        this.status = this.createInitialStatus();
    }

    private createInitialStatus(): WorkplaceStatus {
        return {
            position: POSITIONS[0],
            performance: {
                kpiScore: 60,
                taskCompletion: 0,
                attendanceRate: 100,
                socialScore: 50,
                bossImpression: 50,
                consecutiveGoodDays: 0,
                warnings: 0,
                lastReviewDay: 0
            },
            currentFaction: null,
            stress: 20,
            reputation: 0,
            isOnProbation: true,
            probationEndDay: 30,
            activeBullying: []
        };
    }

    // ========== 获取状态 ==========

    getStatus(): WorkplaceStatus {
        return { ...this.status };
    }

    getPosition(): Position {
        return { ...this.status.position };
    }

    getPerformance(): Performance {
        return { ...this.status.performance };
    }

    getStress(): number {
        return this.status.stress;
    }

    getReputation(): number {
        return this.status.reputation;
    }

    getCurrentFaction(): Faction | null {
        if (!this.status.currentFaction) return null;
        return FACTIONS.find(f => f.id === this.status.currentFaction) || null;
    }

    // ========== 状态更新 ==========

    updateKPI(change: number): void {
        this.status.performance.kpiScore = Math.max(0, Math.min(100,
            this.status.performance.kpiScore + change));
    }

    updateStress(change: number): void {
        this.status.stress = Math.max(0, Math.min(100, this.status.stress + change));

        // 压力过高的影响
        if (this.status.stress >= 80) {
            this.status.performance.kpiScore -= 5;
        }
        if (this.status.stress >= 100) {
            // 触发崩溃事件
            console.log('压力爆表！可能触发离职或病假事件');
        }
    }

    updateReputation(change: number): void {
        this.status.reputation = Math.max(-100, Math.min(100, this.status.reputation + change));
    }

    joinFaction(factionId: string): boolean {
        const faction = FACTIONS.find(f => f.id === factionId);
        if (!faction) return false;

        // 离开原派系
        if (this.status.currentFaction) {
            const oldFaction = FACTIONS.find(f => f.id === this.status.currentFaction);
            if (oldFaction) {
                oldFaction.attitude = 'hostile';
            }
        }

        this.status.currentFaction = factionId;
        faction.attitude = 'friendly';
        return true;
    }

    // ========== 晋升系统 ==========

    checkPromotion(currentDay: number): { canPromote: boolean; reason: string } {
        const nextLevel = this.status.position.level + 1;
        const nextPosition = POSITIONS.find(p => p.level === nextLevel);

        if (!nextPosition) {
            return { canPromote: false, reason: '已经是最高职位' };
        }

        if (this.status.performance.kpiScore < nextPosition.requiredKPI) {
            return { canPromote: false, reason: `KPI不足，需要${nextPosition.requiredKPI}，当前${this.status.performance.kpiScore}` };
        }

        if (currentDay < nextPosition.requiredDays) {
            return { canPromote: false, reason: `工作天数不足，需要${nextPosition.requiredDays}天` };
        }

        if (this.status.performance.warnings > 0) {
            return { canPromote: false, reason: '有警告记录，无法晋升' };
        }

        return { canPromote: true, reason: '符合晋升条件' };
    }

    promote(): boolean {
        const nextLevel = this.status.position.level + 1;
        const nextPosition = POSITIONS.find(p => p.level === nextLevel);

        if (!nextPosition) return false;

        this.status.position = nextPosition;
        this.status.stress = Math.max(0, this.status.stress - 20);
        this.status.reputation += 10;

        return true;
    }

    demote(): boolean {
        if (this.status.position.level <= 1) return false;

        const prevLevel = this.status.position.level - 1;
        const prevPosition = POSITIONS.find(p => p.level === prevLevel);

        if (!prevPosition) return false;

        this.status.position = prevPosition;
        this.status.stress += 30;
        this.status.reputation -= 15;

        return true;
    }

    // ========== 事件系统 ==========

    getAvailableEvents(currentDay: number, relationships: Map<string, number>): WorkplaceEvent[] {
        return WORKPLACE_EVENTS.filter(event => {
            // 检查等级限制
            if (this.status.position.level < event.minLevel ||
                this.status.position.level > event.maxLevel) {
                return false;
            }

            // 检查冷却
            const lastTrigger = this.eventHistory.get(event.id);
            if (lastTrigger && currentDay - lastTrigger < event.cooldownDays) {
                return false;
            }

            // 检查触发条件
            return this.checkTrigger(event.trigger, currentDay, relationships);
        });
    }

    private checkTrigger(trigger: EventTrigger, currentDay: number, relationships: Map<string, number>): boolean {
        switch (trigger.type) {
            case 'random':
                return true;
            case 'kpi_low':
                return this.status.performance.kpiScore < 60;
            case 'kpi_high':
                return this.status.performance.kpiScore >= 75;
            case 'relationship':
                if (trigger.condition) {
                    const [npc, value] = trigger.condition.split(' >= ');
                    const rel = relationships.get(npc) || 0;
                    return rel >= parseInt(value);
                }
                return false;
            case 'day':
                if (trigger.condition) {
                    // 简化处理
                    return currentDay >= 15;
                }
                return false;
            case 'position':
                return true;
            default:
                return true;
        }
    }

    triggerRandomEvent(currentDay: number, relationships: Map<string, number>): WorkplaceEvent | null {
        const available = this.getAvailableEvents(currentDay, relationships);

        // 按概率筛选
        const triggered = available.filter(e => Math.random() < e.probability);

        if (triggered.length === 0) return null;

        // 随机选一个
        const event = triggered[Math.floor(Math.random() * triggered.length)];
        this.eventHistory.set(event.id, currentDay);

        return event;
    }

    applyEventChoice(event: WorkplaceEvent, choiceIndex: number,
        gameState: { addCash: (n: number, r: string) => void; updateRelationship: (n: string, c: number) => void }
    ): EventEffect[] {
        const choice = event.choices[choiceIndex];
        if (!choice) return [];

        const effects = choice.effects;

        effects.forEach(effect => {
            switch (effect.type) {
                case 'money':
                    gameState.addCash(effect.value, effect.description || '事件');
                    break;
                case 'kpi':
                    this.updateKPI(effect.value);
                    break;
                case 'relationship':
                    if (effect.target) {
                        gameState.updateRelationship(effect.target, effect.value);
                    }
                    break;
                case 'stress':
                    this.updateStress(effect.value);
                    break;
                case 'reputation':
                    this.updateReputation(effect.value);
                    break;
                case 'faction':
                    if (effect.target && effect.value > 0) {
                        this.joinFaction(effect.target);
                    }
                    break;
                case 'warning':
                    this.status.performance.warnings += 1;
                    break;
                case 'fired':
                    // 触发被解雇
                    console.log('被解雇了！');
                    break;
            }
        });

        // 通知监听者
        this.listeners.forEach(cb => cb(event, choice));

        return effects;
    }

    onEvent(callback: (event: WorkplaceEvent, choice?: EventChoice) => void): void {
        this.listeners.push(callback);
    }

    // ========== 存档 ==========

    save(): object {
        return {
            status: {
                ...this.status,
                position: this.status.position.level
            },
            eventHistory: Array.from(this.eventHistory.entries())
        };
    }

    load(data: { status: any; eventHistory: [string, number][] }): void {
        this.status = {
            ...data.status,
            position: POSITIONS.find(p => p.level === data.status.position) || POSITIONS[0]
        };
        this.eventHistory = new Map(data.eventHistory);
    }

    reset(): void {
        this.status = this.createInitialStatus();
        this.eventHistory.clear();
    }
}

// 全局单例
export const workplaceSystem = new WorkplaceSystem();
