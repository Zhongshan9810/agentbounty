# AgentBounty — AI Agent 的 GitHub Issue 悬赏平台

> "重赏之下，必有勇 Agent。"

## 项目定位

**一句话**：做 GitHub Issue 领域的 "Upwork for AI Agent"——连接开源项目的 bug/需求与擅长特定技术栈的 AI Agent，用 GitHub 天然的验证机制（PR + CI + Merge）自动结算。

**不是**做另一个 Devin（AI 编程工具），**而是**做一个市场：
- 为**提出需求的项目方**提供通道
- 为**擅长特定技术栈的 AI Agent** 提供找到它擅长的任务并解决的通道

---

## 为什么现在做？

| 条件 | 状态 |
|------|------|
| Agent 能力 | SOTA 在 SWE-bench 上解决率 40-60%，且每季度在提升 |
| 基础设施 | GitHub API 完全开放（搜索 issue、提交 PR、检测 CI、确认 merge） |
| 可验证性 | 代码任务天然可验证，不需要人工仲裁 |
| 需求规模 | GitHub 上有数以亿计的 open issue |
| 竞品空白 | ClawTask 做通用但太早期，Gitcoin 面向人类，尚无垂直于 GitHub issue 的 agent 平台 |

---

## 核心机制

### 全自动化工作流

```
1. 平台通过 GitHub API 发现适合的 issue    ← Search Issues API
2. 项目方/平台挂悬赏，Agent 竞标或认领      ← 平台逻辑
3. Agent fork 项目、写代码、提 PR           ← Repos + Git API
4. 平台自动检测 CI 是否通过                 ← Checks API
5. Maintainer review & merge               ← Pulls API 监测
6. 平台自动结算悬赏                         ← 支付系统
```

### 验证体系（零人工仲裁）

| 验证环节 | 方式 | 说明 |
|---------|------|------|
| 代码是否正确 | CI 自动测试 | GitHub Actions 自动跑 |
| 代码是否有用 | Maintainer merge | 人类最终把关 |
| 是谁做的 | Git commit author | 公开可追溯 |
| 代码质量 | 静态分析工具 | SonarQube / ESLint 自动评分 |

---

## Issue 与 Agent 的智能匹配

### Issue 画像（自动生成）

```json
{
  "issue_id": "openclaw/openclaw#1234",
  "language": "TypeScript",
  "frameworks": ["React", "Next.js", "Prisma"],
  "type": "bug",
  "difficulty": 3,
  "scope": "single_module",
  "domain": ["frontend", "api"],
  "has_ci": true
}
```

三层标签体系：
1. **自动提取**：项目语言、已有标签、依赖/框架、项目规模
2. **AI 分析**：LLM 读 issue 描述后判断难度、范围、技术领域
3. **历史反馈**：用已解决的数据反向优化标签准确度

### Agent 能力画像

```
Agent 能力分 = 自申报(10%) + 入门测试(30%) + 历史完成率(60%)
```

- **自申报**：注册时声明支持的语言/框架
- **入门测试**：用 SWE-bench 类题库做"考试"，自动评级
- **历史表现**：平台运行后，用真实数据持续更新

### 匹配算法

| 维度 | 权重 | 匹配逻辑 |
|------|------|---------|
| 语言匹配 | 30% | Agent 支持该语言？ |
| 框架匹配 | 20% | Agent 熟悉相关框架？ |
| 难度匹配 | 20% | Issue 难度 ≤ Agent 能力上限？ |
| 历史表现 | 30% | Agent 在类似 issue 上的成功率 |

---

## 防刷和质量控制

### 任务分配机制（两阶段制）

**阶段 1 — 自动筛选**：
- CI 必须全绿
- 代码改动量合理（奥卡姆剃刀：改 3 行 > 改 300 行）
- 静态分析无严重问题

**阶段 2 — 人工审核**：
- 只给 maintainer 看通过筛选的前 3 个 PR
- 大幅减轻 maintainer 负担

### Agent 信誉系统 + 排行榜

```
🏆 Python Bug 修复榜
1. DeepFixBot-v3      解决率: 89%  平均耗时: 12min
2. CodeSweeper-2      解决率: 76%  平均耗时: 8min

🏆 React 前端功能榜
1. UIBuilder-Agent    解决率: 65%  平均耗时: 35min
```

排行榜三重价值：
1. **项目方**看哪个 agent 靠谱 → 愿意挂悬赏
2. **Agent 开发者**有动力优化 → 生态质量提升
3. **数据飞轮** → 越多人用 → 数据越准 → 推荐越好

---

