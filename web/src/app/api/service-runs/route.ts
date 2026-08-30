import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { serviceRuns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PUBLIC_PREVIEW_SERVICE_KINDS } from "@/lib/service-catalog";
import {
  consumeGuestQuota,
  releaseGuestQuota,
} from "@/server/auth/guest";
import { getCurrentUser } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";
import { ServiceRunner } from "@/server/runs/service-runner";
import { processServiceRun } from "@/worker/process-service-run";
import { isAnonymousPreviewEnabled } from "@/server/config/mode";

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
    const runner = new ServiceRunner(db, new PointLedgerService(db));
    const [existing] = await db
      .select()
      .from(serviceRuns)
      .where(eq(serviceRuns.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) {
      if (existing.userId !== user.id) {
        return NextResponse.json(
          { ok: false, error: "IDEMPOTENCY_KEY_CONFLICT" },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: true, run: existing });
    }
    if (user.isAnonymous && !PUBLIC_PREVIEW_SERVICE_KINDS.includes(input.serviceKind as (typeof PUBLIC_PREVIEW_SERVICE_KINDS)[number])) {
      return NextResponse.json({ ok: false, error: "GUEST_SERVICE_NOT_AVAILABLE" }, { status: 403 });
    }
    const quota = user.isAnonymous ? await consumeGuestQuota(user.id, request, db) : null;
    try {
      const run = await runner.create({ ...input, userId: user.id });
      if (user.isAnonymous && isAnonymousPreviewEnabled()) {
        void processServiceRun(run.id).catch(() => undefined);
      }
      return NextResponse.json({ ok: true, run, ...(quota ? { remaining: quota.remaining } : {}) });
    } catch (error) {
      if (user.isAnonymous) await releaseGuestQuota(user.id, request, db);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERVICE_RUN_CREATE_FAILED";
    const status = message === "INSUFFICIENT_POINTS" ? 402 : message === "GUEST_QUOTA_EXHAUSTED" ? 429 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
