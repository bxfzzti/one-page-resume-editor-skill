import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumeProjects, sourceFiles } from "@/db/schema";
import {
  DOCX_MIME,
  MAX_RESUME_FILE_BYTES,
  PDF_MIME,
  TEXT_MIME,
} from "@/lib/files/parse-resume";
import { getCurrentUser } from "@/server/auth/session";
import { getStorageAdapter } from "@/server/storage/storage";

const allowedMimeTypes = new Set([DOCX_MIME, PDF_MIME, TEXT_MIME]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const parsedText = form.get("parsedText");
  const title = form.get("title");
  if (!(file instanceof File) || typeof parsedText !== "string") {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
  }
  if (!allowedMimeTypes.has(file.type) || file.size > MAX_RESUME_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: "INVALID_FILE" }, { status: 400 });
  }
  if (!parsedText.trim() || parsedText.length > 2_000_000) {
    return NextResponse.json({ ok: false, error: "INVALID_TEXT" }, { status: 400 });
  }

  const resumeProjectId = randomUUID();
  const sourceFileId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  const storageKey = `${user.id}/${resumeProjectId}/${sourceFileId}-${safeName}`;
  const storage = getStorageAdapter();
  await storage.put(
    storageKey,
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  );

  try {
    await db.transaction(async (tx) => {
      await tx.insert(resumeProjects).values({
        id: resumeProjectId,
        userId: user.id,
        title:
          typeof title === "string" && title.trim()
            ? title.trim().slice(0, 100)
            : "我的简历",
      });
      await tx.insert(sourceFiles).values({
        id: sourceFileId,
        resumeProjectId,
        storageKey,
        mimeType: file.type,
        originalName: file.name.slice(0, 255),
        parseStatus: "parsed",
        parsedText,
      });
    });
  } catch (error) {
    await storage.delete(storageKey);
    throw error;
  }

  return NextResponse.json({ ok: true, resumeProjectId, sourceFileId });
}
