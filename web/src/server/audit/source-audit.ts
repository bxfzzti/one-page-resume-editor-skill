export type AuditFact = {
  id: string;
  text: string;
  status:
    | "confirmed"
    | "pending_confirmation"
    | "missing_from_source"
    | "not_recommended";
  boundary?: string;
  bodyEligible: boolean;
};

export type GeneratedSentence = {
  text: string;
  factIds: string[];
};

export type AuditIssue = {
  code:
    | "MISSING_FACT_REFERENCE"
    | "UNKNOWN_FACT_REFERENCE"
    | "PENDING_FACT_IN_BODY"
    | "CONTRIBUTION_UPGRADE"
    | "UNSUPPORTED_INFERENCE";
  sentenceIndex: number;
  message: string;
};

export type AuditResult = {
  ok: boolean;
  issues: AuditIssue[];
};

const contributionStrength: Record<string, number> = {
  参与: 1,
  协同: 1,
  支持: 1,
  推动: 2,
  牵头: 3,
  负责: 4,
  主导: 5,
};

const inferenceTerms = [
  "具备",
  "积累",
  "支撑",
  "促进",
  "保障",
  "实现",
  "提供依据",
  "推动落地",
  "提升效率",
  "提高一致性",
  "机制建设",
];

function hasContributionUpgrade(sentence: string, factTexts: string[]): boolean {
  const sourceStrength = Math.max(
    0,
    ...factTexts.flatMap((text) =>
      Object.entries(contributionStrength)
        .filter(([verb]) => text.includes(verb))
        .map(([, strength]) => strength),
    ),
  );
  const generatedStrength = Math.max(
    0,
    ...Object.entries(contributionStrength)
      .filter(([verb]) => sentence.includes(verb))
      .map(([, strength]) => strength),
  );
  return generatedStrength > sourceStrength;
}

export function auditGeneratedSentences(input: {
  facts: AuditFact[];
  sentences: GeneratedSentence[];
}): AuditResult {
  const factsById = new Map(input.facts.map((fact) => [fact.id, fact]));
  const issues: AuditIssue[] = [];

  input.sentences.forEach((sentence, sentenceIndex) => {
    if (sentence.factIds.length === 0) {
      issues.push({
        code: "MISSING_FACT_REFERENCE",
        sentenceIndex,
        message: "正文句子没有来源事实编号。",
      });
      return;
    }

    const facts = sentence.factIds
      .map((factId) => factsById.get(factId))
      .filter((fact): fact is AuditFact => Boolean(fact));
    for (const factId of sentence.factIds) {
      if (!factsById.has(factId)) {
        issues.push({
          code: "UNKNOWN_FACT_REFERENCE",
          sentenceIndex,
          message: `来源事实 ${factId} 不存在。`,
        });
      }
    }
    if (
      facts.some(
        (fact) => fact.status !== "confirmed" || !fact.bodyEligible,
      )
    ) {
      issues.push({
        code: "PENDING_FACT_IN_BODY",
        sentenceIndex,
        message: "待确认、缺失或不建议使用的事实不能进入正文。",
      });
    }

    const factTexts = facts.map((fact) => fact.text);
    if (hasContributionUpgrade(sentence.text, factTexts)) {
      issues.push({
        code: "CONTRIBUTION_UPGRADE",
        sentenceIndex,
        message: "正文贡献动词强于来源事实。",
      });
    }
    for (const term of inferenceTerms) {
      if (sentence.text.includes(term) && !factTexts.some((text) => text.includes(term))) {
        issues.push({
          code: "UNSUPPORTED_INFERENCE",
          sentenceIndex,
          message: `正文包含来源未证明的表达：${term}。`,
        });
      }
    }
  });

  return { ok: issues.length === 0, issues };
}
