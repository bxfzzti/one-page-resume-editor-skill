# 简历正文句子级来源门禁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复真实样例回归发现的无来源结果扩写和贡献动词升级，确保 JD 定制正文逐句可追溯。

**Architecture:** 在通用事实底稿中定义句子级来源门禁，在 JD 定制流程中增加交付前逐句审计；用原 Case 02 和 Case 03 的 expected 固化失败表达，并通过新独立子线程复测。保持 Markdown 人工回归，不新增脚本。

**Tech Stack:** Markdown、Codex 独立子线程、Git、Skill quick validator。

## Global Constraints

- 所有用户可见内容使用中文。
- 只修改 `references/fact-ledger.md`、`references/jd-tailoring.md`、Case 02/03 expected 和回归结果。
- 不修改任务路由，不扩展岗位规则，不新增自动评分器或生成脚本。
- 任何无来源结果、贡献升级或待确认内容进入最终正文均判为 P0。
- 子线程只执行样例和回报结果，不修改仓库文件。

---

### Task 1: 固化 P0 回归标准

**Files:**
- Modify: `tests/regression/expected/02-single-jd-tailoring.md`
- Modify: `tests/regression/expected/03-multi-jd-tailoring.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-08-29-resume-skill-source-gate-design.md`
- Produces: 可复测的新增禁止行为。

- [x] **Step 1: 更新 Case 02 禁止输出**

加入：

```markdown
- 从“活动 SOP 支持 12 个城市复用”推导“提升跨城市活动执行的一致性和复用效率”等原文未证明的结果。
```

- [x] **Step 2: 更新 Case 03 禁止输出**

加入：

```markdown
- 把“协同产品团队上线”改成“推动平台工具与运营机制落地”等更高贡献强度表达。
```

- [x] **Step 3: 验证新增标准可检索**

Run:

```bash
rg -n "一致性和复用效率|推动平台工具与运营机制落地" tests/regression/expected
```

Expected: Case 02 和 Case 03 各有一条匹配。

### Task 2: 实现句子级来源门禁

**Files:**
- Modify: `references/fact-ledger.md`
- Modify: `references/jd-tailoring.md`

**Interfaces:**
- Consumes: 当前事实状态、贡献边界和 JD 定制流程。
- Produces: 候选正文来源核对规则和交付前逐句审计。

- [x] **Step 1: 在事实底稿增加候选正文来源门禁**

加入：

```markdown
## 候选正文来源门禁

生成简历正文前，为每条候选句标注对应事实编号，并分别核对动作、对象、贡献动词和结果。只有原文明确支持或用户明确确认的内容可以进入正文。

- 不把常识、目的或可能收益写成已经发生的结果。原文没有证明时，“提升效率”“提高一致性”“提供数据依据”“推动机制落地”等表达必须删除或移入待确认。
- 贡献动词只能保持原强度或降级。“参与、协同、支持”不得改成“推动、牵头、负责、主导”。同一句包含多个动作时，每个动作分别核对。
- 待确认内容可以进入事实底稿、证据映射、追问和风险清单，不能因为在括号中注明“待确认”就进入最终简历正文。
- 无法指出来源事实编号的句子不得进入正文。
```

再加入正文改写白名单：只允许保留、删减、重排、无新增因果的合并和语法补全；禁止新增目的、收益、能力结论、经验结论、场景、机制、方法论或因果关系。明确原文结果事实与数据口径风险分开处理，口径说明放在正文之外。

- [x] **Step 2: 在 JD 定制增加交付前审计**

在流程生成定制版后增加：

```markdown
## 正文交付前审计

定制版生成后逐句核对：来源事实编号；动作和对象；贡献动词；数字和结果；待确认项去向。正文只能使用事实底稿定义的改写白名单。任一项无法通过时，从正文删除或移入追问、风险清单，不交付为最终简历句子。数据口径说明放在正文之外的风险或追问中。
```

并把流程最后一步改为先完成审计，再输出匹配结论、缺口、修改记录和面试追问。

- [x] **Step 3: 验证规则存在且入口可路由**

Run:

```bash
rg -n "候选正文来源门禁|贡献动词只能|无法指出来源事实编号|正文交付前审计|逐句核对" references/fact-ledger.md references/jd-tailoring.md
rg -n "references/fact-ledger.md|references/jd-tailoring.md" SKILL.md
```

Expected: 新规则均有匹配，`SKILL.md` 仍能路由到两个参考文件。

### Task 3: 独立复测并记录最终判断

**Files:**
- Create: `tests/regression/results/01-general-diagnosis-result.md`
- Create: `tests/regression/results/02-single-jd-tailoring-result.md`
- Create: `tests/regression/results/03-multi-jd-tailoring-result.md`

**Interfaces:**
- Consumes: 三个 cases、expected 和修复后的参考文件。
- Produces: 主线程复核后的公开回归结果。

- [x] **Step 1: 保留 Case 01 首轮通过结果**

记录任务路由、事实底稿、诊断维度、风险和最多 6 个追问均符合 expected，状态为“通过”，失败级别为“无”。

- [x] **Step 2: 用新独立子线程复测 Case 02**

要求子线程逐句给出事实编号，不得新增效率、一致性或其他无来源结果；不得修改文件。

- [x] **Step 3: 用新独立子线程复测 Case 03**

要求子线程逐句给出事实编号，两个版本共享事实编号，贡献动词不得升级；不得修改文件。

- [x] **Step 4: 主线程复核并写入三份结果**

每份结果包含：执行日期、执行者、Skill 提交、通过状态、失败级别、输出摘要、expected 对照、问题记录。Case 02/03 同时记录首轮 P0 和修复后复测结论。

- [x] **Step 5: 验证结果完整**

Run:

```bash
rg -n "状态：|失败级别：|对照 expected|问题记录|首轮" tests/regression/results/*-result.md
```

Expected: 三份结果均包含状态和复核记录，Case 02/03 包含首轮问题。

### Task 4: 同步、验证、提交和推送

**Files:**
- Modify: `.gitignore`
- Modify: `references/fact-ledger.md`
- Modify: `references/jd-tailoring.md`
- Create: `tests/regression/`

**Interfaces:**
- Consumes: Tasks 1-3 的全部产物。
- Produces: 仓库与安装副本一致、远端 main 已更新。

- [x] **Step 1: 运行仓库验证**

Run:

```bash
python3 /Users/xxqq/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
git diff --check
git check-ignore -v tests/regression/local-private/README.private tests/regression/results/private-sample.md
```

Expected: `Skill is valid!`，无空白错误，两条私有路径均匹配 `.gitignore`。

- [x] **Step 2: 同步安装副本**

将仓库中除 `.git/` 和 `docs/` 之外的内容同步到 `/Users/xxqq/.agents/skills/one-page-resume-editor`，保留安装副本与仓库的一致结构。

- [x] **Step 3: 验证安装副本一致**

Run:

```bash
diff -qr . /Users/xxqq/.agents/skills/one-page-resume-editor --exclude=.git --exclude=docs
```

Expected: 无输出。

- [x] **Step 4: 提交实现**

Run:

```bash
git add .gitignore references/fact-ledger.md references/jd-tailoring.md tests/regression docs/superpowers/plans/2026-08-30-resume-skill-source-gate-plan.md
git diff --cached --name-only | rg "local-private|private-"
git commit -m "Add resume skill regression source gate"
```

Expected: 私有路径检查无匹配，提交成功。

- [x] **Step 5: 推送并确认远端**

Run:

```bash
git push origin main
git status --short --branch
git ls-remote origin refs/heads/main
```

Expected: 状态为 `## main...origin/main`，远端 main 指向最新提交。
