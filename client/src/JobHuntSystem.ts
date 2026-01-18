/**
 * 求职系统
 * 包含公司、职位、简历、面试、Offer等核心逻辑
 */

// ========== 类型定义 ==========

import { apiService } from './APIService';

/** 公司类型 */
export type CompanyType = 'startup' | 'mid' | 'large' | 'foreign' | 'state';

/** 公司信息 */
export interface Company {
    id: string;
    name: string;
    type: CompanyType;
    industry: string;
    size: string;              // 规模描述
    reputation: number;        // 口碑 1-5
    interviewDifficulty: number; // 面试难度 1-5
    workLifeBalance: number;   // 工作生活平衡 1-5
    salaryLevel: number;       // 薪资水平 1-5
    description: string;
    logo?: string;
}

/** 职位信息 */
export interface JobPosition {
    id: string;
    companyId: string;
    title: string;
    department: string;
    salaryRange: [number, number];  // 薪资范围 [min, max]
    requirements: string[];          // 要求
    benefits: string[];              // 福利
    workType: 'onsite' | 'remote' | 'hybrid';
    experience: string;              // 经验要求
    education: string;               // 学历要求
    headcount: number;               // 招聘人数
    urgency: 'normal' | 'urgent' | 'asap';  // 紧急程度
    postedDays: number;              // 发布天数
}

/** 简历投递状态 */
export type ApplicationStatus =
    | 'pending'           // 待处理
    | 'viewed'            // 已查看
    | 'interview_invited' // 邀请面试
    | 'interviewing'      // 面试中
    | 'offer'             // 已发offer
    | 'rejected'          // 被拒绝
    | 'withdrawn';        // 已撤回

/** 投递记录 */
export interface Application {
    id: string;
    jobId: string;
    companyId: string;
    status: ApplicationStatus;
    appliedDay: number;           // 投递日期（游戏天数）
    lastUpdateDay: number;        // 最后更新日期
    viewedDay?: number;           // 被查看日期
    interviewRounds: InterviewRound[];  // 面试轮次
    rejectionReason?: string;     // 拒绝原因
    offerDetails?: OfferDetails;  // offer详情
    usedQuestionIds?: string[];   // 跨轮次已使用的问题ID（避免重复）
}

/** 面试轮次 */
export interface InterviewRound {
    round: number;
    type: 'phone' | 'video' | 'onsite' | 'group' | 'hr';
    interviewerName: string;
    interviewerRole: string;
    scheduledDay: number;
    scheduledTime: string;
    status: 'scheduled' | 'completed' | 'passed' | 'failed' | 'cancelled';
    feedback?: string;
    questions?: string[];         // 被问的问题
    performance?: number;         // 表现评分 0-100
}

/** Offer详情 */
export interface OfferDetails {
    baseSalary: number;
    bonus?: number;
    stockOptions?: string;
    benefits: string[];
    startDate: string;
    expirationDay: number;        // offer过期日期
    negotiable: boolean;          // 是否可谈判
    status: 'pending' | 'accepted' | 'declined' | 'expired';
}

/** 玩家简历 */
export interface PlayerResume {
    name: string;
    age: number;
    education: 'high_school' | 'college' | 'bachelor' | 'master' | 'phd';
    school: string;
    major: string;
    experience: number;           // 工作年限
    skills: string[];
    projects: string[];           // 项目经历

    // 新增字段：竞赛、证书、荣誉、自我描述
    competitions?: string[];      // 竞赛经历 (如: "ACM铜牌", "Kaggle Top 10%")
    certificates?: string[];      // 证书 (如: "AWS认证", "PMP", "CPA")
    awards?: string[];            // 荣誉奖项 (如: "优秀毕业生", "奖学金")
    languages?: string[];         // 语言能力 (如: "英语流利", "日语N1")
    selfDescription?: string;     // 自我描述/个人亮点
    internships?: string[];       // 实习经历 (如: "字节跳动实习")
    publications?: string[];      // 发表论文/专利

    expectedSalary: [number, number];
    jobPreferences: {
        industries: string[];
        companyTypes: CompanyType[];
        workTypes: ('onsite' | 'remote' | 'hybrid')[];
    };
}

/** 求职状态 */
export interface JobHuntStatus {
    currentDay: number;
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
    totalRejections: number;
    anxiety: number;              // 焦虑值 0-100
    confidence: number;           // 信心值 0-100
    savings: number;              // 存款
    dailyExpense: number;         // 每日开销
    unemployedDays: number;       // 失业天数
}

// ========== 公司数据 ==========

