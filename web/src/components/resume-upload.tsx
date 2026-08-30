"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { AuthDialog } from "@/components/auth-dialog";
import { MaterialConfirmation } from "@/components/material-confirmation";
import { parseResumeFile, TEXT_MIME } from "@/lib/files/parse-resume";
import {
  PUBLIC_PREVIEW_SERVICE_KINDS,
  SERVICE_CATALOG,
  type ServiceKind,
} from "@/lib/service-catalog";

type ParsedState = {
  file: File;
  text: string;
  warnings: string[];
};

export function ResumeUpload() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("service") as ServiceKind | null;
  const serviceKind =
    requested && requested in SERVICE_CATALOG ? requested : "diagnosis";
  const service = SERVICE_CATALOG[serviceKind];
  const [pastedText, setPastedText] = useState("");
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [savedProjectId, setSavedProjectId] = useState("");
  const accepted = useMemo(() => ".pdf,.docx,.txt", []);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((response) => response.json())
      .then((result) => {
        setAuthenticated(Boolean(result.authenticated));
        setPreviewMode(Boolean(result.previewMode));
        setRemaining(typeof result.remaining === "number" ? result.remaining : null);
      })
      .catch(() => {
        setAuthenticated(false);
        setPreviewMode(true);
      });
  }, []);

  async function parseFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const result = await parseResumeFile(file);
      setParsed({ file, text: result.text, warnings: result.warnings });
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "PARSE_FAILED";
      setError(
        code === "FILE_TOO_LARGE"
          ? "文件不能超过 10 MiB。"
          : "暂时无法读取这个文件，请上传 PDF、Word 或 TXT。",
      );
    } finally {
      setBusy(false);
    }
  }

  function parsePastedText() {
    if (!pastedText.trim()) return;
    const file = new File([pastedText], "pasted-resume.txt", {
      type: TEXT_MIME,
    });
    setParsed({ file, text: pastedText.trim(), warnings: [] });
  }

  async function saveResume(options: { skipAuthCheck?: boolean } = {}) {
    if (!parsed) return;
    if (!options.skipAuthCheck && authenticated !== true) {
      if (!previewMode) {
        setAuthOpen(true);
        return;
      }
      setBusy(true);
      setError("");
      const guestResponse = await fetch("/api/auth/guest", { method: "POST" });
      const guestResult = await guestResponse.json();
      if (!guestResponse.ok) {
        setBusy(false);
        return setError("公开测试暂时无法开始，请稍后重试。");
      }
      setAuthenticated(true);
      setRemaining(typeof guestResult.remaining === "number" ? guestResult.remaining : null);
    }
    if (previewMode && !PUBLIC_PREVIEW_SERVICE_KINDS.includes(serviceKind as (typeof PUBLIC_PREVIEW_SERVICE_KINDS)[number])) {
      setBusy(false);
      return setError("公开验证版当前开放诊断和一页纸整理，其他服务稍后开放。");
    }
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("file", parsed.file);
    form.set("parsedText", parsed.text);
    form.set("title", "我的基础简历");
    const response = await fetch("/api/resumes", { method: "POST", body: form });
    const result = await response.json();
    setBusy(false);
    if (response.status === 401) {
      setAuthenticated(false);
      if (previewMode) return setError("公开测试会话已失效，请重新确认材料。");
      return setAuthOpen(true);
    }
    if (!response.ok) return setError("保存失败，请稍后重试。");
    setSavedProjectId(result.resumeProjectId);
  }

  if (savedProjectId) {
    return (
      <section className="rounded-lg border border-teal-200 bg-teal-50 p-6">
        <h2 className="text-lg font-semibold text-neutral-950">材料已保存</h2>
        <p className="mt-2 text-sm text-neutral-700">
          {previewMode
            ? `下一步将执行“${service.label}”，本次使用 1 次免费测试额度。`
            : `下一步将执行“${service.label}”，预计消耗 ${service.points} 积分。`}
        </p>
        {previewMode && remaining !== null && (
          <p className="mt-2 text-sm text-neutral-600">今日还可测试 {remaining} 次。</p>
        )}
        <a
          href={`/resumes/${savedProjectId}`}
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-neutral-950 px-5 text-sm font-medium text-white"
        >
          进入任务
        </a>
      </section>
    );
  }

  return (
    <>
      <div className="mb-5 border-b border-neutral-200 pb-5">
        <p className="text-sm font-medium text-teal-700">
          {previewMode ? "公开验证版 · 免费测试" : `当前服务 · ${service.points} 积分`}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">{service.label}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          文件先在浏览器中解析。确认材料前，不会上传到服务器。
        </p>
      </div>

      {parsed ? (
        <MaterialConfirmation
          fileName={parsed.file.name}
          text={parsed.text}
          warnings={parsed.warnings}
          onTextChange={(text) => setParsed({ ...parsed, text })}
          onBack={() => setParsed(null)}
          onContinue={() => void saveResume()}
          busy={busy}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center hover:border-teal-700">
            <Upload className="h-7 w-7 text-teal-800" aria-hidden="true" />
            <strong className="mt-4 text-base">上传 PDF、Word 或 TXT</strong>
            <span className="mt-2 text-sm text-neutral-500">单文件最大 10 MiB</span>
            <input
              type="file"
              accept={accepted}
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void parseFile(file);
              }}
            />
          </label>

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <span className="flex items-center gap-2 text-sm font-medium text-neutral-800">
              <FileText className="h-4 w-4" aria-hidden="true" />
              或粘贴简历文字
            </span>
            <textarea
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
              className="mt-3 min-h-36 w-full resize-y rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-teal-700"
              placeholder="粘贴完整简历内容"
            />
            <button
              type="button"
              onClick={parsePastedText}
              disabled={!pastedText.trim()}
              className="mt-3 min-h-10 rounded-md border border-neutral-300 px-4 text-sm font-medium disabled:opacity-50"
            >
              检查粘贴内容
            </button>
          </section>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {!previewMode && (
        <AuthDialog
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onAuthenticated={() => {
            setAuthenticated(true);
            setAuthOpen(false);
            void saveResume({ skipAuthCheck: true });
          }}
        />
      )}
    </>
  );
}
