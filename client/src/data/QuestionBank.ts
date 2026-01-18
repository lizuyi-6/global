export interface QuestionItem {
    id: string;
    question: string;
    sample_answer: string;
    type: 'behavioral' | 'technical' | 'personal' | 'stress' | 'trap';
    display_type: string;
}

export type CompanyType = 'startup' | 'big_corp' | 'soe' | 'general';
export type InterviewerRole = 'HR' | '技术面试官' | '部门主管';

export const QuestionBank: Record<CompanyType, Record<InterviewerRole, QuestionItem[]>> = {
    startup: {
        HR: [
            {
                id: 's_hr_1',
                question: '我们公司现在节奏非常快，可能需要你身兼数职，比如既要做前端也要负责一部分运维，你能接受吗？谈谈你对"全栈"的理解。',
                sample_answer: '我非常乐意接受挑战。在初创阶段，界限模糊是常态。我的技能树中不仅有{{skill_1}}，也涉猎过运维部署。我认为全栈不仅仅是技术栈的广度，更是一种解决问题的闭环能力。在之前的{{project_1}}等项目中，我也经常主动承担部署工作，这反而让我对系统有了更全面的认识。',
                type: 'behavioral',
                display_type: '适应性'
            },
            {
                id: 's_hr_2',
                question: '如果明天早上有个紧急投资人演示，今晚需要通宵赶一个Demo，你会怎么做？',
                sample_answer: '我会立刻评估任务优先级，和团队确认核心演示流程，砍掉细枝末节，确保核心功能稳定。虽然我只有{{experience}}年经验，但我明白在关键战役面前，Result First。通宵不是长久之计，但在关键时刻我会全力以赴。',
                type: 'behavioral',
                display_type: '抗压能力'
            },
            {
                id: 's_hr_3',
                question: '你怎么看待我们这种还没盈利、甚至可能随时倒闭的创业公司？你图什么？',
                sample_answer: '我看中的是成长的速度和改变行业的机会。在{{project_1}}的开发过程中，我体会到了创造价值的快乐。在成熟大厂可能只是一颗螺丝钉，但在这里我可以亲手搭建大厦。这种从0到1的经历和伴随公司成长的期权回报，是我目前阶段最看重的。',
                type: 'personal',
                display_type: '求职动机'
            },
            {
                id: 's_hr_4',
                question: '我们这里没有完善的文档和导师，新人全靠自己摸索，你能适应吗？',
                sample_answer: '完全没问题。由于我有{{skill_2}}和{{skill_3}}的自学背景，我已经习惯了阅读源码和社区文档来解决问题。文档不完善恰恰是我建立影响力的机会，我会在上手过程中主动梳理文档，为团队留下资产。',
                type: 'behavioral',
                display_type: '自驱力'
            }
        ],
        技术面试官: [
            {
                id: 's_tech_1',
                question: '我们的产品需要快速迭代，代码质量和开发速度你怎么权衡？如果只有一天时间，你要上线一个功能，怎么选？',
                sample_answer: '在极端的Deadline下，我会遵循"能跑通 > 能维护 > 完美"的原则。我会优先保证核心业务逻辑的正确性，利用我对{{skill_1}}的熟练度快速构建。对于非核心的代码结构可以适当妥协，但一定要做好TODO标记和技术债记录，承诺在下个迭代尽快重构。',
                type: 'technical',
                display_type: '工程权衡'
            },
            {
                id: 's_tech_2',
                question: '现在服务器挂了，只有你一个人在，没有任何文档，你会怎么排查？',
                sample_answer: '首先确认故障现象。然后登陆服务器查看系统负载和核心日志。如果是因为流量突增，优先考虑限流或重启；如果是代码Bug，我会检查最近上线的{{project_1}}相关代码，尝试回滚。先止血，再修补。',
                type: 'technical',
                display_type: '故障排查'
            },
            {
                id: 's_tech_3',
                question: '你需要从零搭建一个前端架构，选型React还是Vue？为什么？结合我们团队现状分析。',
                sample_answer: '这取决于团队基因。考虑到我们是初创团队，招人效率至关重要。如果团队普遍熟悉{{skill_1}}，我们就沿用。如果需要极致的开发速度，我会倾向于Vue；如果需要构建大型复杂应用且考虑跨端，React ecosystem更有优势。',
                type: 'technical',
                display_type: '技术选型'
            },
            {
                id: 's_tech_4',
                question: '如果产品经理提了一个技术上实现成本极高，但对用户价值一般的需求，你会怎么做？',
                sample_answer: '我会用数据说话。我会快速评估出实现该需求需要的人天，比如需要3天，然后反问：这个功能值得投入全组20%的资源吗？同时我会给出替代方案，比如用{{skill_2}}实现一个低成本的类似功能，先验证MVP，这才是创业公司该有的敏捷思维。',
                type: 'behavioral',
                display_type: '需求管理'
            },
            {
                id: 's_tech_5',
                question: '描述一下你是如何学习一门新技术的？给个具体例子。',
                sample_answer: '我学习新技术的方式是"先跑通再深入"。比如学习{{skill_2}}时，我先花半天做了一个最小可运行的Demo，体验核心概念。然后阅读官方文档理解原理，最后在{{project_1}}中实际应用。遇到问题会查阅GitHub Issues和StackOverflow，边用边学效率最高。',
                type: 'behavioral',
                display_type: '学习方法'
            },
            {
                id: 's_tech_6',
                question: '你写过什么你觉得特别巧妙的代码？讲讲思路。',
                sample_answer: '在{{project_1}}中，我写过一个通用的数据转换器，使用了策略模式和装饰器模式的组合。它能把各种格式的数据源统一转换成标准格式，添加新数据源只需新增一个策略类，完全符合开闭原则。这个设计让后续的维护成本降低了很多。',
                type: 'technical',
                display_type: '代码设计'
            },
            {
                id: 's_tech_7',
                question: '你怎么看待Test-Driven Development（TDD）？你在项目里用过吗？',
                sample_answer: '我认为TDD是一种很好的开发方法论，特别适合需求明确的核心模块。但在创业公司节奏快、需求常变的环境下，我更倾向于先实现核心逻辑，再补充关键路径的单元测试。在{{project_1}}中，我为支付和订单模块写了完整的测试用例，保证核心功能的稳定性。',
                type: 'technical',
                display_type: '测试理念'
            },
            {
                id: 's_tech_8',
                question: '如果让你带一个新人，你会怎么带他上手？',
                sample_answer: '我会先帮他梳理项目结构和核心模块，给他一份入门文档。第一周安排一些简单的Bug修复任务，让他熟悉代码流程。第二周开始分配小功能模块，通过Code Review给予反馈。我认为最好的学习方式是实践中学习，在{{project_1}}中我就是这样快速成长起来的。',
                type: 'behavioral',
                display_type: '带人能力'
            }
        ],
        部门主管: [
            {
                id: 's_mgr_1',
                question: '我直说了，你现在的能力还达不到我们的期望，但我们急需用人。你觉得自己多久能补上这个差距？',
                sample_answer: '感谢您的坦诚。我知道应该是指我在XX方面的经验不足。但我学习能力很强，在{{project_1}}中，我只用了一周就掌握了新技术并投入实战。如果有幸加入，我会在第一个月每天多花2小时业余时间补课，保证第二个月能独立负责模块。',
                type: 'stress',
                display_type: '自我认知'
            },
            {
                id: 's_mgr_2',
                question: '如果我给你一个模糊的需求，比如"做一个类似抖音的功能"，你要多久给我方案？',
                sample_answer: '我不会直接给方案，而是先问清楚：核心目标是什么。利用我过往做{{project_1}}的经验，我会在2天内给出一份包含核心路径的产品原型和技术可行性分析，而不是闭门造车。',
                type: 'behavioral',
                display_type: '需求分析'
            },
            {
                id: 's_mgr_3',
                question: '你觉得自己值多少钱？为什么？',
                sample_answer: '基于我{{experience}}年的经验和对{{skill_1}}的掌握程度，结合市场行情，我期望的薪资范围是XX-XX。在{{project_1}}中，我创造的价值包括提升系统性能50%、减少运维成本。我相信加入贵公司后，我的贡献会远超我的薪资成本。',
                type: 'stress',
                display_type: '薪资谈判'
            },
            {
                id: 's_mgr_4',
                question: '如果团队里有个老员工总是对你的建议冷嘲热讽，你怎么办？',
                sample_answer: '我会先反思自己的沟通方式是否得当。然后私下找他了解，是否有我不了解的历史背景或技术顾虑。在{{project_1}}时也遇到过类似情况，我通过主动请教他的强项领域，逐渐建立了信任。如果实在无法调和，我会如实向您反馈，寻求团队层面的解决方案。',
                type: 'behavioral',
                display_type: '人际关系'
            },
            {
                id: 's_mgr_5',
                question: '我们公司可能半年后就没钱了，你怕不怕？',
                sample_answer: '创业本就是高风险高回报的事业。我加入创业公司，本就做好了和公司共进退的准备。在这半年里，我会全力以赴帮公司创造价值，争取下一轮融资。哪怕最坏的情况发生，积累的{{skill_1}}和{{skill_2}}经验、以及创业团队的历练，都会成为我宝贵的资产。',
                type: 'stress',
                display_type: '风险承受'
            },
            {
                id: 's_mgr_6',
                question: '你简历上写的这些项目，真的都是你主导的吗？还是跟着别人做的？',
                sample_answer: '{{project_1}}确实是我主导的，从技术选型到架构设计再到核心模块开发，我都全程负责。当然团队协作也很重要，在过程中我也学到了很多。我可以详细给您讲解其中任何一个技术难点的解决思路，您随时可以深挖验证。',
                type: 'stress',
                display_type: '能力验证'
            },
            {
                id: 's_mgr_7',
                question: '如果入职后发现实际工作内容和面试时说的完全不一样，你怎么办？',
                sample_answer: '首先我会评估这种"不一样"是临时调整还是常态。创业公司变化快，我能接受合理的职责调整。但如果长期偏离，我会主动和您沟通，了解公司的真实需求和我的成长路径。我相信健康的团队是建立在坦诚沟通基础上的。',
                type: 'behavioral',
                display_type: '适应变化'
            },
            {
                id: 's_mgr_8',
                question: '你觉得我们今天的面试流程有什么问题吗？直说。',
                sample_answer: '我觉得整体流程很高效，能看出公司重视效率。如果说有一点可以优化，可能是可以提前发一份技术栈说明，让候选人能更有针对性地准备。不过我也理解创业公司HR资源有限，这只是一个小建议。',
                type: 'behavioral',
                display_type: '反馈能力'
            }
        ]
    },
    big_corp: {
        HR: [
            {
                id: 'b_hr_1',
                question: '请描述一次你与其他部门（如产品、运营）发生冲突的经历，你是如何解决的？',
                sample_answer: '在{{project_1}}上线前夕，产品临时变更需求。我没有直接拒绝，而是拉上测试和产品一起评估风险。最终我们达成一致，将非核心变更推迟。沟通中重要的是对事不对人，用数据和风险说话。',
                type: 'behavioral',
                display_type: '跨部门协作'
            },
            {
                id: 'b_hr_2',
                question: '你的职业规划是什么？未来3-5年你想在公司达到什么位置？',
                sample_answer: '前两年我希望深耕业务，利用我的{{skill_1}}能力成为核心模块的技术骨干。3-5年内，我期望能具备带领小团队的能力，或者在某个技术细分领域成为专家。贵公司的晋升体系很完善，我有信心沿着这个路径发展。',
                type: 'personal',
                display_type: '职业规划'
            },
            {
                id: 'b_hr_3',
                question: '你觉得你最大的缺点是什么？',
                sample_answer: '我有时候会过于关注细节，导致在{{project_1}}初期进度稍慢。后来我学会了使用TODO列表和番茄工作法来管理时间，在完美和完成之间找到平衡。我现在会定期和Leader对齐优先级，确保大方向不偏航。',
                type: 'personal',
                display_type: '自我反省'
            },
            {
                id: 'b_hr_4',
                question: '为什么要离开上一家公司？',
                sample_answer: '上一家公司给予了我{{experience}}年的成长，特别是在{{skill_1}}方面。但随着业务稳定，我希望能接触更大流量、更复杂架构的挑战，而贵公司的业务体量正好能提供这样的平台，让我能发挥更大的价值。',
                type: 'personal',
                display_type: '离职原因'
            }
        ],
        技术面试官: [
            {
                id: 'b_tech_1',
                question: '在之前的高并发项目中，你是如何设计缓存策略的？有没有遇到过缓存穿透或雪崩？',
                sample_answer: '在{{project_1}}中，我们使用了Redis作为二级缓存。为了防止雪崩，我们给缓存Key设置了随机过期时间。对于热门Key的击穿问题，使用了互斥锁。对于缓存穿透，我们在网关层做了布隆过滤器拦截非法请求。',
                type: 'technical',
                display_type: '系统设计'
            },
            {
                id: 'b_tech_2',
                question: '谈谈你对前端性能优化的理解。除了常规的压缩合并，你在渲染层做过哪些深度优化？',
                sample_answer: '除了基础优化，在渲染层我使用过虚拟列表处理长列表；利用Web Worker把重计算逻辑移出主线程。特别是在使用{{skill_1}}开发时，我通过Profile分析减少不必要的Render，通过Memoization优化组件性能。',
                type: 'technical',
                display_type: '深度优化'
            },
            {
                id: 'b_tech_3',
                question: '如何保证代码质量？你们团队有Code Review机制吗？',
                sample_answer: '不论团队大小，我都会坚持Code Review。在{{project_1}}中，我们在CI/CD流程中集成了Eslint和Sonar。我认为高质量代码不仅是写出来的，更是Review出来的。我会关注代码的可读性、扩展性以及是否有详尽的单元测试覆盖。',
                type: 'behavioral',
                display_type: '代码质量'
            },
            {
                id: 'b_tech_4',
                question: 'TCP三次握手和四次挥手的过程是怎样的？为什么需要四次挥手？',
                sample_answer: '这是一个经典网络问题。三次握手是为了确认双方的收发能力。四次挥手是因为TCP是全双工的，客户端发送FIN只代表它不再发送数据，服务端收到后先回ACK，处理完剩余数据后再发FIN。作为熟悉{{skill_2}}的开发者，理解底层协议对排查网络问题很有帮助。',
                type: 'technical',
                display_type: '计算机网络'
            }
        ],
        部门主管: [
            {
                id: 'b_mgr_1',
                question: '如果你的技术方案被架构委员会否决了，但你觉得你的更好，你会怎么做？',
                sample_answer: '我会复盘反馈，看是否忽略了全局视角。如果我确信我的方案在特定场景更优，我会准备详尽的Benchmark数据和对比报告，用数据证明价值。比如在{{project_1}}优化中，我就曾通过数据成功说服团队更换了技术栈。',
                type: 'behavioral',
                display_type: '冲突处理'
            },
            {
                id: 'b_mgr_2',
                question: '我们部门今年的KPI是降本增效，作为技术人员，你觉得你能做什么？',
                sample_answer: '降本方面，可以通过优化服务器资源利用率；增效方面，我会致力于建设内部工具平台。结合我对{{skill_1}}和{{skill_2}}的理解，我可以开发一些自动化脚本或脚手架，减少重复劳动力，提升团队整体的研发效能。',
                type: 'technical',
                display_type: '业务价值'
            },
            {
                id: 'b_mgr_3',
                question: '你在之前的工作中有什么遗憾或者做得不好的地方吗？',
                sample_answer: '在{{project_1}}早期，我过于关注技术实现，忽视了与产品经理的需求对齐，导致后期部分功能需要返工。这件事让我意识到，技术不仅仅是写代码，更重要的是理解业务全局。后来我主动参加产品评审会，提前了解需求背景，显著减少了返工率。',
                type: 'behavioral',
                display_type: '自我反思'
            },
            {
                id: 'b_mgr_4',
                question: '如果给你一个跨部门项目，但另一个部门的Leader不配合，你怎么推进？',
                sample_answer: '我会先尝试理解对方的顾虑和难处，找到共同利益点。如果沟通无效，我会向上汇报，请双方的共同上级来协调资源和优先级。在{{project_1}}中，我也遇到过类似情况，最终通过定期同步会和明确责任边界解决了问题。',
                type: 'behavioral',
                display_type: '跨部门协作'
            },
            {
                id: 'b_mgr_5',
                question: '你怎么看待"35岁危机"？你觉得自己能在公司做多久？',
                sample_answer: '我认为"35岁危机"的本质是能力与岗位要求的不匹配。我计划持续深耕{{skill_1}}领域，同时培养管理和架构能力。在贵公司，我看到了清晰的技术晋升路径，这让我对长期发展很有信心。我希望能在这里工作至少5-10年，成为领域专家或技术管理者。',
                type: 'personal',
                display_type: '长期规划'
            },
            {
                id: 'b_mgr_6',
                question: '你简历上有一段空窗期，这期间你在做什么？',
                sample_answer: '那段时间我主要在充电学习，系统性地提升了{{skill_2}}方面的能力，并考取了相关认证。同时也做了一些开源项目贡献，保持技术手感。我认为适时的沉淀和反思对职业发展是有益的，现在我更加清晰自己的职业方向。',
                type: 'personal',
                display_type: '经历说明'
            },
            {
                id: 'b_mgr_7',
                question: '如果你带的新人成长很慢，拖累了项目进度，你会怎么处理？',
                sample_answer: '我会先分析原因：是任务分配不当、还是新人能力确实不足。如果是前者，我会调整任务拆分粒度，给他可完成的小目标；如果是后者，我会安排结对编程和代码Review，帮助他提升。在{{project_1}}中，我就通过这种方式让一个新人在3个月内能独立负责模块。',
                type: 'behavioral',
                display_type: '团队培养'
            },
            {
                id: 'b_mgr_8',
                question: '你期望什么样的领导风格？如果和我的管理风格不匹配怎么办？',
                sample_answer: '我适应能力较强，能配合不同风格的领导。我比较喜欢目标导向、给予充分授权的风格。如果遇到风格差异，我会主动沟通，了解领导的期望和关注点，调整自己的工作汇报方式和节奏。我相信只要目标一致，风格差异是可以磨合的。',
                type: 'behavioral',
                display_type: '向上管理'
            }
        ]
    },
    soe: {
        HR: [
            {
                id: 'g_hr_1',
                question: '你为什么选择来我们单位？互联网公司工资更高，为什么不去？',
                sample_answer: '我有{{experience}}年工作经验，随着心态成熟，我更看重平台的稳定性和社会价值。贵单位承担着国家的工程，这种责任感是我向往的。我相信在这里能获得更长远、更稳健的职业生涯。',
                type: 'personal',
                display_type: '求职动机'
            },
            {
                id: 'g_hr_2',
                question: '这边的流程可能会比较繁琐，需要层层审批，你能适应吗？',
                sample_answer: '我完全理解。由于我们业务的敏感性和重要性，流程是为了规避风险。在{{project_1}}的交付过程中，我也养成了严格遵守规范的习惯，会严格按照规章制度办事，确保零差错。',
                type: 'behavioral',
                display_type: '适应性'
            },
            {
                id: 'g_hr_3',
                question: '你的父母支持你来这里工作吗？你对户口有什么要求？',
                sample_answer: '我的父母非常支持，他们认为能在贵单位工作通过是非常体面和稳定的。对于户口，既然选择来建设，我肯定希望能长期扎根，但也会服从单位的安排和政策，先把工作做好。',
                type: 'personal',
                display_type: '家庭背景'
            }
        ],
        技术面试官: [
            {
                id: 'g_tech_1',
                question: '你的文档编写能力怎么样？我们这里对文档规范要求非常高。',
                sample_answer: '我非常重视文档。在{{project_1}}中，我一直坚持"代码未动，文档先行"。我习惯编写详细的设计文档、接口文档和运维手册。我认为清晰的文档是知识传承的关键，能减少后续维护的大量成本。',
                type: 'behavioral',
                display_type: '文档能力'
            },
            {
                id: 'g_tech_2',
                question: '如果遇到系统需要升级，但是必须保证数据绝对安全，不能有一点丢失，你的方案是什么？',
                sample_answer: '稳字当头。首先进行全量数据冷备，再开启双写机制。在灰度环境验证升级脚本，确认无误后，深夜停机维护。利用我对{{skill_1}}数据库特性的理解，我会做好CheckSum校验，确保万无一失。',
                type: 'technical',
                display_type: '安全意识'
            },
            {
                id: 'g_tech_3',
                question: '你对国产化适配（信创）有了解吗？',
                sample_answer: '我有一定了解。现在国家强调自主可控，我关注过国产操作系统和数据库的适配。虽然我之前主要使用{{skill_1}}，但我相信技术是通用的，通过阅读文档和测试，我能很快完成向国产化环境的迁移和适配工作。',
                type: 'technical',
                display_type: '信创了解'
            }
        ],
        部门主管: [
            {
                id: 'soe_mgr_1',
                question: '如果是领导安排的任务，但是你觉得不合理，你会直接指出来吗？',
                sample_answer: '在私下场合，我会委婉地向领导请教，表达我的顾虑，供领导参考。但一旦领导拍板，在执行层面我会坚决执行，同时做好风险预案。我有{{experience}}年经验，懂得如何在尊重层级和技术良知之间找到平衡。',
                type: 'behavioral',
                display_type: '职场情商'
            },
            {
                id: 'soe_mgr_2',
                question: '你未来5年有考公务员或者回老家的打算吗？',
                sample_answer: '目前没有。既然选择了在XX城市发展并加入了贵单位，我就已经做好了长期扎根的准备。我的家人也支持我在这里安家立业，我希望能在单位长期贡献力量。',
                type: 'personal',
                display_type: '稳定性'
            },
            {
                id: 'soe_mgr_3',
                question: '你觉得在体制内工作最重要的品质是什么？',
                sample_answer: '我认为是责任心和执行力。在体制内，每一项工作都关系到国家和人民的利益，容不得马虎。同时也需要有耐心，很多工作需要长期坚持才能看到成效。我在{{project_1}}中就养成了认真负责、注重细节的习惯。',
                type: 'personal',
                display_type: '价值观'
            },
            {
                id: 'soe_mgr_4',
                question: '如果有同事向你反映领导的问题，你会怎么处理？',
                sample_answer: '我会先倾听同事的诉求，了解具体情况。如果是工作方法的分歧，我会建议他找合适的机会和领导沟通。如果涉及原则问题，我会建议通过正规渠道反映。我不会在背后议论，也不会轻易站队。在单位，团结稳定是大局。',
                type: 'behavioral',
                display_type: '处事原则'
            },
            {
                id: 'soe_mgr_5',
                question: '你对加班有什么看法？我们这边有时候会有专项任务需要加班。',
                sample_answer: '我完全理解，国企承担着很多重要的国家任务，关键时刻需要集体奉献。在之前的工作中，遇到{{project_1}}上线等关键节点，我也会主动加班确保任务完成。当然，我也会注意提高工作效率，争取在正常工作时间内完成日常任务。',
                type: 'behavioral',
                display_type: '工作态度'
            },
            {
                id: 'soe_mgr_6',
                question: '你对我们单位了解多少？为什么选择这里而不是其他单位？',
                sample_answer: '我对贵单位做过深入研究。贵单位在行业内属于龙头，承担着国家重要项目。我选择这里是因为三点：一是平台稳定、发展空间大；二是能参与有社会价值的工作；三是贵单位的技术积累和培养体系很完善。这与我的职业规划高度匹配。',
                type: 'personal',
                display_type: '求职动机'
            },
            {
                id: 'soe_mgr_7',
                question: '你在之前的工作中有没有犯过错误？是怎么处理的？',
                sample_answer: '有的。在{{project_1}}初期，我对需求理解不够透彻，导致部分功能需要返工。我第一时间向领导汇报，主动承担责任，加班加点完成了整改。这件事让我学会了遇事先确认清楚再动手，有问题及时暴露、不隐瞒。',
                type: 'behavioral',
                display_type: '错误处理'
            },
            {
                id: 'soe_mgr_8',
                question: '如果入职后发现工作内容很枯燥，和你想象的不一样，你会怎么做？',
                sample_answer: '我认为任何工作都有其价值，关键是找到意义感。即使是基础性工作，也是单位运转的重要一环。我会把它当作熟悉业务、积累经验的机会。同时我相信，只要把本职工作做好，未来会有更多发展机会。',
                type: 'behavioral',
                display_type: '心态调整'
            }
        ]
    },
    general: {
        HR: [
            {
                id: 'g_hr_1',
                question: '请先做一个自我介绍，特别是简单讲讲你过往的经历。',
                sample_answer: '面试官您好，我叫{{name}}，毕业于{{school}}。我有{{experience}}年的工作经验，主要技术栈是{{skills}}。在之前的经历中，我参与了{{project_1}}的开发。我是一个对技术充满热情的人，喜欢钻研底层原理，同时也注重业务落地。',
                type: 'behavioral',
                display_type: '自我介绍'
            },
            {
                id: 'g_hr_2',
                question: '你最大的优缺点分别是什么？',
                sample_answer: '我的优点是学习能力强，在{{project_1}}中我快速掌握了新技术。缺点是有时候会过于追求完美，导致进度受影响，但我正在通过时间管理工具来改善这一点。',
                type: 'behavioral',
                display_type: '自我认知'
            },
            {
                id: 'g_hr_3',
                question: '面对压力，你通常是如何调节的？',
                sample_answer: '我会把大压力拆解成小的可执行项，逐个击破。同时也会通过运动和阅读来放松心态。在{{project_1}}上线期间，我就是通过这种方式保持高效的。',
                type: 'behavioral',
                display_type: '抗压能力'
            }
        ],
        技术面试官: [
            {
                id: 'g_tech_1',
                question: '介绍一个你觉得自己做得最好的项目，以及你在其中的难点攻克。',
                sample_answer: '我觉得是{{project_1}}。在这个项目中，我们遇到了高并发下的性能瓶颈。我通过引入Redis缓存和优化数据库索引，将响应时间提升了50%。这个过程也让我对系统架构有了更深的理解。',
                type: 'technical',
                display_type: '项目深挖'
            },
            {
                id: 'g_tech_2',
                question: '如果让你重新设计{{project_1}}，你会做哪些改进？',
                sample_answer: '回顾{{project_1}}，我觉得在模块解耦上还有优化空间。当时为了赶进度，部分代码耦合度较高。如果重来，我会引入通过领域驱动设计(DDD)来划分边界，并更早引入自动化测试。',
                type: 'technical',
                display_type: '架构反思'
            }
        ],
        部门主管: [
            {
                id: 'gen_mgr_1',
                question: '你对未来3年的职业规划是什么？',
                sample_answer: '我希望在技术上继续深耕，成为{{skill_1}}领域的专家。同时也能承担更多的业务责任，带领小团队完成像{{project_1}}这样有挑战的项目，为公司创造更大的价值。',
                type: 'personal',
                display_type: '职业规划'
            },
            {
                id: 'gen_mgr_2',
                question: '你觉得什么样的团队氛围最适合你？',
                sample_answer: '我喜欢开放、透明、就事论事的团队氛围。大家为了同一个目标努力，技术上能互相Code Review、互相成长，像我在做{{project_1}}时那样。',
                type: 'behavioral',
                display_type: '团队文化'
            },
            {
                id: 'gen_mgr_3',
                question: '如果给你一个紧急项目，但资源不足，你会怎么做？',
                sample_answer: '我会首先和领导确认最核心的交付目标，砍掉非必要的功能。然后评估现有资源，看能否通过加班或借调人员来补充。在{{project_1}}紧急上线时，我就是通过聚焦核心MVP，成功在有限时间内完成了交付。',
                type: 'behavioral',
                display_type: '资源管理'
            },
            {
                id: 'gen_mgr_4',
                question: '你怎么评价你自己的沟通能力？',
                sample_answer: '我觉得我的沟通能力中等偏上。技术沟通方面，我能把复杂的技术问题用通俗的语言解释给非技术人员。跨部门协作方面，在{{project_1}}中我经常和产品、测试对接，确保信息同步。我还在持续提升，比如学习如何更好地向上汇报。',
                type: 'personal',
                display_type: '自我评价'
            },
            {
                id: 'gen_mgr_5',
                question: '你最近在学习什么新技术或新知识？',
                sample_answer: '最近我在学习{{skill_2}}相关的内容，因为感觉它对提升开发效率很有帮助。我每周会花几个小时看文档和做小项目练手。我认为持续学习是技术人员的生存之道，市场变化太快，不进步就会被淘汰。',
                type: 'personal',
                display_type: '学习能力'
            },
            {
                id: 'gen_mgr_6',
                question: '如果入职后和同事产生技术分歧，你会怎么处理？',
                sample_answer: '我会先倾听对方的观点，理解他的考虑。然后用数据和事实来讨论，比如做性能对比测试、查阅业界最佳实践。如果分歧依然存在，可以拉上更资深的同事或领导来仲裁。在{{project_1}}中我也遇到过类似情况，最终通过AB测试验证了我的方案。',
                type: 'behavioral',
                display_type: '冲突处理'
            },
            {
                id: 'gen_mgr_7',
                question: '你期望的薪资是多少？怎么考虑的？',
                sample_answer: '基于我{{experience}}年的经验、{{skill_1}}的技术能力，以及当前市场行情，我期望的薪资范围是XX-XX。当然，这不是一个硬性要求，我更看重的是与公司一起成长的机会。如果能有好的发展平台和学习空间，我愿意在薪资上有一定的灵活空间。',
                type: 'personal',
                display_type: '薪资期望'
            },
            {
                id: 'gen_mgr_8',
                question: '你有什么想问我的吗？',
                sample_answer: '有几个问题想请教：第一，团队目前的技术栈和主要业务方向是什么？第二，这个岗位的核心职责和考核标准是什么？第三，团队对新人有什么样的培养机制？我想更好地评估自己能否胜任这个岗位并快速融入团队。',
                type: 'behavioral',
                display_type: '反问面试官'
            }
        ]
    }
};