export const COMPANIES: Company[] = [
    {
        id: 'tech_giant',
        name: '宇宙科技',
        type: 'large',
        industry: '互联网',
        size: '10000人以上',
        reputation: 5,
        interviewDifficulty: 5,
        workLifeBalance: 2,
        salaryLevel: 5,
        description: '国内顶级互联网大厂，福利好但加班严重'
    },
    {
        id: 'foreign_corp',
        name: '环球软件',
        type: 'foreign',
        industry: '软件',
        size: '1000-5000人',
        reputation: 4,
        interviewDifficulty: 4,
        workLifeBalance: 4,
        salaryLevel: 4,
        description: '外企，工作生活平衡，但晋升慢'
    },
    {
        id: 'startup_hot',
        name: '极速创新',
        type: 'startup',
        industry: 'AI',
        size: '50-200人',
        reputation: 3,
        interviewDifficulty: 3,
        workLifeBalance: 1,
        salaryLevel: 3,
        description: 'AI赛道明星创业公司，有期权但不稳定'
    },
    {
        id: 'mid_stable',
        name: '稳健集团',
        type: 'mid',
        industry: '金融科技',
        size: '500-1000人',
        reputation: 3,
        interviewDifficulty: 3,
        workLifeBalance: 3,
        salaryLevel: 3,
        description: '中型公司，相对稳定，发展一般'
    },
    {
        id: 'state_owned',
        name: '国信科技',
        type: 'state',
        industry: '通信',
        size: '5000-10000人',
        reputation: 4,
        interviewDifficulty: 3,
        workLifeBalance: 5,
        salaryLevel: 2,
        description: '国企，稳定不加班，但薪资低'
    },
    {
        id: 'startup_risky',
        name: '梦想工场',
        type: 'startup',
        industry: '社交',
        size: '10-50人',
        reputation: 2,
        interviewDifficulty: 2,
        workLifeBalance: 1,
        salaryLevel: 2,
        description: '早期创业公司，画饼多，随时可能倒闭'
    },
    {
        id: 'outsource',
        name: '人力无忧',
        type: 'mid',
        industry: '外包',
        size: '1000-5000人',
        reputation: 2,
        interviewDifficulty: 1,
        workLifeBalance: 2,
        salaryLevel: 2,
        description: '外包公司，容易进但没前途'
    },
    {
        id: 'finance_big',
        name: '金鼎证券',
        type: 'large',
        industry: '金融',
        size: '5000-10000人',
        reputation: 4,
        interviewDifficulty: 4,
        workLifeBalance: 2,
        salaryLevel: 5,
        description: '头部券商，薪资高压力大'
    }
];

// ========== 职位数据 ==========

export const JOB_POSITIONS: JobPosition[] = [
    // 宇宙科技
    {
        id: 'tech_giant_dev',
        companyId: 'tech_giant',
        title: '高级前端工程师',
        department: '技术部',
        salaryRange: [25000, 45000],
        requirements: ['3年以上经验', '熟悉React/Vue', '有大型项目经验'],
        benefits: ['六险一金', '免费三餐', '年终奖', '股票'],
        workType: 'onsite',
        experience: '3-5年',
        education: '本科及以上',
        headcount: 5,
        urgency: 'normal',
        postedDays: 7
    },
    {
        id: 'tech_giant_pm',
        companyId: 'tech_giant',
        title: '产品经理',
        department: '产品部',
        salaryRange: [30000, 50000],
        requirements: ['3年以上经验', 'B端产品经验优先', '数据分析能力'],
        benefits: ['六险一金', '免费三餐', '年终奖'],
        workType: 'onsite',
        experience: '3-5年',
        education: '本科及以上',
        headcount: 2,
        urgency: 'urgent',
        postedDays: 3
    },
    // 环球软件
    {
        id: 'foreign_dev',
        companyId: 'foreign_corp',
        title: 'Software Engineer',
        department: 'Engineering',
        salaryRange: [20000, 35000],
        requirements: ['2年以上经验', '英语流利', 'CS相关专业'],
        benefits: ['五险一金', '弹性工作', '15天年假'],
        workType: 'hybrid',
        experience: '2-5年',
        education: '本科及以上',
        headcount: 3,
        urgency: 'normal',
        postedDays: 14
    },
    // 极速创新
    {
        id: 'startup_ai',
        companyId: 'startup_hot',
        title: 'AI算法工程师',
        department: '算法组',
        salaryRange: [25000, 40000],
        requirements: ['熟悉深度学习', 'Python', '有论文发表优先'],
        benefits: ['期权', '弹性工作', '零食饮料'],
        workType: 'onsite',
        experience: '1-3年',
        education: '硕士及以上',
        headcount: 2,
        urgency: 'asap',
        postedDays: 1
    },
    // 稳健集团
    {
        id: 'mid_java',
        companyId: 'mid_stable',
        title: 'Java开发工程师',
        department: '研发部',
        salaryRange: [15000, 25000],
        requirements: ['2年以上Java经验', '熟悉Spring', '有金融经验优先'],
        benefits: ['五险一金', '年终奖', '节日福利'],
        workType: 'onsite',
        experience: '2-5年',
        education: '本科及以上',
        headcount: 5,
        urgency: 'normal',
        postedDays: 21
    },
    // 国信科技
    {
        id: 'state_dev',
        companyId: 'state_owned',
        title: '软件开发工程师',
        department: '信息技术部',
        salaryRange: [10000, 18000],
        requirements: ['本科及以上', '有相关经验', '党员优先'],
        benefits: ['六险二金', '户口', '稳定'],
        workType: 'onsite',
        experience: '1-3年',
        education: '本科及以上',
        headcount: 10,
        urgency: 'normal',
        postedDays: 30
    },
    // 梦想工场
    {
        id: 'startup_fullstack',
        companyId: 'startup_risky',
        title: '全栈工程师',
        department: '技术',
        salaryRange: [12000, 20000],
        requirements: ['能独立开发', '抗压能力强', '接受加班'],
        benefits: ['期权（画饼）', '扁平管理'],
        workType: 'onsite',
        experience: '1-3年',
        education: '大专及以上',
        headcount: 3,
        urgency: 'asap',
        postedDays: 45
    },
    // 外包
    {
        id: 'outsource_test',
        companyId: 'outsource',
        title: '测试工程师',
        department: '测试部',
        salaryRange: [8000, 15000],
        requirements: ['1年以上测试经验', '熟悉测试流程'],
        benefits: ['五险一金'],
        workType: 'onsite',
        experience: '1-3年',
        education: '大专及以上',
        headcount: 20,
        urgency: 'normal',
        postedDays: 60
    },
    // 金鼎证券
    {
        id: 'finance_quant',
        companyId: 'finance_big',
        title: '量化开发工程师',
        department: '量化投资部',
        salaryRange: [40000, 80000],
        requirements: ['985/211硕士', '数学/计算机背景', '熟悉金融'],
        benefits: ['高额年终', '六险一金', '交易分成'],
        workType: 'onsite',
        experience: '2-5年',
        education: '硕士及以上',
        headcount: 1,
        urgency: 'normal',
        postedDays: 10
    }
];

