"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export function MobileTabs({ result, facts }: { result: ReactNode; facts: ReactNode }) {
  const [tab, setTab] = useState<"flow" | "result" | "facts">("result");
  return (
    <div className="md:hidden">
      <div className="grid grid-cols-3 border-b border-neutral-200">
        {(["flow", "result", "facts"] as const).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTab(item)}
            className={`min-h-11 border-b-2 text-sm ${tab === item ? "border-teal-700 text-teal-800" : "border-transparent text-neutral-500"}`}
          >
            {item === "flow" ? "流程" : item === "result" ? "当前结果" : "事实与风险"}
          </button>
        ))}
      </div>
      <div className="pt-4">{tab === "result" ? result : tab === "facts" ? facts : <p className="text-sm text-neutral-600">选择左侧任务继续。</p>}</div>
    </div>
  );
}
