"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { FeedbackForm } from "./feedback-form";

type ServiceKind = "diagnosis" | "one_page";
type Run = {
  id: string;
  state: string;
  serviceKind: string;
  outputSnapshot?: unknown;
  errorCode?: string | null;
};

const SERVICES: Array<{ kind: ServiceKind; label: string; description: string }> = [
  { kind: "diagnosis", label: "看看简历问题", description: "检查主线、优势、风险和事实边界。" },
  { kind: "one_page", label: "整理成一页纸", description: "保留关键事实，压缩成内容版一页纸。" },
];

const ERROR_MESSAGES: Record<string, string> = {
  MODEL_TIMEOUT: "模型响应超时，请稍后再试。本次不会扣除内部测试积分。",
  SOURCE_AUDIT_FAILED: "结果没有通过事实来源检查，本次结果未交付。",
  MODEL_RESPONSE_INVALID: "模型返回格式异常，请稍后再试。",
};

export function TaskLauncher({
  projectId,
  resumeText,
  initialRuns,
}: {
  projectId: string;
  resumeText: string;
  initialRuns: Run[];
}) {
  const [run, setRun] = useState<Run | null>(
    initialRuns[0] ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  useEffect(() => {
    const pending = initialRuns.find(
      (item) => item.state === "reserved" || item.state === "running",
    );
    if (pending) watch(pending.id);
  }, [initialRuns]);

  function watch(runId: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const response = await fetch(`/api/service-runs/${runId}`);
      if (!response.ok) return;
      const result = await response.json();
      setRun(result.run);
      if (result.run.state === "succeeded" || result.run.state === "failed") {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setBusy(false);
      }
    }, 1_000);
  }

  async function start(kind: ServiceKind) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/service-runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        resumeProjectId: projectId,
        serviceKind: kind,
        inputSnapshot: { resumeText },
        idempotencyKey: `preview:${projectId}:${kind}:${crypto.randomUUID()}`,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setBusy(false);
      setError(
        result.error === "GUEST_QUOTA_EXHAUSTED"
          ? "今日免费测试次数已用完。"
          : "任务暂时无法开始，请稍后重试。",
      );
      return;
    }
    setRun(result.run);
    watch(result.run.id);
  }

  if (run?.state === "succeeded") {
    return (
      <div className="mt-5 border-t border-neutral-200 pt-5">
        <p className="text-sm font-medium text-teal-700">任务已完成</p>
        <pre className="mt-3 max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-md bg-neutral-50 p-4 text-sm leading-6 text-neutral-800">
          {JSON.stringify(run.outputSnapshot, null, 2)}
        </pre>
        <FeedbackForm serviceRunId={run.id} />
        <button
          type="button"
          onClick={() => setRun(null)}
          className="mt-4 min-h-10 rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-800"
        >
          继续测试其他服务
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-neutral-200 pt-5">
      <p className="text-sm font-medium text-teal-700">开始一次免费测试</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <button
            key={service.kind}
            type="button"
            disabled={busy}
            onClick={() => void start(service.kind)}
            className="flex min-h-24 items-start gap-3 rounded-md border border-neutral-200 bg-white p-4 text-left transition hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-teal-700" aria-hidden="true" /> : <Play className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />}
            <span>
              <strong className="block text-sm font-semibold text-neutral-950">{service.label}</strong>
              <span className="mt-1 block text-xs leading-5 text-neutral-600">{service.description}</span>
            </span>
          </button>
        ))}
      </div>
      {run?.state === "reserved" || run?.state === "running" ? (
        <p className="mt-3 text-sm text-neutral-600">正在处理，页面会自动更新结果。</p>
      ) : null}
      {run?.state === "failed" && (
        <>
          <p className="mt-3 text-sm text-red-700">
            {ERROR_MESSAGES[run.errorCode ?? ""] ?? "任务暂时未完成，请稍后再试。"}
          </p>
          <FeedbackForm serviceRunId={run.id} />
        </>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