// ========== 拒绝原因模板 ==========

export const REJECTION_REASONS = [
    '感谢您的申请，但您的经验与我们的要求不太匹配。',
    '很遗憾，该职位已招满。',
    '经过综合评估，我们决定继续寻找更合适的候选人。',
    '您的技术背景很优秀，但与团队文化不太契合。',
    '抱歉，由于业务调整，该职位暂停招聘。',
    '面试表现良好，但其他候选人更符合我们的需求。',
    '您的薪资期望超出了我们的预算范围。',
    '学历要求未达到该职位标准。',
    '工作经验年限不符合要求。',
    '（无回复，石沉大海）'
];

// ========== 求职系统管理器 ==========

class JobHuntSystem {
    private resume: PlayerResume;
    private applications: Application[] = [];
    private status: JobHuntStatus;
    private listeners: ((event: string, data: any) => void)[] = [];

    // 动态生成的职位和公司
    private dynamicJobs: JobPosition[] = [];
    private dynamicCompanies: Company[] = [];
    private isFetchingJobs: boolean = false;
    private jobPoolSize: number = 0;

    constructor() {
        this.resume = this.createDefaultResume();
        this.status = this.createInitialStatus();
    }

    private createDefaultResume(): PlayerResume {
        return {
            name: '求职者',
            age: 25,
            education: 'bachelor',
            school: '普通本科',
            major: '计算机科学',
            experience: 2,
            skills: ['JavaScript', 'React', 'Node.js'],
            projects: ['个人博客', '电商小程序'],
            // 新增字段默认值
            competitions: [],           // 竞赛经历
            certificates: [],           // 证书
            awards: [],                  // 荣誉
            languages: ['英语CET-4'],   // 语言能力
            selfDescription: '',        // 自我描述
            internships: [],            // 实习经历
            publications: [],           // 发表论文/专利
            expectedSalary: [15000, 25000],
            jobPreferences: {
                industries: ['互联网', '软件'],
                companyTypes: ['large', 'mid', 'foreign'],
                workTypes: ['onsite', 'hybrid']
            }
        };
    }

    private createInitialStatus(): JobHuntStatus {
        return {
            currentDay: 1,
            totalApplications: 0,
            totalInterviews: 0,
            totalOffers: 0,
            totalRejections: 0,
            anxiety: 30,
            confidence: 70,
            savings: 20000,
            dailyExpense: 150,
            unemployedDays: 0
        };
    }

    // ========== 简历管理 ==========

    getResume(): PlayerResume {
        return { ...this.resume };
    }

    updateResume(updates: Partial<PlayerResume>): void {
        this.resume = { ...this.resume, ...updates };
    }

    // ========== 状态管理 ==========

    getStatus(): JobHuntStatus {
        return { ...this.status };
    }

    // ========== 动态职位加载 ==========

    async initializeDynamicJobs(): Promise<void> {
        if (this.dynamicJobs.length > 0) return;
        await this.fetchMoreJobs();
    }

