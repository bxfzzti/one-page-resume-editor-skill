---
name: one-page-resume-editor
description: Diagnose, score, compress, restructure, and JD-tailor Chinese resumes for 5+ year experienced candidates. Use when a candidate needs resume problem detection, prioritized revision advice, a one-page master resume, role-fit analysis, evidence mapping, or controlled 10–15% JD customization. Especially useful for senior and mid-senior internet, platform, growth, operations, commercialization, e-commerce, B/C collaboration, and cross-functional roles.
---

# 一页纸简历修改器

## Mission

Help 5+ year experienced candidates turn complex career histories into concise, truthful, defensible, role-aligned one-page resumes.

This is a Skill for Codex, Claude Code, and other agents. It provides resume diagnosis, revision rules, workflows, and examples. It is not a standalone agent.

The skill supports four modes:

1. **DIAGNOSE** — score and audit before rewriting.
2. **MASTER** — create a one-page master resume.
3. **TAILOR** — customize only 10–15% against a target JD.
4. **REVIEW** — audit an existing draft for overclaims, weak evidence, jargon, chronology, and weighting.

Default behavior:

- If the user gives only a resume: run DIAGNOSE first, then recommend whether rewriting is needed.
- If the user explicitly asks for a final rewrite: diagnose internally, then produce the requested artifact.
- If the user gives resume + JD: run DIAGNOSE + JD evidence mapping before TAILOR.
- Never invent missing evidence.

## Inputs

Use as many as available:

- full resume;
- name, years of experience, education;
- phone, email, base city;
- employment dates, companies, titles;
- team size;
- responsibilities;
- measurable results;
- DAU/MAU/GMV/orders/users;
- conversion, retention, repeat purchase, CTR, ROI;
- cost reduction;
- scope of ownership;
- collaboration parties;
- target JD.

## Truthfulness constraints

Never:

- turn collaboration with a category/industry team into industry ownership;
- turn participation into ownership;
- attribute platform-wide results entirely to the candidate without evidence;
- infer domain expertise from brand exposure;
- fabricate metrics;
- upgrade responsibility verbs to sound senior;
- hide short stints by misclassifying chronology;
- insert JD keywords unsupported by candidate evidence.

Responsibility strength:

1. 主导 / led
2. 负责 / owned
3. 牵头 / spearheaded
4. 推动 / drove
5. 联动 / partnered
6. 协同 / collaborated
7. 参与 / participated

Use the strongest verb that is still fully defensible.

---

# Mode 1 — DIAGNOSE

## Goal

Before rewriting, determine whether the resume's main problem is:

- positioning;
- evidence;
- structure;
- information density;
- chronology;
- role alignment;
- overclaim risk;
- jargon;
- weak metrics;
- incorrect experience weighting.

## Scoring rubric

Score each dimension from 0–10.

### 1. Positioning clarity — 15%

Can a recruiter understand within ~20 seconds:

- candidate level;
- functional identity;
- strongest capability;
- likely target roles?

### 2. Evidence strength — 20%

Assess:

- real metrics;
- scale;
- before/after;
- business outcomes;
- efficiency outcomes;
- mechanism-result linkage.

### 3. Seniority signal — 15%

Assess:

- scope;
- complexity;
- ownership;
- team leadership;
- cross-functional influence;
- 0→1 system building.

### 4. Career throughline — 15%

Assess whether experiences form a coherent transferable narrative rather than unrelated jobs.

### 5. Information density — 10%

Assess:

- repeated responsibilities;
- unnecessary line breaks;
- low-value detail;
- project流水账;
- space allocation.

### 6. JD readiness / market relevance — 10%

Without a JD, score general market readability and role legibility.
With a JD, score evidence alignment to top requirements.

### 7. Truthfulness & defensibility — 10%

Assess:

- ownership inflation;
- industry-experience inflation;
- unclear metric attribution;
- unverifiable superlatives;
- risky wording.

### 8. External readability — 5%

Assess:

- internal jargon;
- unexplained acronyms;
- recruiter comprehension.

## Weighted score

Calculate:

```text
Total =
Positioning × 0.15 +
Evidence × 0.20 +
Seniority × 0.15 +
Throughline × 0.15 +
Density × 0.10 +
JD Readiness × 0.10 +
Defensibility × 0.10 +
Readability × 0.05
```

Convert to /100 by multiplying by 10.

## Score interpretation

- 90–100: strong; tailor lightly.
- 80–89: competitive; targeted optimization.
- 70–79: usable but positioning/weighting issues.
- 60–69: rewrite recommended.
- below 60: structural rebuild recommended.

## Diagnostic output

Return:

### A. Overall score
`XX/100`

### B. Dimension table
Include score, weight, short diagnosis.

### C. Career throughline
One sentence.

### D. Top 3 strengths
Evidence-backed only.

### E. Top 3 problems
Rank by impact.

### F. Experience tiering
- Tier 1 expand
- Tier 2 compress
- Tier 3 early experience

### G. Overclaim / penetration risks
Quote or paraphrase risky claims and explain why.

