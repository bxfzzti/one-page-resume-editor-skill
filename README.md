# Senior Resume Agent Skill

面向 **8–15 年经验候选人** 的简历 Agent Skill。它不只是“润色简历”，而是支持完整工作流：

1. **DIAGNOSE**：先评分诊断，再决定是否需要改写
2. **MASTER**：生成一页纸主简历
3. **TAILOR**：输入 JD 后做受控的 10%–15% 定制
4. **REVIEW**：审查夸大、黑话、权重、时间线和证据问题

适合 Agent、Claude Code、Codex 等项目级工作流。

## Repository Structure

```text
senior-resume-skill/
├── SKILL.md
├── README.md
└── examples/
    ├── 01-long-resume-to-one-page.md
    ├── 02-short-stint-compression.md
    ├── 03-collaboration-vs-industry-experience.md
    ├── 04-resume-diagnostic-score.md
    └── 05-jd-tailoring.md
```

## Quick Start

### 1. 先诊断，不急着改

```text
Read SKILL.md and run DIAGNOSE mode on my resume.
Score all dimensions, identify my career throughline,
tier my experiences, and list the top 3 problems.
Do not rewrite the full resume yet.
```

### 2. 生成一页纸母版

```text
Read SKILL.md.
Use MASTER mode to create a one-page Chinese master resume.
Keep claims interview-defensible.
Do not invent metrics.
```

### 3. 输入 JD 做 10%–15% 定制

```text
Read SKILL.md and use TAILOR mode.
Compare my master resume with the JD.
Extract the top 3 requirements, build an evidence map,
calculate fit score, identify gaps, and customize only 10–15%.
Do not add unsupported keywords or experience.
```

### 4. 只审查风险

```text
Read SKILL.md and use REVIEW mode.
Find overclaims, weak metrics, internal jargon,
repeated responsibilities, timeline issues,
and incorrect experience weighting.
```

## Diagnostic Scoring

总分 100，维度包括：

| Dimension | Weight |
|---|---:|
| Positioning clarity | 15% |
| Evidence strength | 20% |
| Seniority signal | 15% |
| Career throughline | 15% |
| Information density | 10% |
| JD readiness | 10% |
| Truthfulness & defensibility | 10% |
| External readability | 5% |

解释：

- 90–100：强，只需轻定制
- 80–89：有竞争力，做定向优化
- 70–79：可用，但定位或权重有问题
- 60–69：建议重写
- <60：建议结构性重建

## JD Tailoring Philosophy

默认只改母版的 **10%–15%**。

允许：

- 调整摘要顺序
- 调整模块顺序
- 前置相关证据
- 用 JD 可理解的词替换泛化表达
- 压缩无关经历
- 增加已有证据支持的关键词

禁止：

- 虚构经验
- 把协同写成负责
- 把行业接触写成行业 ownership
- 添加未证实的语言、工具、市场经验
- 为模仿 JD 重写 50% 以上

## Core Philosophy

好的中高阶简历不是职业档案，而是招聘决策界面。

它应该让招聘方快速判断：

1. 这个人做过足够复杂的业务；
2. 这个人拿到过可验证的结果；
3. 这个人的能力可以迁移到当前岗位。

## Examples

- `01-long-resume-to-one-page.md`：项目流水账 → 高密度能力模块
- `02-short-stint-compression.md`：6 个月经历如何保留但降权
- `03-collaboration-vs-industry-experience.md`：协同经验 ≠ 行业经验
- `04-resume-diagnostic-score.md`：先评分诊断，再决定怎么改
- `05-jd-tailoring.md`：JD 证据映射 + 受控定制

## Suggested License

MIT
