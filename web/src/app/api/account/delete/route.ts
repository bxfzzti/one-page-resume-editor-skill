import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { DataDeletionService } from "@/server/privacy/data-deletion";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  await new DataDeletionService().deleteAccount(user.id);
  return NextResponse.json({ ok: true });
}
