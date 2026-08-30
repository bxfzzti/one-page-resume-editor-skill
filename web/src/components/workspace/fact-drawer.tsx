"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

type Fact = {
  id: string;
  status: string;
  sourceExcerpt: string;
  riskText: string | null;
};

export function FactDrawer({ facts }: { facts: Fact[] }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="rounded-lg border border-neutral-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="事实与风险"
        className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-semibold"
      >
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />事实与风险</span>
        <ChevronRight className={`h-4 w-4 transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-3">
          {facts.length === 0 ? <p className="text-sm text-neutral-500">暂时没有事实条目。</p> : facts.map((fact) => (
            <div key={fact.id} className="text-sm">
              <span className="text-xs text-teal-700">{fact.status}</span>
              <p className="mt-1 leading-6 text-neutral-800">{fact.sourceExcerpt}</p>
              {fact.riskText && <p className="mt-1 text-xs leading-5 text-amber-800">{fact.riskText}</p>}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