export const formatAnswer = (answer: string, resume: any): string => {
    let result = answer;

    // Replace Name/School/Experience
    result = result.replace(/{{name}}/g, resume.name || '求职者');
    result = result.replace(/{{school}}/g, resume.school || 'XX大学');
    result = result.replace(/{{experience}}/g, (resume.experience || 1).toString());

    // Replace Skills
    const skills = resume.skills || ['Java', 'Python'];
    result = result.replace(/{{skill_1}}/g, skills[0] || '编程');
    result = result.replace(/{{skill_2}}/g, skills[1] || '架构');
    result = result.replace(/{{skill_3}}/g, skills[2] || '算法');
    result = result.replace(/{{skills}}/g, skills.join('、'));

    // Replace Projects
    const projects = resume.projects || ['企业级电商系统'];
    // Projects might be strings or objects? JobHuntSystem says strings[]
    const p1 = projects[0] || '核心业务系统';
    result = result.replace(/{{project_1}}/g, p1);

    return result;
};

export const getQuestions = (
    companyType: string,
    role: string,
    count: number = 1,
    excludedIds: string[] = []
): QuestionItem[] => {
    // Default to startup if unknown, to avoid hitting empty pools
    let cType: CompanyType = 'startup';

    // Normalize inputs (Handle both Enum values and Descriptions)
    const typeStr = companyType.toLowerCase();

    if (typeStr === 'startup' || typeStr.includes('初创') || typeStr.includes('startup')) {
        cType = 'startup';
    } else if (['large', 'mid', 'foreign'].includes(typeStr) || typeStr.includes('大厂') || typeStr.includes('上市') || typeStr.includes('500') || typeStr.includes('外企')) {
        cType = 'big_corp';
    } else if (typeStr === 'state' || typeStr.includes('国企') || typeStr.includes('单位')) {
        cType = 'soe';
    } else {
        // Fallback for unknown types - ensure we check general first if populated, or random
        // Ideally we keep 'startup' as default or 'general' if populated.
        // Let's stick with 'startup' as a safe default that has content.
        cType = 'startup';
    }

    let rType: InterviewerRole = 'HR';
    if (role.toLowerCase().includes('tech') || role.includes('技术') || role.includes('研发') || role.includes('工程师')) rType = '技术面试官';
    else if (role.toLowerCase().includes('manager') || role.includes('主管') || role.includes('经理') || role.includes('CTO') || role.includes('总监') || role.includes('VP') || role.includes('总裁') || role.includes('老板')) rType = '部门主管';

    let pool = QuestionBank[cType]?.[rType] || [];

    // Safety: If specific pool is empty (shouldn't happen with default=startup, but just in case), try general or big_corp
    if (pool.length === 0) {
        pool = QuestionBank['general'][rType] || QuestionBank['big_corp'][rType] || [];
    }

    // Filter excluded questions
    const available = pool.filter(q => !excludedIds.includes(q.id));

    if (available.length === 0) {
        console.warn('Question pool exhausted or empty for:', cType, rType);
        // Fallback to pool (ignoring exclusion) if we really have to
        if (pool.length > 0) {
            const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
            return shuffledPool.slice(0, count);
        }
        // Last line defense: Return ANY question from 'general' HR
        const safetyPool = QuestionBank['general']['HR'];
        if (safetyPool && safetyPool.length > 0) {
            return [safetyPool[Math.floor(Math.random() * safetyPool.length)]];
        }
        return [];
    }

    const shuffled = available.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
