import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Layers3,
  Upload,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PRIMARY_SERVICE_KINDS, SERVICE_CATALOG, type ServiceKind } from "@/lib/service-catalog";

const SERVICE_ICONS: Record<(typeof PRIMARY_SERVICE_KINDS)[number], typeof ClipboardCheck> = {
  diagnosis: ClipboardCheck,
  one_page: FileText,
  jd_tailoring: Layers3,
  interview_review: AlertTriangle,
};

const SERVICE_DESCRIPTIONS: Record<(typeof PRIMARY_SERVICE_KINDS)[number], string> = {
  diagnosis: "先看主线、优势、问题和风险；没有 JD 时不做岗位匹配判断。",
  one_page: "保留关键事实，压缩成内容版一页纸，并记录删改依据。",
  jd_tailoring: "围绕一个 JD 做证据映射、缺口判断和受控定制。",
  interview_review: "检查数字口径、贡献边界、黑话和可能被追问的位置。",
};

function serviceHref(kind: ServiceKind) {
  return `/start?service=${kind}`;
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 border-b border-neutral-200 pb-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-teal-700">首次注册赠送 50 积分</p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-neutral-950 sm:text-3xl">
              你今天想完成什么？
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
              选择任务后上传简历，生成前会明确显示本次消耗；基础 Word/PDF 导出免费。
            </p>
          </div>
          <a
            href="/start"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 lg:justify-self-end"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            上传简历
          </a>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {PRIMARY_SERVICE_KINDS.map((kind) => {
            const item = SERVICE_CATALOG[kind];
            const Icon = SERVICE_ICONS[kind];

            return (
              <a
                key={kind}
                href={serviceHref(kind)}
                className="group flex min-h-40 flex-col justify-between rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
              >
                <span className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-base font-semibold leading-6 text-neutral-950">
                      {item.label}
                    </strong>
                    <span className="mt-2 block text-sm leading-6 text-neutral-600">
                      {SERVICE_DESCRIPTIONS[kind]}
                    </span>
                  </span>
                </span>
                <span className="mt-5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-teal-800">{item.points} 积分</span>
                  <span className="inline-flex items-center gap-1 text-neutral-500 transition group-hover:text-neutral-900">
                    开始
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