### H. Recommended action
Choose one:
- keep and lightly edit;
- compress;
- restructure;
- rebuild;
- tailor to JD.

Do not rewrite the full resume unless requested or required by the selected workflow.

---

# Mode 2 — MASTER

## Goal

Create a one-page or compact master resume.

## Step 0: Determine experience structure type

Before compressing or rewriting, classify the resume structure.

### Type A — Multi-company resume

Use when the candidate has 2 or more substantial company experiences.

Default flow:

- keep company chronology visible;
- use each company as the primary container;
- reduce each company to no more than 3 modules;
- apply the normal tiering and compression rules below.

### Type B — Single-company long-tenure resume

Use when the candidate has worked at the same company for 3+ years, especially when multiple projects, rotations, business lines, or role changes are all under one employer.

Branch flow:

1. Divide content by **capability dimension**, not by company paragraph.
   Do not force all work into one company block. Use capability modules such as:
   - 用户增长;
   - 流量效率;
   - 系统化建设;
   - 需求管理;
   - 商业化转化;
   - B/C协同;
   - 产品运营;
   - 团队协作与项目推进.

2. Keep each capability dimension to **3–4 lines max**.
   Do not merge unrelated dimensions just because they happened at the same company.

3. Compress only repeated descriptions **within the same capability dimension**.
   Do not cut across dimensions to save space. Cross-dimension deletion can erase real experience and make the candidate look narrower than they are.

4. Preserve the employer and tenure once in the header or experience heading, then use capability modules underneath.

Recommended format:

```text
### 2020.03—至今｜某平台｜运营/增长方向

**用户增长：** ...
**流量效率：** ...
**系统化建设：** ...
**需求管理：** ...
```

5. After compression, add an information preservation checklist.

Checklist:

- [ ] Does every project or experience in the source resume have a corresponding item in the compressed version?
- [ ] If not, mark it as "deleted" and explain why.
- [ ] Were deletions made only because the item was duplicated, low-value, unsupported, outdated, or irrelevant to the target role?
- [ ] Did the rewrite preserve distinct capability dimensions instead of flattening them into one generic responsibility?

## Step 1: Determine career throughline

Ask internally:

> Across the candidate's 5+ years of experience, what recurring class of problems have they solved?

Common throughlines:

- user growth;
- platform operations;
- commercialization;
- supply-demand coordination;
- membership growth;
- private-domain growth;
- merchant growth;
- B/C collaboration;
- traffic allocation and conversion.

Do not force a multi-industry-expert narrative when transferable capability is more accurate.

## Step 2: Tier experiences

For Type A multi-company resumes, tier by company and role relevance.
For Type B single-company long-tenure resumes, tier by capability dimension and project evidence instead of company count.

### Tier 1 — expand

Use when several are true:

- highly relevant;
- strong brand;
- hard results;
- senior scope;
- represents capability ceiling.

Usually 2 modules.

### Tier 2 — retain but compress

Use when short but strategically valuable:

- chronology;
- brand;
- transition;
- capability bridge.

Usually 1 paragraph.

### Tier 3 — early experience

Older and less relevant.

Usually 1 line.

## Step 3: Compact header

Preferred:

```text
# 姓名｜10年+互联网运营经验｜统招本科
手机｜邮箱｜常驻城市

**平台经验：** ...
**增长能力：** ...
**协同能力：** ...
```

Do not use a large standalone "个人优势" section unless space is abundant.

## Step 4: Rewrite each experience

Pattern:

```text
**模块名：** 职责范围 + 核心动作 + 关键机制 + 结果。
```

For Type A resumes, usually use 1–2 modules per company and never more than 3 modules per company.

For Type B resumes, use 3–5 capability modules under the single long-tenure company, with each module capped at 3–4 lines. Keep modules distinct when they represent different capability dimensions.

## Step 5: B/C collaboration

Clarify:

- C-side demand;
- B-side supply;
- mechanism;
- transaction/retention outcome.

Template:

```text
**B/C协同增长：** 负责[业务]的B/C协同增长，推动[用户资产]向[交易/服务用户]转化；C端围绕[需求]设计[转化/权益/复购机制]，B端联动[商家/门店/服务商]推动[供给]建设，形成“需求—供给—交易—复购”闭环。
```

## Step 6: Short stints

Do not automatically delete a 6-month stint.

Check:

1. timeline gap?
2. career bridge?
3. brand signal?
4. explains next role?

If mostly yes: retain in main chronology, compress to one paragraph.

Never move a recent short stint into "early experience".

## Step 7: Internships for 5+ year candidates

Default: do not expand.

Retain only for strong brand, unusual outcome, chronology, or relevance.
If retained: one line.

## Step 8: Result priority

1. business outcome;
2. efficiency outcome;
3. user outcome;
4. mechanism built;
5. activity performed.

When metrics are unavailable, use truthful outcomes:

- 跑通路径
- 完成闭环验证
- 建立机制
- 沉淀可复制模式
- 支撑规模化放量

## Step 9: Translate jargon

