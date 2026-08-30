import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { DataDeletionService } from "@/server/privacy/data-deletion";

export async function DELETE(_request: Request, context: { params: Promise<{ resumeId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const { resumeId } = await context.params;
  await new DataDeletionService().deleteResume(user.id, resumeId);
  return NextResponse.json({ ok: true });
}
