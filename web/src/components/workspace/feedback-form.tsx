"use client";

import { useState } from "react";
import { Check, Loader2, MessageSquareText } from "lucide-react";

const CATEGORIES = [
  { value: "result_quality", label: "结果不够好" },
  { value: "fact_error", label: "事实或边界有误" },
  { value: "usability", label: "页面不好用" },
  { value: "technical_error", label: "任务报错或卡住" },
  { value: "other", label: "其他问题" },
] as const;

export function FeedbackForm({ serviceRunId }: { serviceRunId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>(
    "result_quality",
  );
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (helpful === null || description.trim().length < 2) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceRunId,
        category,
        helpful,
        description,
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(
        result.error === "CONTACT_INFORMATION_NOT_ALLOWED"
          ? "请删除手机号或邮箱后再提交。"
          : "反馈暂时没有提交成功，请稍后再试。",
      );
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="mt-5 flex items-center gap-2 border-t border-neutral-200 pt-4 text-sm text-teal-800">
        <Check className="h-4 w-4" aria-hidden="true" />
        感谢反馈，我们会用它改进公开验证版。
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 inline-flex min-h-10 items-center gap-2 border-t border-neutral-200 pt-4 text-sm font-medium text-neutral-700 hover:text-neutral-950"
      >
        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        提交反馈
      </button>
    );
  }

  return (
    <section className="mt-5 border-t border-neutral-200 pt-5 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-950">这次体验怎么样？</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            完全匿名，请勿填写姓名、联系方式或简历原文。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          收起
        </button>
      </div>

      <label className="mt-4 block text-sm font-medium text-neutral-800">
        问题类型
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as typeof category)}
          className="mt-2 min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
        >
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-neutral-800">结果有帮助吗？</legend>
        <div className="mt-2 grid grid-cols-2 rounded-md border border-neutral-300 bg-white p-1">
          {[
            { value: true, label: "有帮助" },
            { value: false, label: "没帮助" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={helpful === item.value}
              onClick={() => setHelpful(item.value)}
              className={`min-h-9 rounded px-3 text-sm font-medium ${
                helpful === item.value
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-medium text-neutral-800">
        具体说明
        <textarea
          value={description}
          maxLength={500}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="哪里不准确、看不懂或不好用？"
          className="mt-2 min-h-28 w-full resize-y rounded-md border border-neutral-300 p-3 text-sm leading-6 outline-none focus:border-teal-700"
        />
      </label>
      <p className="mt-1 text-right text-xs text-neutral-400">{description.length}/500</p>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={busy || helpful === null || description.trim().length < 2}
          onClick={() => void submit()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          提交匿名反馈
        </button>
      </div>
    </section>
  );
}