Ask:

> Can an external recruiter understand this in three seconds?

Translate or explain internal terms. Never guess the meaning of ambiguous jargon.

## Step 10: Compress vertically

Order:

1. remove unnecessary line breaks;
2. delete repeated responsibilities;
3. reduce each company to 1–2 modules;
4. compress short strategic experiences;
5. compress early experiences;
6. remove low-value internship detail;
7. replace large advantages section with 3 summary lines;
8. only then adjust font and margins.

For Type B single-company long-tenure resumes:

1. first group raw projects by capability dimension;
2. remove repetition only inside each capability dimension;
3. cap each dimension at 3–4 lines;
4. keep enough distinct dimensions to show breadth and seniority;
5. add the information preservation checklist before finalizing.

---

# Mode 3 — TAILOR

## Goal

Customize a master resume against a target JD without rewriting the candidate into a different person.

Default modification budget: **10–15% of the master resume**.

This is a controlled adaptation, not a total rewrite.

## Step 1: Parse the JD

Extract:

### A. Top 3 capability requirements
Rank by:
- repetition;
- placement;
- business criticality;
- seniority signal.

### B. Supporting requirements
Examples:
- analytics;
- English;
- international exposure;
- travel;
- team leadership.

### C. Domain context
Examples:
- e-commerce;
- local services;
- mobility;
- fintech;
- SaaS.

Do not treat preferred qualifications as mandatory unless the JD does.

## Step 2: Build evidence map

Create a table:

| JD requirement | Candidate evidence | Strength | Gap/Risk |
|---|---|---:|---|
| Requirement 1 | Exact resume evidence | Strong/Medium/Weak | Notes |

Evidence strength:

- **Strong:** direct ownership + result.
- **Medium:** adjacent ownership or strong collaboration.
- **Weak:** exposure only.
- **None:** no evidence.

## Step 3: Calculate fit score

Score 0–100 using:

- Top 3 capability requirements: 60 points total
- Supporting requirements: 20 points
- Seniority/scope fit: 10 points
- Domain/context transferability: 10 points

Rules:

- Strong evidence: 100% of allocated points
- Medium: 65%
- Weak: 30%
- None: 0%

Apply a risk note, not a hidden penalty, for:
- language requirement uncertainty;
- relocation/travel uncertainty;
- missing international background;
- unclear people management.

## Step 4: Decide tailoring actions

Allowed:

- reorder summary lines;
- reorder modules within a company;
- foreground relevant evidence;
- replace generic wording with JD-aligned wording when supported;
- compress irrelevant modules;
- add missing but already evidenced keywords;
- adjust role headline if truthful.

Not allowed:

- invent experience;
- claim industry ownership from collaboration;
- add tools, languages, markets, or leadership not evidenced;
- rewrite 50%+ just to mimic JD.

## Step 5: Keep a change budget

Target:

- 0–5%: near-perfect fit
- 10–15%: normal tailoring
- 15–25%: only when career evidence is strong but framing differs
- above 25%: warn that fit may be weak or master resume positioning is wrong

## Step 6: Tailored output

Return:

### A. Fit score
`XX/100`

### B. Top 3 JD requirements
Brief.

### C. Evidence map
Concise table.

### D. Gaps and risks
No sugarcoating.

### E. Tailoring strategy
What will change and why.

### F. Final tailored resume
Only if requested.

### G. Change log
List major changes, especially if wording strength changed.

---

# Mode 4 — REVIEW

Audit an existing resume for:

- positioning;
- strongest evidence;
- weak/redundant content;
- chronology;
- overclaim risk;
- jargon;
- incorrect weighting;
- missing contact information;
- unsupported JD keywords.

Return prioritized fixes.

---

# Interview penetration test

For every major statement:

- What exactly did you own?
- How was the metric calculated?
- What was your personal contribution?
- What did collaborators own?
- Why is this "industry experience"?
- What mechanism caused the result?
- Can the candidate explain baseline, timeframe, and denominator?

If not defensible, downgrade or rewrite.

---

# Final checklist

- [ ] Positioning clear in ~20 seconds.
- [ ] Reachable contact information included.
- [ ] Summary about 3 lines.
- [ ] Recent high-value experience has highest weight.
- [ ] Each company usually has 1–2 modules.
- [ ] Short recent stints not mislabeled as early experience.
- [ ] Internships not over-expanded for a 5+ year candidate.
- [ ] Real metrics used where available.
- [ ] Collaboration not mislabeled as industry ownership.
- [ ] Participation not mislabeled as ownership.
- [ ] No fabricated metrics.
- [ ] Jargon externally understandable.
- [ ] Unnecessary line breaks removed.
- [ ] Claims survive follow-up.
- [ ] Metric definitions explainable.
- [ ] Career throughline aligns with target role.
- [ ] JD tailoring stays within controlled change budget unless warned.

## Success criterion

A recruiter should conclude:

> This candidate has handled sufficiently complex work.

> This candidate has produced verifiable outcomes.

> This candidate's capabilities can transfer to the role being hired.
