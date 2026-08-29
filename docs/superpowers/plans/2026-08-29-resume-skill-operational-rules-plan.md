# 简历 Skill 二期可执行规则 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把简历 Skill 的原则性边界补强为可执行、可验证、可回归检查的 Markdown 规程。

**Architecture:** 保持现有 Skill 文件结构，只补强入口、参考文件、示例和场景测试。事实底稿、JD 定制、文件交付和场景验证各自独立修改，主线程最终做引用一致性、安装副本同步和发布。

**Tech Stack:** Markdown、YAML frontmatter、Shell 验证脚本、Git。

## Global Constraints

- 所有用户可见内容使用中文。
- 不新增运行时依赖，不新增真实个人简历样例，不接入外部招聘平台。
- 默认先交付内容，只有用户明确要求时才进入 Word/PDF。
- 不修改用户提供的数字、时间、公司名、岗位名、项目名、专有名词、内部黑话和事实含义。
- 删除记录与原文缺失清单必须分开。
- 没有 JD 时不得输出岗位匹配结论。
- 多 JD 使用同一事实底稿分别生成版本，不生成万能混合版。

---

### Task 1: 事实底稿与年限规程

**Files:**
- Modify: `references/fact-ledger.md`

**Interfaces:**
- Consumes: `SKILL.md` 中“开始任何输出前读取 fact-ledger”的规则。
- Produces: 标准事实底稿字段、处理去向表、年限验算细则，供所有任务引用。

- [ ] **Step 1: 增加事实底稿标准字段**

在 `references/fact-ledger.md` 的“状态”后增加：

```markdown
## 标准字段

事实底稿至少包含以下字段：

| 字段 | 说明 |
|---|---|
| 原文摘录 | 用户原文中的对应句子或短语 |
| 来源位置 | 简历模块、JD 段落或用户补充回答 |
| 事实类型 | 时间、公司、岗位、项目、职责、动作、结果、技能、黑话、缺失项等 |
| 事实状态 | 已确认、待确认、原文缺失或不建议使用 |
| 贡献边界 | 个人负责、牵头、参与、协同、团队结果或无法归因 |
| 数据口径 | 基线、周期、分母、统计范围和是否为估算 |
| 处理方式 | 保留、重排、合并、降级、删除、移入风险清单或追问 |
| 是否进入正文 | 是、否或待确认后决定 |
| 风险或追问 | 需要用户解释或面试可能被追问的问题 |
```

- [ ] **Step 2: 澄清状态和处理方式**

在 `references/fact-ledger.md` 的“两张记录表”前增加：

```markdown
## 状态与处理方式

待确认事实不得进入最终简历正文，但可以进入阶段诊断、追问清单或风险清单。只要最终正文只使用已确认事实，待确认项不阻断阶段性交付。

“不建议使用”不是自动删除。处理方式如下：

| 处理方式 | 使用条件 | 记录要求 |
|---|---|---|
| 删除 | 完全不进入输出 | 写入删除记录，保留原文和原因 |
| 降级 | 保留事实但降低篇幅或强度 | 写明降级后的去向和表达边界 |
| 合并 | 与同一事实或同一能力维度合并 | 写明合并到哪条正文 |
| 移入风险清单 | 事实可能真实但不可解释 | 标出风险来源和追问 |

删除记录只记录完全移除的原文。合并、降级和移入风险清单不是删除，必须写明去向。
```

- [ ] **Step 3: 补全年限验算细则**

替换 `references/fact-ledger.md` 中“年限验算”小节为：

```markdown
## 年限验算

从时间线按月份计算可验证年限，与自评年限并列展示。年限验算是派生结论，不能静默把原文数字替换成计算结果。

- 重叠任职月份只计算一次；并行兼职、顾问、实习和全职经历分开说明。
- 只写年份不写月份时，标记“月份缺失”，不得假设从 1 月到 12 月。
- “至今”使用交付日期所在年月，并在结果中写明计算日期。
- 空窗期只做时间线提示，不自行补造经历。
- 不足整年的月份按“X 年 Y 个月”展示；需要概括时向下取整，并说明依据。
- 自评年限与计算年限不同，展示“原文年限 / 按时间线计算年限 / 差异原因”。
```

