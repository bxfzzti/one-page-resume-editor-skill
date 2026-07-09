# 一页纸简历修改器

适合 **5 年以上中高阶求职者** 的简历诊断与改写 Skill。

它不是简单润色工具，而是先自动识别简历里的核心问题，再给出可执行的修改建议，帮助你把复杂经历压缩成一份定位清晰、证据充分、可面试、可投递的一页纸简历。

这个仓库提供的是 `SKILL.md`：一套可被 Codex、Claude Code 或其他 Agent 调用的简历修改规则、流程和示例。它本身是 Skill，不是独立 Agent。

## 适用场景

- 简历太长，项目像流水账
- 多段经历之间缺少清晰职业主线
- 不知道哪些经历该展开、哪些该压缩
- 有数据和成果，但表达不够有说服力
- 担心简历写得太虚、太夸大，面试时撑不住
- 想根据 JD 做定制，但不想改到失真

## 核心能力

1. **诊断问题**：先评分，再判断是否需要重写
2. **给出建议**：指出定位、证据、结构、权重、风险等问题
3. **压缩经历**：把长简历整理成一页纸主简历
4. **按 JD 定制**：基于已有事实做 10%–15% 的受控调整
5. **审查风险**：检查夸大、黑话、归因不清和面试不可解释的表达

## 使用方式

### 1. 先诊断，不急着改

```text
Read SKILL.md and run DIAGNOSE mode on my resume.
Score all dimensions, identify my career throughline,
tier my experiences, and list the top 3 problems.
Do not rewrite the full resume yet.
```

### 2. 生成一页纸主简历

```text
Read SKILL.md.
Use MASTER mode to create a one-page Chinese master resume.
Keep claims interview-defensible.
Do not invent metrics.
```

### 3. 输入 JD 做轻定制

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

## 诊断维度

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

## 改写原则

好的中高阶简历不是职业档案，而是招聘决策界面。

它应该让招聘方快速判断：

1. 这个人做过足够复杂的工作；
2. 这个人拿到过可验证的结果；
3. 这个人的能力可以迁移到当前岗位。

默认只按 JD 改动母版的 **10%–15%**。

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

## 示例

- `01-long-resume-to-one-page.md`：长简历如何压缩成一页纸
- `02-short-stint-compression.md`：6 个月经历如何保留但降权
- `03-collaboration-vs-industry-experience.md`：协同经验不等于行业经验
- `04-resume-diagnostic-score.md`：先评分诊断，再决定怎么改
- `05-jd-tailoring.md`：JD 证据映射与受控定制
- `06-single-company-long-tenure.md`：单公司多年经历如何按能力维度拆分

## Repository Structure

```text
one-page-resume-editor-skill/
├── SKILL.md
├── README.md
└── examples/
    ├── 01-long-resume-to-one-page.md
    ├── 02-short-stint-compression.md
    ├── 03-collaboration-vs-industry-experience.md
    ├── 04-resume-diagnostic-score.md
    ├── 05-jd-tailoring.md
    └── 06-single-company-long-tenure.md
```

## Suggested License

MIT
