import { z } from "zod";

export const factOutputSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum([
    "confirmed",
    "pending_confirmation",
    "missing_from_source",
    "not_recommended",
  ]),
  boundary: z.string().optional(),
  bodyEligible: z.boolean(),
});

export const sentenceOutputSchema = z.object({
  text: z.string(),
  factIds: z.array(z.string()),
});

export const commonOutputSchema = z.object({
  task: z.string(),
  completeness: z.string(),
  summary: z.string(),
  facts: z.array(factOutputSchema),
  risks: z.array(z.string()),
  questions: z.array(z.string()).max(6),
  sentences: z.array(sentenceOutputSchema),
});

export const jdOutputSchema = commonOutputSchema.extend({
  requirements: z.array(z.string()),
  evidenceMapping: z.array(
    z.object({
      requirement: z.string(),
      level: z.enum(["强", "中", "弱", "相邻", "无证据", "暂无法判断"]),
      factIds: z.array(z.string()),
      gap: z.string(),
    }),
  ),
  strategy: z.string(),
  modificationRecord: z.array(z.string()),
});

export type CommonOutput = z.infer<typeof commonOutputSchema>;
export type JdOutput = z.infer<typeof jdOutputSchema>;
