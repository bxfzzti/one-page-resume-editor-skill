# 简历 Skill 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有长篇简历规则重构为中文任务入口、按需参考文件和可验证的中高阶简历工作流。

**Architecture:** `SKILL.md` 只保留触发范围、四类任务路由、事实真实性总规则和参考文件路由；详细规则拆到 `references/`，岗位深度拆到 `references/roles/`，示例和测试场景继续放在 `examples/` 与 `tests/`。排版只作为按需阶段说明，不作为默认流程。

**Tech Stack:** Markdown、YAML frontmatter、Shell 验证脚本、Git。

## Global Constraints

- 所有面向用户的表达使用中文；机器标识和文件名可使用英文。
- 默认适用 5 年以上中高阶求职者，第一版重点支持产品、运营和增长。
- 默认先交付内容；只有用户明确要求时才进入 Word/PDF 阶段。
- 不修改用户数字、专有名词、内部黑话和事实含义，不编造缺失信息。
- 删除记录与原文缺失清单必须分开。
- 没有 JD 时不得输出岗位匹配结论。
- 现有示例内容必须保留并适配新的任务命名。

### Task 1: 重写中文入口与总规则

**Files:**
- Modify: `SKILL.md`
- Modify: `README.md`

**Interfaces:**
- 输入：用户自然语言请求、简历、可选 JD 和补充事实。
- 输出：四类任务路由、事实底稿规则、参考文件读取指令和阶段性输出边界。

- [ ] **Step 1: 保留现有事实规则并整理为总入口**
  - 删除英文模式名称和重复的详细流程。
  - 加入四类中文任务名称及自动路由规则。
  - 明确输入状态：只有简历、只有 JD、简历加 JD、多个 JD、信息不足和造假请求。
  - 明确事实状态、追问上限、隐私提醒、无 JD 不做匹配和排版按需执行。

- [ ] **Step 2: 更新 README 使用方式**
  - 把定位改为“中文简历整理与岗位定制 Skill”。
  - 用四类用户任务替代技术模式介绍。
  - 添加推荐使用流程、适用岗位层级和第一版边界。

- [ ] **Step 3: 运行静态检查**
  - Run: `rg -n "MASTER|TAILOR|REVIEW|DIAGNOSE|基础简历|主简历" SKILL.md README.md`
  - Expected: 用户可见正文中没有英文模式名、歧义的“基础简历”或“主简历”表述。

### Task 2: 拆分按需加载的参考文件

**Files:**
- Create: `references/fact-ledger.md`
- Create: `references/diagnosis.md`
- Create: `references/one-page-resume.md`
- Create: `references/jd-tailoring.md`
- Create: `references/interview-and-review.md`
- Create: `references/document-output.md`
- Create: `references/roles/product-operations-growth.md`

**Interfaces:**
- 输入：`SKILL.md` 路由后的任务和用户材料。
- 输出：对应任务的可执行规则、输出结构、停止条件和质量检查。

- [ ] **Step 1: 抽取事实底稿规则**
  - 定义事实状态、来源、贡献边界、数据口径、黑话处理、删除记录和缺失清单。
  - 明确年限验算不能静默覆盖原文年限。

- [ ] **Step 2: 抽取四类任务规则**
  - 分别写入诊断、一页纸整理、JD 定制、面试审查。
  - 每个文件只包含对应任务的输入、流程、输出、风险和检查清单。

- [ ] **Step 3: 增加按需排版与岗位参考**
  - 排版文件说明内容阶段与文件阶段的边界，以及一页/两页判断。
  - 岗位文件只写产品、运营、增长的深度规则，不把规则冒充成其他岗位专业知识。

- [ ] **Step 4: 检查引用完整性**
  - Run: `rg -n "references/" SKILL.md`
  - Expected: 每个参考文件都有明确读取时机，且入口没有引用不存在的路径。

### Task 3: 增加场景测试与示例覆盖

**Files:**
- Create: `tests/scenarios.md`
- Modify: `examples/04-先评分诊断再决定怎么改.md`
- Modify: `examples/05-JD证据映射与受控定制.md`

**Interfaces:**
- 输入：场景、用户材料和期望的阶段行为。
- 输出：可供人工或独立模型回归检查的行为断言。

- [ ] **Step 1: 编写覆盖矩阵**
  - 覆盖只有简历、只有 JD、信息不足、完整材料、多 JD、长期任职、跳槽、转行、无数据、黑话、夸大和排版请求。
  - 每个场景写明允许输出、禁止输出和必须标记的风险。

- [ ] **Step 2: 更新示例中的中文入口**
  - 删除旧的英文模式调用。
  - 增加“事实底稿、待确认问题、删除与缺失分离”的展示。

- [ ] **Step 3: 运行文档验证**
  - Run: `python3 /Users/xxqq/.codex/skills/.system/skill-creator/scripts/quick_validate.py .`
  - Expected: frontmatter、技能命名和文档结构验证通过；若脚本路径不可用，改用 `rg` 完成同等检查并记录原因。

### Task 4: 同步安装副本并完成发布前验证

**Files:**
- Modify: `/Users/xxqq/.agents/skills/one-page-resume-editor/SKILL.md`
- Modify: `/Users/xxqq/.agents/skills/one-page-resume-editor/README.md`
- Create: `/Users/xxqq/.agents/skills/one-page-resume-editor/references/`

**Interfaces:**
- 输入：仓库中已验证的 Skill 文件。
- 输出：本机安装副本与仓库内容一致，GitHub 发布前状态可复现。

- [ ] **Step 1: 同步已验证文件**
  - 只同步本 Skill 的文档和参考文件，不修改其他技能。

- [ ] **Step 2: 比较仓库与安装副本**
  - Run: `diff -qr . /Users/xxqq/.agents/skills/one-page-resume-editor --exclude=.git`
  - Expected: 无差异。

- [ ] **Step 3: 检查 Git 状态并提交**
  - Run: `git diff --check && git status --short`
  - Expected: 无空白错误；只包含本次重构文件。
  - Commit: `git commit -m "Refactor resume skill around Chinese task workflows"`

- [ ] **Step 4: 推送并验证远端**
  - Run: `git push origin main`
  - Expected: `main` 推送成功；远端仓库可访问，默认分支为 `main`。