    async fetchMoreJobs(): Promise<void> {
        if (this.isFetchingJobs) return;
        this.isFetchingJobs = true;

        try {
            const newListing = await apiService.generateJobs(this.resume, 15);

            if (newListing && Array.isArray(newListing)) {
                newListing.forEach(item => {
                    const company: Company = item.company;
                    const position: JobPosition = item.position;

                    // 确保 ID 唯一且关联正确
                    company.id = company.id || `dyn_comp_${Date.now()}_${Math.random()}`;
                    position.id = position.id || `dyn_job_${Date.now()}_${Math.random()}`;
                    position.companyId = company.id;
                    position.postedDays = position.postedDays || 1;

                    // 避免重复公司名称 (可选)
                    if (!this.dynamicCompanies.find(c => c.name === company.name)) {
                        this.dynamicCompanies.push(company);
                    }
                    this.dynamicJobs.push(position);
                });

                this.jobPoolSize = this.dynamicJobs.length;
                this.emit('jobs_updated', { count: this.dynamicJobs.length });
            }
        } catch (error) {
            console.error('Fetch more jobs failed:', error);
        } finally {
            this.isFetchingJobs = false;
        }
    }

    isFetching(): boolean {
        return this.isFetchingJobs;
    }

    // ========== 公司和职位 ==========

    getCompanies(): Company[] {
        return [...COMPANIES, ...this.dynamicCompanies];
    }

    getCompany(id: string): Company | undefined {
        return COMPANIES.find(c => c.id === id) || this.dynamicCompanies.find(c => c.id === id);
    }

    getJobPositions(filters?: {
        companyId?: string;
        industry?: string;
        salaryMin?: number;
    }): JobPosition[] {
        let positions = [...JOB_POSITIONS, ...this.dynamicJobs];

        if (filters?.companyId) {
            positions = positions.filter(p => p.companyId === filters.companyId);
        }
        if (filters?.industry) {
            const companyIds = COMPANIES
                .filter(c => c.industry === filters.industry)
                .map(c => c.id);
            positions = positions.filter(p => companyIds.includes(p.companyId));
        }
        if (filters?.salaryMin) {
            const minSalary = filters.salaryMin;
            positions = positions.filter(p => p.salaryRange[1] >= minSalary);
        }

        return positions;
    }

    getJobPosition(id: string): JobPosition | undefined {
        return JOB_POSITIONS.find(p => p.id === id) || this.dynamicJobs.find(p => p.id === id);
    }

    // ========== 投递管理 ==========

    getApplications(): Application[] {
        return [...this.applications];
    }

    getApplication(id: string): Application | undefined {
        return this.applications.find(a => a.id === id);
    }

    applyJob(jobId: string): { success: boolean; message: string; applicationId?: string } {
        const job = this.getJobPosition(jobId);
        if (!job) {
            return { success: false, message: '职位不存在' };
        }

        // 检查是否已投递
        const existing = this.applications.find(a => a.jobId === jobId && a.status !== 'withdrawn');
        if (existing) {
            return { success: false, message: '您已投递过该职位' };
        }

        const application: Application = {
            id: `app_${Date.now()}`,
            jobId,
            companyId: job.companyId,
            status: 'pending',
            appliedDay: this.status.currentDay,
            lastUpdateDay: this.status.currentDay,
            interviewRounds: []
        };

        this.applications.push(application);
        this.status.totalApplications++;
        this.status.anxiety = Math.min(100, this.status.anxiety + 5);

        this.emit('application_sent', { application, job });

        return { success: true, message: '简历已投递', applicationId: application.id };
    }

    // ========== 时间推进 ==========

    advanceDay(): { events: Array<{ type: string; data: any }> } {
        const events: Array<{ type: string; data: any }> = [];

        this.status.currentDay++;
        this.status.unemployedDays++;
        this.status.savings -= this.status.dailyExpense;

        // 焦虑随时间增加
        if (this.status.unemployedDays > 30) {
            this.status.anxiety = Math.min(100, this.status.anxiety + 3);
            this.status.confidence = Math.max(0, this.status.confidence - 2);
        }

        // 处理投递状态变化
        this.applications.forEach(app => {
            if (app.status === 'pending') {
                this.processApplicationStatus(app, events);
            } else if (app.status === 'viewed') {
                this.processViewedApplication(app, events);
            } else if (app.status === 'interviewing') {
                this.processInterview(app, events);
            }
        });

        // 检查存款
        if (this.status.savings <= 0) {
            events.push({ type: 'bankrupt', data: { message: '存款耗尽，求职失败' } });
        }

        // 检查时间限制（180天）
        if (this.status.currentDay > 180 && this.applications.filter(app => app.status === 'offer').length === 0) {
            events.push({ type: 'timeout', data: { message: '求职时间太长，心态崩溃' } });
        }

        // 偶尔生成新职位 (每 3 天或职位池较小时)
        const jobs = this.getJobPositions();
        if (this.status.currentDay % 3 === 0 || jobs.length < 15) {
            this.fetchMoreJobs();
        }

        return { events };
    }

