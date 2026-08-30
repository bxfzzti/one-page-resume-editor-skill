import { NextResponse } from "next/server";
import { z } from "zod";
import { PhoneAuthService } from "@/server/auth/phone";

const inputSchema = z.object({
  phone: z.string(),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const result = await new PhoneAuthService().requestPhoneCode(input.phone);
    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt,
      ...(process.env.NODE_ENV !== "production" ? { devCode: result.code } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REQUEST_FAILED";
    const status = message.includes("OTP_") ? 429 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
