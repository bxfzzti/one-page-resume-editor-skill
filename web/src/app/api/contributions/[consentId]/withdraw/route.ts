import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/db/client";
import { PointLedgerService } from "@/server/points/point-ledger";
import { ContributionService } from "@/server/contributions/contribution-service";

export async function POST(_request: Request, context: { params: Promise<{ consentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (user.isAnonymous) {
    return NextResponse.json(
      { ok: false, error: "GUEST_CONTRIBUTION_DISABLED" },
      { status: 403 },
    );
  }
  const { consentId } = await context.params;
  try {
    const result = await new ContributionService(db, new PointLedgerService(db)).withdraw(consentId, user.id);
    return NextResponse.json({ ok: true, consent: result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "WITHDRAW_FAILED" }, { status: 400 });
  }
}