    private processApplicationStatus(app: Application, events: Array<{ type: string; data: any }>): void {
        const daysSinceApply = this.status.currentDay - app.appliedDay;
        const job = this.getJobPosition(app.jobId);
        const company = this.getCompany(app.companyId);
        if (!job || !company) return;

        // 根据公司类型和职位紧急程度决定响应速度
        const baseResponseDays = company.type === 'startup' ? 2 : company.type === 'large' ? 5 : 3;
        const urgencyModifier = job.urgency === 'asap' ? 0.5 : job.urgency === 'urgent' ? 0.7 : 1;
        const responseDays = Math.floor(baseResponseDays * urgencyModifier);

        if (daysSinceApply >= responseDays) {
            // 1. 系统直接拒绝的概率 (简历初筛失败)
            const directRejectChance = 0.2;
            if (Math.random() < directRejectChance) {
                app.status = 'rejected';
                app.rejectionReason = REJECTION_REASONS[Math.floor(Math.random() * 3)]; // 前三种标准理由
                app.lastUpdateDay = this.status.currentDay;
                this.status.totalRejections++;
                this.status.confidence = Math.max(0, this.status.confidence - 2);
                events.push({
                    type: 'application_rejected',
                    data: { application: app, company, job, reason: app.rejectionReason }
                });
                return;
            }

            // 2. 决定是否被查看
            const viewChance = this.calculateViewChance(job, company);

            if (Math.random() < viewChance) {
                app.status = 'viewed';
                app.viewedDay = this.status.currentDay;
                app.lastUpdateDay = this.status.currentDay;
                events.push({
                    type: 'application_viewed',
                    data: { application: app, company, job }
                });
            } else if (daysSinceApply > responseDays + 5) {
                // 超过5天没查看，大概率石沉大海 (已读不回)
                if (Math.random() < 0.6) {
                    app.status = 'rejected';
                    app.rejectionReason = REJECTION_REASONS[9]; // 无回复
                    app.lastUpdateDay = this.status.currentDay;
                    this.status.totalRejections++;
                    this.status.confidence = Math.max(0, this.status.confidence - 3);
                    events.push({
                        type: 'application_rejected',
                        data: { application: app, company, job, reason: app.rejectionReason }
                    });
                }
            }
        }
    }

    private processViewedApplication(app: Application, events: Array<{ type: string; data: any }>): void {
        const daysSinceView = this.status.currentDay - (app.viewedDay || app.appliedDay);
        const job = this.getJobPosition(app.jobId);
        const company = this.getCompany(app.companyId);
        if (!job || !company) return;

        if (daysSinceView >= 1) {
            // 决定是否邀请面试
            const interviewChance = this.calculateInterviewChance(job, company);

            if (Math.random() < interviewChance) {
                app.status = 'interview_invited';
                app.lastUpdateDay = this.status.currentDay;

                // 安排第一轮面试
                // 创业公司有概率直接由技术面
                let initialRole = 'HR';
                if (company.type === 'startup' && Math.random() < 0.4) {
                    initialRole = '技术面试官';
                }

                const firstRound: InterviewRound = {
                    round: 1,
                    type: company.type === 'foreign' ? 'phone' : 'video',
                    interviewerName: this.generateInterviewerName(),
                    interviewerRole: initialRole,
                    scheduledDay: this.status.currentDay + 2 + Math.floor(Math.random() * 3),
                    scheduledTime: ['10:00', '14:00', '15:30', '16:00'][Math.floor(Math.random() * 4)],
                    status: 'scheduled'
                };
                app.interviewRounds.push(firstRound);
                this.status.totalInterviews++;
                this.status.confidence = Math.min(100, this.status.confidence + 10);
                this.status.anxiety = Math.max(0, this.status.anxiety - 5);

                events.push({
                    type: 'interview_invited',
                    data: { application: app, company, job, interview: firstRound }
                });
            } else if (daysSinceView > 3) {
                // 查看后拒绝的概率增加，模拟“简历筛选后的淘汰”
                const rejectionChance = 0.4;
                if (Math.random() < rejectionChance) {
                    const reasonIndex = Math.floor(Math.random() * (REJECTION_REASONS.length - 1));
                    app.status = 'rejected';
                    app.rejectionReason = REJECTION_REASONS[reasonIndex];
                    app.lastUpdateDay = this.status.currentDay;
                    this.status.totalRejections++;
                    this.status.confidence = Math.max(0, this.status.confidence - 5);
                    events.push({
                        type: 'application_rejected',
                        data: { application: app, company, job, reason: app.rejectionReason }
                    });
                }
            }
        }
    }

    private processInterview(app: Application, events: Array<{ type: string; data: any }>): void {
        // 面试逻辑在面试场景中处理
    }

