import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";
import { ServiceRunner } from "@/server/runs/service-runner";

const inputSchema = z.object({
  resumeProjectId: z.string().uuid(),
  serviceKind: z.enum([
    "diagnosis",
    "one_page",
    "jd_tailoring",
    "multi_jd",
    "interview_review",
    "deep_follow_up",
  ]),
  inputSnapshot: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(16).max(128),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const input = inputSchema.parse(await request.json());
    const run = await new ServiceRunner(db, new PointLedgerService(db)).create({
      ...input,
      userId: user.id,
    });
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERVICE_RUN_CREATE_FAILED";
    const status = message === "INSUFFICIENT_POINTS" ? 402 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
