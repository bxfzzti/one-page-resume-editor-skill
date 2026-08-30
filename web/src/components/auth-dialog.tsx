"use client";

import { useState } from "react";
import { KeyRound, Loader2, Smartphone, X } from "lucide-react";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (input: {
    user: { id: string; email: string | null; phone: string | null };
    balance: { available: number; reserved: number };
  }) => void;
};

export function AuthDialog({
  open,
  onClose,
  onAuthenticated,
}: AuthDialogProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function requestCode() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/request-phone-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError("验证码发送失败，请稍后再试。");
    setSent(true);
    if (result.devCode) setCode(result.devCode);
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/verify-phone-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError("验证码无效或已过期。");
    onAuthenticated(result);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-title" className="text-lg font-semibold text-neutral-950">
              登录后开始生成
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              首次注册赠送 50 积分，不绑定支付方式。
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block text-sm font-medium text-neutral-800">
          手机号
          <span className="mt-2 flex items-center gap-2 rounded-md border px-3">
            <Smartphone className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
              className="min-h-11 w-full outline-none"
              placeholder="请输入 11 位手机号"
              maxLength={11}
            />
          </span>
        </label>

        {sent && (
          <label className="mt-4 block text-sm font-medium text-neutral-800">
            验证码
            <span className="mt-2 flex items-center gap-2 rounded-md border px-3">
              <KeyRound className="h-4 w-4 text-neutral-400" aria-hidden="true" />
              <input
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="min-h-11 w-full outline-none"
                placeholder="6 位验证码"
                maxLength={6}
              />
            </span>
          </label>
        )}

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          disabled={busy || phone.length !== 11 || (sent && code.length !== 6)}
          onClick={sent ? verifyCode : requestCode}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {sent ? "登录并领取积分" : "发送验证码"}
        </button>
      </section>
    </div>
  );
}