    private calculateViewChance(job: JobPosition, company: Company): number {
        let chance = 0.5;

        // 学历匹配
        const eduLevel = { 'high_school': 1, 'college': 2, 'bachelor': 3, 'master': 4, 'phd': 5 };
        const requiredEdu = job.education.includes('硕士') ? 4 : job.education.includes('本科') ? 3 : 2;
        if (eduLevel[this.resume.education] >= requiredEdu) chance += 0.1;
        else chance -= 0.2;

        // 经验匹配
        const expMatch = this.resume.experience >= parseInt(job.experience.split('-')[0]);
        if (expMatch) chance += 0.1;
        else chance -= 0.15;

        // 公司口碑影响竞争程度
        chance -= (company.reputation - 3) * 0.1;

        return Math.max(0.1, Math.min(0.9, chance));
    }

    private calculateInterviewChance(job: JobPosition, company: Company): number {
        // 使用综合简历评分系统
        const resumeScore = this.calculateResumeScore(job, company);

        // 基础概率：根据简历评分计算 (0-100 分 -> 5%-60% 概率)
        let chance = 0.05 + (resumeScore / 100) * 0.55;

        // 公司难度修正（大厂竞争更激烈）
        chance -= (company.interviewDifficulty - 3) * 0.05;

        // 公司口碑修正（口碑好的公司更多人竞争）
        chance -= (company.reputation - 3) * 0.03;

        // 限制范围: 5% - 60%
        return Math.max(0.05, Math.min(0.60, chance));
    }

