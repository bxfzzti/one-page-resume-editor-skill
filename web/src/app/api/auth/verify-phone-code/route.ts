import { NextResponse } from "next/server";
import { z } from "zod";
import { PointLedgerService } from "@/server/points/point-ledger";
import { PhoneAuthService } from "@/server/auth/phone";
import { setSessionCookie } from "@/server/auth/session";

const inputSchema = z.object({
  phone: z.string(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const result = await new PhoneAuthService().verifyPhoneCode(input.phone, input.code);
    await setSessionCookie(result.sessionToken, result.expiresAt);
    const balance = await new PointLedgerService().getBalance(result.user.id);
    return NextResponse.json({
      ok: true,
      user: { id: result.user.id, email: result.user.email, phone: result.user.phone },
      balance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "VERIFY_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