- [ ] **Step 4: 验证**

运行：

```bash
rg -n "标准字段|状态与处理方式|重叠任职|月份缺失|至今" references/fact-ledger.md
```

Expected: 每个关键词都有匹配。

### Task 2: 一页纸压缩与黑话边界

**Files:**
- Modify: `references/one-page-resume.md`

**Interfaces:**
- Consumes: Task 1 的事实底稿处理方式。
- Produces: 一页纸整理时允许改写动作、禁止动作、压缩顺序和两页触发条件。

- [ ] **Step 1: 增加只重组不改义规则**

在“流程”后增加：

```markdown
## 只重组不改义

允许重排模块、压缩句子、合并同一事实、调整语序和把同一能力维度内的重复内容收束成一条表达。禁止换概念、升级职责、替换不理解的黑话、补造动机、方法、结果或把团队结果写成个人结果。

如果一句改写无法追溯到事实底稿中的已确认事实，不能进入最终正文。
```

- [ ] **Step 2: 补充压缩顺序和两页触发条件**

替换“页数规则”为：

```markdown
## 页数规则

默认目标是一页。压缩顺序为：

1. 重复职责和重复能力表达
2. 泛化软话和没有证据支撑的自评
3. 低相关早期经历和实习细节
4. 基础技能和默认能力
5. 同一能力维度内证据较弱的表述
6. 换行、版式密度、字号和页边距

不得优先删除近期核心项目、个人贡献、关键背景、可解释结果和重要能力维度。如果压缩后只能保留“动作 + 数字”，而无法保留背景、判断、贡献或机制，明确提醒用户改为两页。两页不是失败，而是为了保全事实和面试可解释性。
```

- [ ] **Step 3: 收紧黑话删除边界**

替换“黑话”为：

```markdown
## 黑话

无法理解时原样保留并标记“需用户确认”，不自行翻译。篇幅压力下，只有用户确认低优先级、重复或无关，或存在更清楚的已确认事实替代时，才可删除黑话并写入删除记录。上下文明确解释过的术语，只能重新组织，不得扩展含义。
```

- [ ] **Step 4: 验证**

运行：

```bash
rg -n "只重组不改义|动作 \\+ 数字|两页不是失败|需用户确认" references/one-page-resume.md
```

Expected: 每个关键词都有匹配。

### Task 3: JD 定制、多版本协议与示例

**Files:**
- Modify: `references/jd-tailoring.md`
- Modify: `examples/05-JD证据映射与受控定制.md`

**Interfaces:**
- Consumes: Task 1 的事实编号和事实状态。
- Produces: 多 JD 输出协议、匹配描述口径、去精确幻觉示例。

- [ ] **Step 1: 增加匹配描述口径**

在 `references/jd-tailoring.md` 的“约束”中补充：

```markdown
- 匹配描述优先使用“强 / 中 / 弱 / 暂无法判断”等证据等级，不使用没有评分口径的精确分数。若用户要求评分，先说明维度、权重、证据来源和不确定项。
```

- [ ] **Step 2: 增加多 JD 定制协议**

在 `references/jd-tailoring.md` 的“流程”后增加：

```markdown
## 多 JD 定制协议

多个 JD 使用同一份事实底稿，事实编号在所有版本中保持一致。输出顺序为：

1. 共用事实底稿摘要
2. JD A 的核心要求、证据映射、定制策略、版本修改记录和定制版
3. JD B 的核心要求、证据映射、定制策略、版本修改记录和定制版
4. 多版本差异说明

每个 JD 独立判断证据强度，禁止把 A 岗位关键词带入 B 岗位版本。多版本之间只能调整顺序、侧重点、表达密度和自然关键词，不能改变事实状态、贡献边界和数字。
```

- [ ] **Step 3: 更新示例 05**

把 `examples/05-JD证据映射与受控定制.md` 中“匹配分”和“只调整约 12%”改为证据等级与可追溯改动；新增事实底稿摘要和定制版片段。

示例应包含这些标题：

```markdown
## 共用事实底稿摘要
## 证据覆盖判断
## 定制版片段
```

