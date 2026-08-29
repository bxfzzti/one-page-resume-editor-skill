import { NextResponse } from "next/server";
import { z } from "zod";
import { PointLedgerService } from "@/server/points/point-ledger";
import { AuthService } from "@/server/auth/otp";
import { setSessionCookie } from "@/server/auth/session";

const inputSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const result = await new AuthService().verifyEmailCode(
      input.email,
      input.code,
    );
    await setSessionCookie(result.sessionToken, result.expiresAt);
    const balance = await new PointLedgerService().getBalance(result.user.id);
    return NextResponse.json({
      ok: true,
      user: { id: result.user.id, email: result.user.email },
      balance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "VERIFY_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
