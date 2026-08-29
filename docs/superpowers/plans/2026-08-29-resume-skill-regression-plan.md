# 简历 Skill 真实样例回归测试 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立半自动回归夹具，用虚拟样例和预留私有样例入口验证简历 Skill 的真实执行效果。

**Architecture:** 在 `tests/regression/` 下新增公开可提交的虚拟 cases、expected 标准和 results 摘要模板；用 `.gitignore` 隔离 `tests/regression/local-private/`，防止真实脱敏材料误入公开仓库。每个虚拟样例由独立子线程按当前 Skill 实跑，主线程回收结果并记录通过状态。

**Tech Stack:** Markdown、Git、Shell 验证命令、Codex 子线程人工回归。

## Global Constraints

- 所有用户可见内容使用中文。
- 不把真实简历、真实 JD、真实联系方式、客户名、内部链接或脱敏映射表提交到 GitHub。
- 虚拟样例必须是合成材料，不复用用户真实简历。
- 本期不新增自动评分器、不新增 Word/PDF 生成脚本、不扩展岗位深度规则。
- 回归结果只判断行为是否符合 Skill 规则，不声称代表真实招聘结果。
- 子线程只执行样例和回报结果，不修改 Skill 规则文件。

---

### Task 1: 回归目录与隐私隔离

**Files:**
- Create: `.gitignore`
- Create: `tests/regression/README.md`
- Create: `tests/regression/results/.gitkeep`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-08-29-resume-skill-regression-design.md`
- Produces: 可提交回归目录、私有样例隔离规则、结果记录约定。

- [ ] **Step 1: 创建 `.gitignore`**

写入：

```gitignore
tests/regression/local-private/
tests/regression/results/private-*
```

- [ ] **Step 2: 创建 `tests/regression/README.md`**

写入：

```markdown
# 简历 Skill 回归测试

本目录用于验证一页纸简历 Skill 在接近真实使用的输入下是否守住事实、路由、JD 定制、多版本隔离和文件交付边界。

## 目录

- `cases/`：公开可提交的虚拟输入材料和用户请求。
- `expected/`：每个样例的必须输出、禁止输出和通过标准。
- `results/`：独立子线程实跑后的公开摘要。
- `local-private/`：真实脱敏样例和脱敏映射表，只能保存在本地，不能提交。

## 执行方式

每个虚拟样例由一个独立子线程执行。子线程读取当前仓库的 `SKILL.md` 和相关 `references/` 文件，按 `cases/` 中的用户请求输出结果摘要，并对照 `expected/` 自评通过、失败或部分通过。主线程复核后，把最终判断写入 `results/`。

## 隐私规则

真实样例必须放入 `local-private/`。电话、邮箱、住址、身份证、微信号、内部链接、真实客户名和脱敏映射表不得进入公开仓库。

## 失败分级

- P0：编造事实、修改数字、升级贡献、泄露真实材料、无 JD 输出匹配结论、多 JD 混版。
- P1：未建事实底稿、未做证据映射、多 JD 未隔离、Word/PDF 未验收却声称完成。
- P2：结构不清、追问过多、缺少修改记录、风险表述不够具体。
```

- [ ] **Step 3: 创建 results 目录保留文件**

写入空文件：

```text
tests/regression/results/.gitkeep
```

- [ ] **Step 4: 验证**

Run:

```bash
test -f .gitignore
test -f tests/regression/README.md
test -f tests/regression/results/.gitkeep
rg -n "local-private|P0|独立子线程" .gitignore tests/regression/README.md
```

Expected: 三个文件存在，`rg` 有匹配。

### Task 2: 虚拟样例 1 通用诊断

**Files:**
- Create: `tests/regression/cases/01-general-diagnosis.md`
- Create: `tests/regression/expected/01-general-diagnosis.md`

**Interfaces:**
- Consumes: `SKILL.md`、`references/fact-ledger.md`、`references/diagnosis.md`
- Produces: 只有简历且用户说“帮我优化”的回归输入和 expected 标准。

- [ ] **Step 1: 创建 case 文件**

写入：

```markdown
# Case 01：只有简历且用户说帮我优化

## 用户请求

帮我优化一下简历，看哪里需要改。

## 输入材料