示例中不得出现 `82/100` 或 `12%`。

- [ ] **Step 4: 验证**

运行：

```bash
rg -n "多 JD 定制协议|强 / 中 / 弱|共用事实底稿摘要|定制版片段" references/jd-tailoring.md examples/05-JD证据映射与受控定制.md
rg -n "82/100|12%" examples/05-JD证据映射与受控定制.md
```

Expected: 第一条命令有匹配；第二条命令无匹配。

### Task 4: Word/PDF 真实渲染验收

**Files:**
- Modify: `references/document-output.md`

**Interfaces:**
- Consumes: 内容确认后的简历正文。
- Produces: 可编辑 Word、PDF 真实渲染、失败处理的验收规程。

- [ ] **Step 1: 增加可编辑 Word 标准**

在“交付顺序”后增加：

```markdown
## 可编辑 Word 标准

- 正文使用真实文本段落、列表或表格。
- 不把整页简历做成图片。
- 不用过度碎片化文本框承载主要内容。
- 姓名、联系方式、公司、岗位、任职时间和项目标题可复制。
```

- [ ] **Step 2: 增加 PDF 真实渲染验收**

继续增加：

```markdown
## PDF 真实渲染验收

PDF 必须从同版 Word 或同一内容源导出。交付前检查：

1. 回读实际页数。
2. 抽取文本，确认姓名、联系方式、公司、岗位、任职时间和核心项目可复制。
3. 必要时渲染 PDF 页面截图，检查溢出、遮挡、重叠和页脚截断。
4. 对照内容源抽查标题、日期、数字和项目名称一致。

如果验收失败，回到内容压缩或排版调整，不交付未通过文件。
```

- [ ] **Step 3: 补充 README 交付提醒**

本任务不直接改 README；由 Task 6 主线程合并入口文案，避免文件冲突。

- [ ] **Step 4: 验证**

运行：

```bash
rg -n "可编辑 Word 标准|PDF 真实渲染验收|回读实际页数|不交付未通过文件" references/document-output.md
```

Expected: 每个关键词都有匹配。

### Task 5: 角色规则扩展

**Files:**
- Modify: `references/roles/product-operations-growth.md`

**Interfaces:**
- Consumes: `SKILL.md` 的角色路由。
- Produces: 重点岗位子方向、相邻证据降级表达、新增角色文件规则。

- [ ] **Step 1: 增加子方向差异**

在“常见能力维度”后增加：

```markdown
## 子方向差异

- 产品：需求判断、用户问题、产品机制、迭代闭环、跨团队落地。
- 运营：用户或供给分层、策略执行、活动机制、流程建设、效率提升。
- 增长：获客、转化、留存、复购、渠道效率和实验闭环。
- 商业化：收入、客单价、转化效率、定价、权益、广告或交易变现。
- 平台：规则、工具、流程、治理、供给或商家生态建设。
- 电商：商品、类目、商家、履约、交易、会员和复购相关证据。
```

- [ ] **Step 2: 增加相邻证据降级表达**

增加：

```markdown
## 相邻证据降级表达

如果材料只证明协作或相邻能力，不写成独立负责。示例：

- “协同类目团队完成活动落地”不能改成“负责类目运营”。
- “参与会员权益配置”不能改成“主导会员体系建设”。
- “支持国际化电商项目”不能改成“具备完整海外市场操盘经验”。

可以写成“参与”“协同”“支持”“配合”“在某环节负责”，并在证据映射中标记差距。
```

- [ ] **Step 3: 增加角色扩展规则**

增加：

```markdown
## 角色扩展

新增深度岗位规则时，放入 `references/roles/`，并在 `SKILL.md` 写明触发条件。多个角色都相关时，优先使用目标 JD 或用户明确目标岗位；无法判断时使用通用规则并追问。

非产品、运营、增长、商业化、平台和电商岗位只使用通用规则，不自动创造岗位专业指标、工具链或行业判断。
```

- [ ] **Step 4: 验证**

运行：

```bash
rg -n "子方向差异|相邻证据降级表达|角色扩展|不自动创造岗位专业指标" references/roles/product-operations-growth.md
```

