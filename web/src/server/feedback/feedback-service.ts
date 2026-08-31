import { and, eq } from "drizzle-orm";
import { db, type ResumeDb } from "@/db/client";
import { feedbackSubmissions, serviceRuns } from "@/db/schema";

export const FEEDBACK_CATEGORIES = [
  "result_quality",
  "fact_error",
  "usability",
  "technical_error",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

type FeedbackInput = {
  userId: string;
  serviceRunId: string;
  category: FeedbackCategory;
  helpful: boolean;
  description: string;
};

const PHONE = /(?<!\d)1[3-9]\d{9}(?!\d)/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export class FeedbackService {
  constructor(private readonly database: ResumeDb = db) {}

  async submit(input: FeedbackInput) {
    const description = input.description.trim();
    if (description.length < 2 || description.length > 500) {
      throw new Error("INVALID_FEEDBACK_DESCRIPTION");
    }
    if (PHONE.test(description) || EMAIL.test(description)) {
      throw new Error("CONTACT_INFORMATION_NOT_ALLOWED");
    }

    const [run] = await this.database
      .select({
        id: serviceRuns.id,
        serviceKind: serviceRuns.serviceKind,
        state: serviceRuns.state,
        errorCode: serviceRuns.errorCode,
      })
      .from(serviceRuns)
      .where(
        and(
          eq(serviceRuns.id, input.serviceRunId),
          eq(serviceRuns.userId, input.userId),
        ),
      )
      .limit(1);
    if (!run) throw new Error("SERVICE_RUN_NOT_FOUND");
    if (run.state !== "succeeded" && run.state !== "failed") {
      throw new Error("SERVICE_RUN_NOT_FINISHED");
    }

    const [feedback] = await this.database
      .insert(feedbackSubmissions)
      .values({
        serviceRunId: run.id,
        serviceKind: run.serviceKind,
        runState: run.state,
        errorCode: run.errorCode,
        category: input.category,
        helpful: input.helpful,
        description,
      })
      .onConflictDoUpdate({
        target: feedbackSubmissions.serviceRunId,
        set: {
          serviceKind: run.serviceKind,
          runState: run.state,
          errorCode: run.errorCode,
          category: input.category,
          helpful: input.helpful,
          description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return feedback;
  }
}