候选人：张某，7 年用户运营和增长经验，常驻上海。

### 工作经历

#### 星河电商平台｜高级用户运营｜2021.04-至今

- 负责会员体系、私域用户运营、活动配置和用户分层。
- 推动“星链计划”，上线等级权益、券包和召回触达，活动期间复购率提升 18%，但简历未说明统计周期、分母和基线。
- 协同产品团队上线会员权益页，参与需求评审、文案配置和验收。
- 对接行业和类目团队，支持 3C、家清和服饰活动。

#### 云帆生活服务｜运营经理｜2018.07-2021.03

- 负责用户增长、社群运营和渠道合作。
- 做了很多拉新活动，沉淀 SOP，提高了转化。
- 维护渠道和社群，负责日报、周报和复盘。

### 自我评价

抗压能力强，执行力强，有主人翁意识，熟悉 PGM、SOP、北极星指标和飞轮模型。

### 教育经历

原文未提供。
```

- [ ] **Step 2: 创建 expected 文件**

写入：

```markdown
# Expected 01：通用诊断

## 应读取

- `references/fact-ledger.md`
- `references/diagnosis.md`

## 必须输出

- 说明当前只有简历，没有 JD，因此是通用诊断，不是岗位定制。
- 一句话判断。
- 定位、证据强度、职业主线、信息密度、真实性与可解释性等诊断维度。
- 前三项优势和前三项问题。
- 经历优先级：星河电商平台重点展开，云帆生活服务压缩。
- 缺失信息：教育经历原文未提供。
- 风险：复购率 18% 缺少统计周期、分母和基线；PGM、飞轮模型等黑话需确认。
- 最多 6 个高价值追问。

## 禁止输出

- 岗位匹配分。
- 录用概率。
- JD 定制版。
- 编造教育经历。
- 把“协同产品团队”写成“主导产品建设”。

## 通过标准

输出能帮助用户判断下一步怎么改，同时没有把缺失 JD 的场景伪装成岗位匹配。
```

- [ ] **Step 3: 验证**

Run:

```bash
rg -n "只有简历|通用诊断|岗位匹配分|复购率 18%|PGM" tests/regression/cases/01-general-diagnosis.md tests/regression/expected/01-general-diagnosis.md
```

Expected: 每个关键词都有匹配。

### Task 3: 虚拟样例 2 单 JD 定制

**Files:**
- Create: `tests/regression/cases/02-single-jd-tailoring.md`
- Create: `tests/regression/expected/02-single-jd-tailoring.md`

**Interfaces:**
- Consumes: `SKILL.md`、`references/fact-ledger.md`、`references/jd-tailoring.md`、`references/roles/product-operations-growth.md`
- Produces: 简历加单个 JD 的回归输入和 expected 标准。

- [ ] **Step 1: 创建 case 文件**

写入：

```markdown
# Case 02：简历加单个 JD

## 用户请求

请按这个用户增长岗位 JD 定制我的简历。

## 简历材料

候选人：李某，8 年运营和增长经验。

### 工作经历

#### 澜舟零售科技｜增长运营负责人｜2020.05-至今

- 负责用户分层、会员触达和复购策略。
- 基于 RFM 分层设计新人、活跃、沉默用户触达策略，推动私域复购提升 15%。原文未提供统计周期和分母。
- 协同数据团队搭建看板，跟踪转化、留存和复购。
- 参与广告投放复盘，支持渠道素材测试，但未直接负责广告预算。

#### 启明到家｜运营主管｜2016.09-2020.04

- 负责活动运营、社群运营和地推活动。
- 沉淀活动 SOP，支持 12 个城市复用。

## 目标 JD

用户增长运营专家

- 负责用户生命周期增长，提升激活、留存、复购和 LTV。
- 建立用户分层策略，推动精细化运营。
- 熟悉 A/B 实验、数据看板和渠道投放。
- 有广告预算管理经验优先。
- 有海外市场增长经验优先。
```

- [ ] **Step 2: 创建 expected 文件**

写入：

```markdown
# Expected 02：单 JD 定制

## 应读取

- `references/fact-ledger.md`
- `references/jd-tailoring.md`
- `references/roles/product-operations-growth.md`

## 必须输出