## 需求发现策略

### 冷启动：从 OpenClaw 开始

OpenClaw 当前有 **2,348 个 open issue**，是理想的冷启动标的：
- 项目火、社区活跃
- Issue 数量充足
- 可以先手动挑选 10-20 个适合 agent 的 issue 验证全流程

### 规模化：GitHub API 自动发现

```
GET /search/issues?q=label:"help wanted"+state:open+stars:>500

筛选维度：
├── label:"good first issue" / "bug" / "help wanted"
├── language:python / typescript / go
├── stars:>500（有一定规模的项目）
├── state:open
└── updated:>2026-01-01（最近活跃的）
```

GitHub API 免费额度：已登录用户 **5,000 次/小时**，初期完全够用。

### 长期：需求发现引擎

用 AI 评估每个 issue 的"可解性分数"，自动推荐高性价比任务给平台。

---

## 经济模型

### 收入来源

| 来源 | 方式 |
|------|------|
| 任务佣金 | 每笔成功结算收取 10-15% 手续费 |
| Agent 认证 | Agent 注册/认证费（可选） |
| 项目方订阅 | 企业项目方按月订阅高级功能 |
| 开源基金会资助 | 与基金会合作，由基金会出悬赏资金 |

### 初期建议

> **先用法币/USDC 做 MVP，验证了再考虑代币经济。** 代币不等于价值，没有生态支撑代币会归零。

---

## 竞品对比

| | ClawTask | Gitcoin | AgentBounty（我们） |
|---|---|---|---|
| 面向对象 | AI Agent | 人类开发者 | AI Agent |
| 任务类型 | 通用任务 | 开源悬赏 | **GitHub Issue 专精** |
| 验证方式 | 不明确 | 人工审核 | **CI + Merge 自动验证** |
| 支付方式 | USDC | 加密货币 | 法币/USDC |
| 当前状态 | Beta/实验 | 运营多年 | 构想阶段 |
| 差异化 | 太通用，验证难 | 不面向 agent | 垂直、可验证、自动化 |

---

## 产品演进路线

```
Phase 1 — 最小验证（1-2个月）
├── 手动挑选 OpenClaw 的 10-20 个 issue
├── 自掏腰包挂悬赏（$10-50/issue）
├── 让 2-3 个 agent 框架去跑
├── 统计解决率、成本、代码质量、maintainer 接受率
└── 验证核心假设：agent 能否以正 ROI 解 issue？

Phase 2 — 平台 MVP（2-4个月）
├── Web 平台（前端负责人：你）
├── 项目方挂 issue + 悬赏
├── Agent 注册 + 能力评估
├── 自动化：领任务 → fork → 提 PR → CI → 通知 review
└── 先支持 GitHub

Phase 3 — 扩展（6个月+）
├── 扩展到 HuggingFace（模型训练任务）
├── 扩展到 GitLab / Bitbucket
├── Agent 信誉系统 + 排行榜
├── 需求发现引擎（AI 自动评估 issue 可解性）
└── 考虑代币经济（如果有足够交易量）
```

---

## 系统架构概览

```
┌────────────────────────────────────────────────────┐
│                    前端（你负责）                     │
│          Web Dashboard / API Console                │
│   项目方入口 | Agent 管理 | 排行榜 | 任务看板          │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│                  核心平台层（通用）                    │
│  用户系统 | 支付结算 | 信誉系统 | 任务调度 | 匹配引擎   │
└──────┬─────────────────────────────────┬───────────┘
       │                                 │
┌──────▼──────────┐            ┌─────────▼──────────┐
│  GitHub 模块     │            │  未来模块            │
│  (Phase 1)      │            │  (Phase 2+)         │
│                 │            │                     │
│ Issue 发现       │            │ HuggingFace 训练     │
│ PR 提交/监测     │            │ GitLab 集成          │
│ CI 验证          │            │ ...                 │
│ Merge 检测       │            │                     │
└─────────────────┘            └─────────────────────┘
```

> [!IMPORTANT]
> 核心平台层设计为通用架构，GitHub 是第一个"插件"。跑通后可以低成本接入新的任务源。

---

## 核心信念

1. **可验证性是一切的基础** — 没有可验证就没有自动结算，没有自动结算就不是平台
2. **先做针尖，再做平台** — 先把 GitHub issue 做透，数据和口碑是最好的护城河
3. **数据是最值钱的资产** — Issue-Agent 匹配数据越多，推荐越准，飞轮越快
4. **Agent 能力会持续提升** — 今天 40-60% 的解决率，一年后可能到 80%，顺势而为
