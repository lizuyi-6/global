/**
 * 求职系统
 * 包含公司、职位、简历、面试、Offer等核心逻辑
 */

// ========== 类型定义 ==========

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
    projects: string[];
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

    // ========== 公司和职位 ==========

    getCompanies(): Company[] {
        return [...COMPANIES];
    }

    getCompany(id: string): Company | undefined {
        return COMPANIES.find(c => c.id === id);
    }

    getJobPositions(filters?: {
        companyId?: string;
        industry?: string;
        salaryMin?: number;
    }): JobPosition[] {
        let positions = [...JOB_POSITIONS];

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
        return JOB_POSITIONS.find(p => p.id === id);
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
            // 决定是否被查看
            const viewChance = this.calculateViewChance(job, company);

            if (Math.random() < viewChance) {
                app.status = 'viewed';
                app.viewedDay = this.status.currentDay;
                app.lastUpdateDay = this.status.currentDay;
                events.push({
                    type: 'application_viewed',
                    data: { application: app, company, job }
                });
            } else if (daysSinceApply > responseDays + 7) {
                // 超过一周没查看，大概率石沉大海
                if (Math.random() < 0.7) {
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

        if (daysSinceView >= 2) {
            // 决定是否邀请面试
            const interviewChance = this.calculateInterviewChance(job, company);

            if (Math.random() < interviewChance) {
                app.status = 'interview_invited';
                app.lastUpdateDay = this.status.currentDay;

                // 安排第一轮面试
                const firstRound: InterviewRound = {
                    round: 1,
                    type: company.type === 'foreign' ? 'phone' : 'video',
                    interviewerName: this.generateInterviewerName(),
                    interviewerRole: 'HR',
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
            } else if (daysSinceView > 5) {
                // 查看后没消息
                if (Math.random() < 0.5) {
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
        let chance = 0.4;

        // 技能匹配度
        const skillMatch = job.requirements.filter(req =>
            this.resume.skills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
        ).length / job.requirements.length;
        chance += skillMatch * 0.3;

        // 公司难度
        chance -= (company.interviewDifficulty - 3) * 0.1;

        return Math.max(0.1, Math.min(0.8, chance));
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
        const nextRound: InterviewRound = {
            round: app.interviewRounds.length + 1,
            type: roundTypes[Math.min(app.interviewRounds.length, roundTypes.length - 1)],
            interviewerName: this.generateInterviewerName(),
            interviewerRole: roles[Math.min(app.interviewRounds.length, roles.length - 1)],
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