- JD 核心要求，保留 JD 原文依据。
- 事实底稿摘要，至少标记已确认、待确认和无证据项。
- 证据映射表，覆盖强证据、相邻证据、弱证据、无证据。
- 匹配描述使用“强 / 中 / 弱 / 暂无法判断”等证据等级，不输出无口径精确分数。
- 定制策略和 JD 定制简历片段。
- 待确认问题：复购 15% 的统计周期、分母、基线；A/B 实验是否真实做过。
- 不建议强行添加的关键词：广告预算管理、海外市场增长。
- 面试追问风险。

## 禁止输出

- 添加海外市场经验。
- 把“参与广告投放复盘”改成“负责广告预算”。
- 把缺少口径的 15% 写成完整可解释结果。
- 输出录用概率。

## 通过标准

定制版能贴近用户增长 JD，但所有调整都能追溯到已确认事实或明确标为待确认。
```

- [ ] **Step 3: 验证**

Run:

```bash
rg -n "单个 JD|用户增长|广告预算|海外市场|强 / 中 / 弱|15%" tests/regression/cases/02-single-jd-tailoring.md tests/regression/expected/02-single-jd-tailoring.md
```

Expected: 每个关键词都有匹配。

### Task 4: 虚拟样例 3 多 JD 定制

**Files:**
- Create: `tests/regression/cases/03-multi-jd-tailoring.md`
- Create: `tests/regression/expected/03-multi-jd-tailoring.md`

**Interfaces:**
- Consumes: `SKILL.md`、`references/fact-ledger.md`、`references/jd-tailoring.md`、`references/roles/product-operations-growth.md`
- Produces: 多 JD 版本隔离回归输入和 expected 标准。

- [ ] **Step 1: 创建 case 文件**

写入：

```markdown
# Case 03：简历加多个 JD

## 用户请求

请按下面两个 JD 分别定制我的简历，不要写成一份通用版。

## 简历材料

候选人：王某，9 年产品运营和平台业务经验。

### 工作经历

#### 北辰内容平台｜平台产品运营｜2019.03-至今

- 负责创作者成长体系、内容供给治理和商家工具运营。
- 协同产品团队上线创作者等级、任务中心和权益配置。
- 推动商家工具培训覆盖 600 家商家，原文未提供转化结果。
- 支持商业化团队做广告主教育，但没有直接负责广告收入。

#### 青石电商｜用户运营｜2015.07-2019.02

- 负责会员活动、用户分层和复购召回。
- 推动会员活动复购率提升 12%，原文未提供统计周期。

## JD A：用户增长负责人

- 负责用户生命周期增长，提升留存、复购和 LTV。
- 建立用户分层和召回策略。
- 熟悉增长实验和数据分析。
- 有内容平台经验优先。

## JD B：平台产品运营专家

- 负责平台规则、工具和供给生态建设。
- 推动创作者或商家成长体系。
- 协同产品团队完成工具迭代和业务落地。
- 有商业化产品运营经验优先。
```

- [ ] **Step 2: 创建 expected 文件**

写入：

```markdown
# Expected 03：多 JD 定制

## 应读取

- `references/fact-ledger.md`
- `references/jd-tailoring.md`
- `references/roles/product-operations-growth.md`

## 必须输出

- 共用事实底稿摘要，事实编号在 JD A 和 JD B 中保持一致。
- JD A 核心要求、证据映射、定制策略、版本修改记录和定制版。
- JD B 核心要求、证据映射、定制策略、版本修改记录和定制版。
- 多版本差异说明。
- JD A 可以前置会员活动、用户分层、复购召回和内容平台经验。
- JD B 可以前置创作者成长体系、内容供给治理、商家工具和产品协同。
- 商业化经验只能写成支持或协同，不写成广告收入负责人。

## 禁止输出

- 生成一份万能混合简历。
- 把 JD A 的 LTV 关键词硬塞进 JD B 版本。
- 把 JD B 的平台规则工具经验硬塞进 JD A 摘要。
- 改写复购率 12% 或商家覆盖 600 家。
- 把“支持商业化团队”写成“负责商业化收入”。

## 通过标准

