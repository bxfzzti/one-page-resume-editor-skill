import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import {
  FEEDBACK_CATEGORIES,
  FeedbackService,
} from "@/server/feedback/feedback-service";

const inputSchema = z.object({
  serviceRunId: z.string().uuid(),
  category: z.enum(FEEDBACK_CATEGORIES),
  helpful: z.boolean(),
  description: z.string().trim().min(2).max(500),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const input = inputSchema.parse(await request.json());
    const feedback = await new FeedbackService().submit({
      userId: user.id,
      ...input,
    });
    return NextResponse.json({ ok: true, feedback: { id: feedback.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FEEDBACK_FAILED";
    const status =
      message === "SERVICE_RUN_NOT_FOUND"
        ? 404
        : message === "SERVICE_RUN_NOT_FINISHED"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
