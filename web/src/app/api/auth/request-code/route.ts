import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/server/auth/otp";

const inputSchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const result = await new AuthService().requestEmailCode(input.email);
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