    /**
     * 综合简历评分系统
     * 评估简历各方面价值，返回 0-100 分
     */
    private calculateResumeScore(job: JobPosition, company: Company): number {
        let score = 0;
        const resume = this.resume;

        // ========== 1. 学历评分 (0-25分) ==========
        const eduScores: { [key: string]: number } = {
            'high_school': 5,    // 高中
            'college': 10,       // 大专
            'bachelor': 18,      // 本科
            'master': 23,        // 硕士
            'phd': 25            // 博士
        };
        score += eduScores[resume.education] || 10;

        // 学历要求匹配检查
        const eduLevel: { [key: string]: number } = { 'high_school': 1, 'college': 2, 'bachelor': 3, 'master': 4, 'phd': 5 };
        const requiredEdu = job.education.includes('硕士') ? 4 : job.education.includes('本科') ? 3 : 2;
        if (eduLevel[resume.education] < requiredEdu) {
            // 学历不达标，扣减学历分的50%
            score *= 0.5;
        }

        // ========== 2. 学校声誉 (0-10分) ==========
        const schoolLower = resume.school.toLowerCase();
        if (schoolLower.includes('985') || schoolLower.includes('清华') || schoolLower.includes('北大') ||
            schoolLower.includes('浙大') || schoolLower.includes('复旦') || schoolLower.includes('上交')) {
            score += 10;
        } else if (schoolLower.includes('211') || schoolLower.includes('重点')) {
            score += 7;
        } else if (schoolLower.includes('一本')) {
            score += 5;
        } else if (!schoolLower.includes('普通') && !schoolLower.includes('三本')) {
            score += 3;
        }

        // ========== 3. 工作经验 (0-15分) ==========
        const reqExpStr = job.experience.split('-')[0];
        const requiredExp = parseInt(reqExpStr) || 0;
        if (resume.experience >= requiredExp + 2) {
            score += 15; // 经验超出要求
        } else if (resume.experience >= requiredExp) {
            score += 12; // 经验符合要求
        } else if (resume.experience >= requiredExp - 1) {
            score += 7;  // 经验略欠缺
        } else {
            score += 2;  // 经验严重不足
        }

        // ========== 4. 技能匹配 (0-15分) ==========
        const skillMatch = job.requirements.filter(req =>
            resume.skills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
        ).length / Math.max(job.requirements.length, 1);
        score += Math.floor(skillMatch * 15);

        // ========== 5. 项目经历 (0-10分) ==========
        const projectCount = resume.projects?.length || 0;
        score += Math.min(projectCount * 3, 10);

        // ========== 6. 竞赛经历 (0-10分) - 重要加分项 ==========
        if (resume.competitions && resume.competitions.length > 0) {
            let compScore = 0;
            resume.competitions.forEach(comp => {
                const compLower = comp.toLowerCase();
                // 顶级竞赛
                if (compLower.includes('acm') || compLower.includes('金牌') || compLower.includes('冠军') ||
                    compLower.includes('top 1') || compLower.includes('第一名') || compLower.includes('kaggle')) {
                    compScore += 5;
                }
                // 优秀名次
                else if (compLower.includes('银牌') || compLower.includes('亚军') || compLower.includes('top 10') ||
                    compLower.includes('二等奖') || compLower.includes('省级')) {
                    compScore += 3;
                }
                // 参与竞赛
                else {
                    compScore += 1.5;
                }
            });
            score += Math.min(compScore, 10);
        }

        // ========== 7. 证书资质 (0-8分) ==========
        if (resume.certificates && resume.certificates.length > 0) {
            let certScore = 0;
            resume.certificates.forEach(cert => {
                const certLower = cert.toLowerCase();
                // 高含金量证书
                if (certLower.includes('cpa') || certLower.includes('注册会计') ||
                    certLower.includes('aws') || certLower.includes('gcp') || certLower.includes('azure') ||
                    certLower.includes('pmp') || certLower.includes('系统架构师')) {
                    certScore += 3;
                }
                // 普通证书
                else {
                    certScore += 1;
                }
            });
            score += Math.min(certScore, 8);
        }

        // ========== 8. 实习经历 (0-8分) ==========
        if (resume.internships && resume.internships.length > 0) {
            let internScore = 0;
            resume.internships.forEach(intern => {
                const internLower = intern.toLowerCase();
                // 大厂实习
                if (internLower.includes('字节') || internLower.includes('腾讯') || internLower.includes('阿里') ||
                    internLower.includes('百度') || internLower.includes('华为') || internLower.includes('美团') ||
                    internLower.includes('google') || internLower.includes('microsoft') || internLower.includes('amazon')) {
                    internScore += 4;
                } else {
                    internScore += 2;
                }
            });
            score += Math.min(internScore, 8);
        }

        // ========== 9. 语言能力 (0-5分) ==========
        if (resume.languages && resume.languages.length > 0) {
            let langScore = 0;
            resume.languages.forEach(lang => {
                const langLower = lang.toLowerCase();
                if (langLower.includes('流利') || langLower.includes('fluent') || langLower.includes('n1') ||
                    langLower.includes('雅思7') || langLower.includes('雅思8') || langLower.includes('托福100')) {
                    langScore += 3;
                } else {
                    langScore += 1;
                }
            });
            score += Math.min(langScore, 5);
        }

        // ========== 10. 荣誉奖项 (0-5分) ==========
        if (resume.awards && resume.awards.length > 0) {
            let awardScore = 0;
            resume.awards.forEach(award => {
                const awardLower = award.toLowerCase();
                if (awardLower.includes('国家') || awardLower.includes('一等') || awardLower.includes('特等')) {
                    awardScore += 3;
                } else if (awardLower.includes('奖学金') || awardLower.includes('优秀')) {
                    awardScore += 2;
                } else {
                    awardScore += 1;
                }
            });
            score += Math.min(awardScore, 5);
        }

        // ========== 11. 发表论文/专利 (0-5分) ==========
        if (resume.publications && resume.publications.length > 0) {
            const pubCount = resume.publications.length;
            // 论文对研究岗位特别重要
            const isResearchJob = job.title.toLowerCase().includes('算法') ||
                job.title.toLowerCase().includes('研究') ||
                job.requirements.some(r => r.includes('论文'));
            score += Math.min(pubCount * (isResearchJob ? 3 : 1.5), 5);
        }

        // ========== 12. 自我描述质量 (0-4分) ==========
        if (resume.selfDescription) {
            const desc = resume.selfDescription;
            // 检查自我描述的质量
            const positiveKeywords = ['主导', '负责', '优化', '提升', '解决', '创新', '团队', '管理', '成果', '数据'];
            const matchCount = positiveKeywords.filter(kw => desc.includes(kw)).length;
            const lengthBonus = desc.length > 50 ? 1 : 0;
            score += Math.min(matchCount + lengthBonus, 4);
        }

        // 确保分数在 0-100 范围内
        return Math.max(0, Math.min(100, score));
    }

    private generateInterviewerName(): string {
        const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋'];
        return surnames[Math.floor(Math.random() * surnames.length)] +
            names[Math.floor(Math.random() * names.length)];
    }

    // ========== 面试系统 ==========

