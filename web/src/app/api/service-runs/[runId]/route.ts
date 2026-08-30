import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/db/client";
import { PointLedgerService } from "@/server/points/point-ledger";
import { ServiceRunner } from "@/server/runs/service-runner";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const { runId } = await context.params;
  const run = await new ServiceRunner(db, new PointLedgerService(db)).get(runId, user.id);
  if (!run) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, run });
}
