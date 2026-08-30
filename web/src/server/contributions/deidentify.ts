export const DEIDENTIFICATION_VERSION = "v1";

export type TrainingInput = {
  task: string;
  facts: Array<Record<string, unknown>>;
  requirements?: string[];
  evidenceMapping?: Array<Record<string, unknown>>;
  sentences: Array<Record<string, unknown>>;
  risks?: string[];
};

function redactText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/(?:\+?86[-\s]?)?1[3-9]\d{9}/g, "[PHONE]")
    .replace(/https?:\/\/\S+/gi, "[LINK]")
    .replace(/(?:身份证|证件号)[:：]?\s*[0-9Xx-]{15,18}/g, "$1：[ID]")
    .replace(/(?:住址|地址)[:：]?[^，。；;\n]{4,40}/g, "$1：[ADDRESS]");
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !["sourceFileId", "storageKey", "rawFile"].includes(key))
        .map(([key, child]) => [key, redactValue(child)]),
    );
  }
  return value;
}

export function deidentifyTrainingSample(input: TrainingInput) {
  return redactValue({
    deidentificationVersion: DEIDENTIFICATION_VERSION,
    task: input.task,
    facts: input.facts,
    requirements: input.requirements ?? [],
    evidenceMapping: input.evidenceMapping ?? [],
    sentences: input.sentences,
    risks: input.risks ?? [],
  }) as Record<string, unknown>;
}
