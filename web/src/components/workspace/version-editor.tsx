"use client";

import { useState } from "react";

export function VersionEditor({
  version,
  onSaved,
}: {
  version: { id: string; title: string; contentJson: unknown };
  onSaved?: (versionId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(version.title);
  const [content, setContent] = useState(JSON.stringify(version.contentJson, null, 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/resume-versions/${version.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, contentJson: JSON.parse(content), baseVersionId: version.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "SAVE_FAILED");
      setEditing(false);
      onSaved?.(result.version.id);
    } catch {
      setError("内容必须是有效 JSON，保存失败。原版本没有改变。");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return <button type="button" onClick={() => setEditing(true)} className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium">编辑并另存为</button>;
  }
  return (
    <div className="mt-5 border-t border-neutral-200 pt-4">
      <label className="block text-sm font-medium">版本名称<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border p-2" /></label>
      <label className="mt-4 block text-sm font-medium">内容<textarea value={content} onChange={(event) => setContent(event.target.value)} className="mt-2 min-h-56 w-full rounded-md border p-2 font-mono text-xs" /></label>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-md border px-4 py-2 text-sm">取消</button><button type="button" disabled={busy} onClick={save} className="rounded-md bg-neutral-950 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "保存中…" : "另存为新版本"}</button></div>
    </div>
  );
}