Expected: 每个关键词都有匹配。

### Task 6: 入口、README 与场景总收口

**Files:**
- Modify: `SKILL.md`
- Modify: `README.md`
- Modify: `tests/scenarios.md`

**Interfaces:**
- Consumes: Tasks 1-5 的新增规则。
- Produces: 入口路由提醒、README 用法、半可执行场景夹具。

- [ ] **Step 1: 更新入口角色路由**

在 `SKILL.md` 的“按任务读取参考文件”后补充：

```markdown
角色参考只在目标岗位或用户材料明确涉及产品、运营、增长、商业化、平台或电商时读取。非深度支持岗位只使用通用规则，不自动创造岗位专业指标；新增角色参考必须放入 `references/roles/` 并在入口写明触发条件。
```

- [ ] **Step 2: 更新 README 推荐用法和交付层级**

在 README 推荐使用方式中增加多 JD 示例：

```text
请按下面两个 JD 分别定制我的简历。
使用同一份事实底稿，分别输出每个 JD 的证据映射、定制策略和版本修改记录，不要混成一份万能简历。
```

在交付层级中补充：

```markdown
Word/PDF 是内容确认后的文件化阶段。成功标准不是文件存在，而是渲染后页数、可复制文本、可读性和内容一致性通过检查。
```

- [ ] **Step 3: 升级场景测试格式**

把 `tests/scenarios.md` 改为包含“使用方式”和“回归夹具”的文档。每个夹具格式为：

```markdown
### 场景：场景名称

- 输入材料摘要：
- 用户请求：
- 必须读取：
- 必须输出：
- 禁止输出：
- 风险标记：
- 通过标准：
```

必须至少包含这些场景：

```text
只有简历且用户说帮我优化
只有 JD
多个 JD
非重点岗位 JD
自评年限与时间线不一致
任职时间重叠
只有年份没有月份
原文缺失被误放入删除记录
同一事实合并后含义扩大
信息严重不足
频繁跳槽
短经历
空窗期
转行
无数字成果
明确要求 Word/PDF
```

- [ ] **Step 4: 验证**

运行：

```bash
rg -n "非深度支持岗位|两个 JD|内容一致性|场景：多个 JD|场景：非重点岗位 JD|场景：明确要求 Word/PDF" SKILL.md README.md tests/scenarios.md
```

Expected: 每个关键词都有匹配。

### Task 7: 总验证、同步安装副本、提交和推送

**Files:**
- Modify: `/Users/xxqq/.agents/skills/one-page-resume-editor/`

**Interfaces:**
- Consumes: Tasks 1-6 的仓库修改。
- Produces: 仓库与本机安装副本一致，`main` 推送到 GitHub。

- [ ] **Step 1: 运行 Skill 与空白检查**

Run:

```bash
python3 /Users/xxqq/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
git diff --check
```

Expected:

```text
Skill is valid!
```

`git diff --check` 无输出。

- [ ] **Step 2: 检查参考路径完整**

Run:

```bash
for path in references/fact-ledger.md references/diagnosis.md references/one-page-resume.md references/jd-tailoring.md references/interview-and-review.md references/document-output.md references/roles/product-operations-growth.md; do test -f "$path" || exit 1; done
```

Expected: 命令退出码为 0。

- [ ] **Step 3: 同步安装副本**

Run:

```bash
rsync -a --delete --exclude .git --exclude docs ./ /Users/xxqq/.agents/skills/one-page-resume-editor/
```

Expected: 命令退出码为 0。

- [ ] **Step 4: 比较仓库与安装副本**

Run:

```bash
diff -qr . /Users/xxqq/.agents/skills/one-page-resume-editor --exclude=.git --exclude=docs
```

Expected: 无输出。

- [ ] **Step 5: 提交实现**

Run:

```bash
git status --short
git add SKILL.md README.md references tests examples
git commit -m "Clarify resume skill operational rules"
```

Expected: 提交只包含二期规则、示例和场景测试修改。

- [ ] **Step 6: 推送设计与实现**

Run:

```bash
git push origin main
git status --short --branch
```

Expected: `main` 推送成功，状态为 `## main...origin/main`。
