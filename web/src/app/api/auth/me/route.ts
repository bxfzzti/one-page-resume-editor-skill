import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false });
  const balance = await new PointLedgerService().getBalance(user.id);
  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email, phone: user.phone },
    balance,
  });
}
