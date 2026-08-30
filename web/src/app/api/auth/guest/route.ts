import { NextResponse } from "next/server";
import {
  createGuestSession,
  getGuestFingerprintHash,
  getGuestRemaining,
} from "@/server/auth/guest";
import { getCurrentUser, setSessionCookie } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser?.isAnonymous) {
      return NextResponse.json({
        ok: true,
        preview: true,
        user: { id: currentUser.id, email: null, phone: null },
        balance: await new PointLedgerService().getBalance(currentUser.id),
        remaining: await getGuestRemaining(
          currentUser.id,
          getGuestFingerprintHash(request),
        ),
        expiresAt: currentUser.anonymousExpiresAt,
      });
    }
    const result = await createGuestSession(request);
    await setSessionCookie(result.sessionToken, result.expiresAt);
    const balance = await new PointLedgerService().getBalance(result.user.id);
    return NextResponse.json({
      ok: true,
      preview: true,
      user: { id: result.user.id, email: null, phone: null },
      balance,
      remaining: result.remaining,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GUEST_SESSION_FAILED";
    const status = message === "PREVIEW_MODE_DISABLED" ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