    scheduleNextRound(appId: string, passed: boolean): InterviewRound | null {
        const app = this.applications.find(a => a.id === appId);
        if (!app) return null;

        const lastRound = app.interviewRounds[app.interviewRounds.length - 1];
        if (lastRound) {
            lastRound.status = passed ? 'passed' : 'failed';
        }

        if (!passed) {
            app.status = 'rejected';
            app.rejectionReason = '面试未通过';
            this.status.totalRejections++;
            this.status.confidence = Math.max(0, this.status.confidence - 10);
            return null;
        }

        const company = this.getCompany(app.companyId);
        const difficulty = company?.interviewDifficulty ?? 3;
        const totalRounds = difficulty === 5 ? 4 : difficulty >= 3 ? 3 : 2;

        if (app.interviewRounds.length >= totalRounds) {
            // 面试全部通过，发offer
            app.status = 'offer';
            const job = this.getJobPosition(app.jobId);
            app.offerDetails = {
                baseSalary: job ? Math.floor((job.salaryRange[0] + job.salaryRange[1]) / 2) : 15000,
                benefits: job?.benefits || [],
                startDate: `第${this.status.currentDay + 14}天`,
                expirationDay: this.status.currentDay + 7,
                negotiable: true,
                status: 'pending'
            };
            this.status.totalOffers++;
            this.status.confidence = Math.min(100, this.status.confidence + 20);
            this.status.anxiety = Math.max(0, this.status.anxiety - 20);
            return null;
        }

        // 安排下一轮
        const roundTypes: InterviewRound['type'][] = ['phone', 'video', 'onsite', 'hr'];
        const roles = ['HR', '技术面试官', '部门主管', 'VP'];

        // Dynamic Role Progression based on previous role
        let nextRole = '技术面试官';
        if (lastRound) {
            const currentIndex = roles.indexOf(lastRound.interviewerRole);
            if (currentIndex >= 0 && currentIndex < roles.length - 1) {
                nextRole = roles[currentIndex + 1];
            } else {
                // Fallback if max reached or unknown
                nextRole = roles[roles.length - 1];
            }
        } else {
            // Should not happen as lastRound checked above, but safe fallback
            nextRole = '技术面试官';
        }

        const nextRound: InterviewRound = {
            round: app.interviewRounds.length + 1,
            type: roundTypes[Math.min(app.interviewRounds.length, roundTypes.length - 1)],
            interviewerName: this.generateInterviewerName(),
            interviewerRole: nextRole,
            scheduledDay: this.status.currentDay + 2 + Math.floor(Math.random() * 3),
            scheduledTime: ['10:00', '14:00', '15:30'][Math.floor(Math.random() * 3)],
            status: 'scheduled'
        };

        app.interviewRounds.push(nextRound);
        app.status = 'interviewing';

        return nextRound;
    }

    // ========== Offer处理 ==========

    acceptOffer(appId: string): boolean {
        const app = this.applications.find(a => a.id === appId);
        if (!app || !app.offerDetails || app.offerDetails.status !== 'pending') {
            return false;
        }

        app.offerDetails.status = 'accepted';

        // 拒绝其他offer
        this.applications.forEach(other => {
            if (other.id !== appId && other.offerDetails?.status === 'pending') {
                other.offerDetails.status = 'declined';
            }
        });

        this.emit('offer_accepted', { application: app });
        return true;
    }

    declineOffer(appId: string): boolean {
        const app = this.applications.find(a => a.id === appId);
        if (!app || !app.offerDetails || app.offerDetails.status !== 'pending') {
            return false;
        }

        app.offerDetails.status = 'declined';
        return true;
    }

    negotiateSalary(appId: string, requestedSalary: number): { success: boolean; newSalary?: number; message: string } {
        const app = this.applications.find(a => a.id === appId);
        if (!app || !app.offerDetails || !app.offerDetails.negotiable) {
            return { success: false, message: '无法谈判' };
        }

        const job = this.getJobPosition(app.jobId);
        if (!job) return { success: false, message: '职位信息不存在' };

        const maxSalary = job.salaryRange[1];
        const currentOffer = app.offerDetails.baseSalary;

        if (requestedSalary <= currentOffer) {
            return { success: true, newSalary: currentOffer, message: '薪资确认' };
        }

        if (requestedSalary > maxSalary * 1.1) {
            // 要价太高，offer撤回
            if (Math.random() < 0.3) {
                app.offerDetails.status = 'declined';
                return { success: false, message: 'HR表示无法满足，offer已撤回' };
            }
            return { success: false, message: '要价过高，公司无法接受' };
        }

        // 谈判成功概率
        const successChance = 1 - (requestedSalary - currentOffer) / (maxSalary - currentOffer);
        if (Math.random() < successChance) {
            const newSalary = Math.floor((currentOffer + requestedSalary) / 2);
            app.offerDetails.baseSalary = newSalary;
            app.offerDetails.negotiable = false;
            return { success: true, newSalary, message: `谈判成功，新薪资 ¥${newSalary}` };
        }

        return { success: false, message: '公司表示无法提高薪资，但offer仍然有效' };
    }

    // ========== 事件系统 ==========

    private emit(event: string, data: any): void {
        this.listeners.forEach(cb => cb(event, data));
    }

    onEvent(callback: (event: string, data: any) => void): void {
        this.listeners.push(callback);
    }

    // ========== 存档 ==========

    save(): object {
        return {
            resume: this.resume,
            applications: this.applications,
            status: this.status
        };
    }

    load(data: { resume: PlayerResume; applications: Application[]; status: JobHuntStatus }): void {
        this.resume = data.resume;
        this.applications = data.applications;
        this.status = data.status;
    }

    reset(): void {
        this.resume = this.createDefaultResume();
        this.applications = [];
        this.status = this.createInitialStatus();
    }
}

// 全局单例
export const jobHuntSystem = new JobHuntSystem();