两个版本共享同一事实底稿和事实编号，侧重点不同，但事实、数字和贡献边界一致。
```

- [ ] **Step 3: 验证**

Run:

```bash
rg -n "多个 JD|JD A|JD B|共用事实底稿|万能混合|600 家|12%" tests/regression/cases/03-multi-jd-tailoring.md tests/regression/expected/03-multi-jd-tailoring.md
```

Expected: 每个关键词都有匹配。

### Task 5: 公开实跑结果模板

**Files:**
- Create: `tests/regression/results/README.md`
- Create: `tests/regression/results/summary-template.md`

**Interfaces:**
- Consumes: Tasks 2-4 的 cases 和 expected。
- Produces: 子线程回归结果记录格式。

- [ ] **Step 1: 创建结果目录说明**

写入：

```markdown
# 回归结果

本目录保存公开可提交的虚拟样例实跑摘要。真实脱敏样例的结果如果包含任何个人材料，只能保存在 `tests/regression/local-private/`，不能提交。

文件命名：

- `01-general-diagnosis-result.md`
- `02-single-jd-tailoring-result.md`
- `03-multi-jd-tailoring-result.md`

每份结果必须说明执行日期、执行者、使用的 Skill 提交、通过状态、主要输出摘要、发现问题和建议后续动作。
```

- [ ] **Step 2: 创建结果模板**

写入：

```markdown
# 回归结果：样例名称

## 元信息

- 执行日期：
- 执行者：
- Skill 提交：
- Case：
- Expected：

## 通过状态

- 状态：通过 / 部分通过 / 失败
- 失败级别：无 / P0 / P1 / P2

## 输出摘要

- 任务识别：
- 事实底稿：
- 核心输出：
- 风险提示：
- 追问：

## 对照 expected

- 必须输出：
- 禁止输出：
- 通过标准：

## 问题记录

- 问题：
- 影响：
- 建议：
```

- [ ] **Step 3: 验证**

Run:

```bash
rg -n "真实脱敏样例|summary-template|通过 / 部分通过 / 失败|P0 / P1 / P2" tests/regression/results/README.md tests/regression/results/summary-template.md
```

Expected: 每个关键词都有匹配。

### Task 6: 独立子线程实跑三个虚拟样例

**Files:**
- Create: `tests/regression/results/01-general-diagnosis-result.md`
- Create: `tests/regression/results/02-single-jd-tailoring-result.md`
- Create: `tests/regression/results/03-multi-jd-tailoring-result.md`

**Interfaces:**
- Consumes: Tasks 2-5 的 cases、expected 和 result template。
- Produces: 三份独立实跑摘要。

- [ ] **Step 1: 分派 Case 01 子线程**

Prompt:

```text
你是简历 Skill 回归测试子线程。请在仓库 /Users/xxqq/Documents/Codex/2026-07-09/github-mnt-data-senior-resume-skill/work/senior-resume-skill-v2 中执行 tests/regression/cases/01-general-diagnosis.md。

必须先读取 SKILL.md、references/fact-ledger.md、references/diagnosis.md 和 tests/regression/expected/01-general-diagnosis.md。

请按 case 中的用户请求生成输出摘要，并对照 expected 自评“通过 / 部分通过 / 失败”。不要修改任何文件。最终用中文返回：任务识别、事实底稿摘要、核心输出摘要、风险提示、追问、对照 expected 的结论、发现问题。
```

- [ ] **Step 2: 分派 Case 02 子线程**

Prompt:

```text
你是简历 Skill 回归测试子线程。请在仓库 /Users/xxqq/Documents/Codex/2026-07-09/github-mnt-data-senior-resume-skill/work/senior-resume-skill-v2 中执行 tests/regression/cases/02-single-jd-tailoring.md。

必须先读取 SKILL.md、references/fact-ledger.md、references/jd-tailoring.md、references/roles/product-operations-growth.md 和 tests/regression/expected/02-single-jd-tailoring.md。

请按 case 中的用户请求生成输出摘要，并对照 expected 自评“通过 / 部分通过 / 失败”。不要修改任何文件。最终用中文返回：任务识别、事实底稿摘要、JD 核心要求、证据映射摘要、定制策略、定制版片段、风险提示、对照 expected 的结论、发现问题。
```

- [ ] **Step 3: 分派 Case 03 子线程**

Prompt:

```text
你是简历 Skill 回归测试子线程。请在仓库 /Users/xxqq/Documents/Codex/2026-07-09/github-mnt-data-senior-resume-skill/work/senior-resume-skill-v2 中执行 tests/regression/cases/03-multi-jd-tailoring.md。

