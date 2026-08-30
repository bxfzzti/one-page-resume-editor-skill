import { NextResponse } from "next/server";
import {
  cleanupExpiredGuests,
  getGuestFingerprintHash,
  getGuestRemaining,
} from "@/server/auth/guest";
import { isAnonymousPreviewEnabled } from "@/server/config/mode";
import { getCurrentUser } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";

export async function GET(request: Request) {
  if (isAnonymousPreviewEnabled()) await cleanupExpiredGuests();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      previewMode: isAnonymousPreviewEnabled(),
    });
  }
  const balance = await new PointLedgerService().getBalance(user.id);
  return NextResponse.json({
    authenticated: true,
    previewMode: user.isAnonymous,
    ...(user.isAnonymous
      ? { remaining: await getGuestRemaining(user.id, getGuestFingerprintHash(request)) }
      : {}),
    user: { id: user.id, email: user.email, phone: user.phone },
    balance,
  });
}
