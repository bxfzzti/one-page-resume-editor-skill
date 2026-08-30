import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";
import { ContributionService } from "@/server/contributions/contribution-service";

const input = z.object({ serviceRunId: z.string().uuid(), consentVersion: z.string().min(1).max(40) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const value = input.parse(await request.json());
    const service = new ContributionService(db, new PointLedgerService(db));
    const consent = await service.consent({ userId: user.id, serviceRunId: value.serviceRunId, version: value.consentVersion });
    const sample = await service.approve(consent?.id ?? "", user.id);
    return NextResponse.json({ ok: true, consent, sample: { id: sample.id, reviewState: sample.reviewState } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "CONTRIBUTION_FAILED" }, { status: 400 });
  }
}