必须先读取 SKILL.md、references/fact-ledger.md、references/jd-tailoring.md、references/roles/product-operations-growth.md 和 tests/regression/expected/03-multi-jd-tailoring.md。

请按 case 中的用户请求生成输出摘要，并对照 expected 自评“通过 / 部分通过 / 失败”。不要修改任何文件。最终用中文返回：任务识别、共用事实底稿摘要、JD A 和 JD B 的证据映射摘要、两个定制版片段、多版本差异、风险提示、对照 expected 的结论、发现问题。
```

- [ ] **Step 4: 主线程写入 Case 01 结果**

根据子线程返回内容写入 `tests/regression/results/01-general-diagnosis-result.md`。必须包含：

```markdown
# 回归结果：Case 01 通用诊断

## 元信息

- 执行日期：2026-08-29
- 执行者：独立子线程
- Skill 提交：当前 HEAD
- Case：`tests/regression/cases/01-general-diagnosis.md`
- Expected：`tests/regression/expected/01-general-diagnosis.md`

## 通过状态

- 状态：
- 失败级别：

## 输出摘要

## 对照 expected

## 问题记录
```

- [ ] **Step 5: 主线程写入 Case 02 结果**

按同一格式写入 `tests/regression/results/02-single-jd-tailoring-result.md`。

- [ ] **Step 6: 主线程写入 Case 03 结果**

按同一格式写入 `tests/regression/results/03-multi-jd-tailoring-result.md`。

- [ ] **Step 7: 验证结果文件**

Run:

```bash
rg -n "状态：|失败级别：|对照 expected|问题记录" tests/regression/results/*-result.md
```

Expected: 三份结果文件均有匹配。

### Task 7: 总验证、提交和推送

**Files:**
- Modify: `.gitignore`
- Create: `tests/regression/`

**Interfaces:**
- Consumes: Tasks 1-6 的全部文件。
- Produces: 三期回归夹具和结果记录已提交并推送。

- [ ] **Step 1: 检查私有目录不会被提交**

Run:

```bash
mkdir -p tests/regression/local-private
printf 'private sample\n' > tests/regression/local-private/README.private
git status --short --ignored tests/regression/local-private
rm tests/regression/local-private/README.private
```

Expected: 输出显示 `!! tests/regression/local-private/` 或无可提交文件；不得显示 `?? tests/regression/local-private/README.private`。

- [ ] **Step 2: 运行 Skill 和空白检查**

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

- [ ] **Step 3: 检查回归文件完整性**

Run:

```bash
test -f tests/regression/README.md
test -f tests/regression/cases/01-general-diagnosis.md
test -f tests/regression/cases/02-single-jd-tailoring.md
test -f tests/regression/cases/03-multi-jd-tailoring.md
test -f tests/regression/expected/01-general-diagnosis.md
test -f tests/regression/expected/02-single-jd-tailoring.md
test -f tests/regression/expected/03-multi-jd-tailoring.md
test -f tests/regression/results/01-general-diagnosis-result.md
test -f tests/regression/results/02-single-jd-tailoring-result.md
test -f tests/regression/results/03-multi-jd-tailoring-result.md
```

Expected: 所有命令退出码为 0。

- [ ] **Step 4: 检查真实材料路径没有进入暂存**

Run:

```bash
git add .gitignore tests/regression docs/superpowers/plans/2026-08-29-resume-skill-regression-plan.md
git diff --cached --name-only | rg "local-private|private-" 
```

Expected: 无匹配。

- [ ] **Step 5: 提交三期回归夹具**

Run:

```bash
git commit -m "Add resume skill regression fixtures"
```

Expected: 提交包含 `.gitignore`、`tests/regression/` 和三期计划文件。

- [ ] **Step 6: 推送并确认远端**

Run:

```bash
git push origin main
git status --short --branch
git ls-remote origin refs/heads/main
```

Expected: 推送成功，状态为 `## main...origin/main`，远端 main 指向最新提交。
