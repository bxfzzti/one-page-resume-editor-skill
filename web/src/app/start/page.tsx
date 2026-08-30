import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { ResumeUpload } from "@/components/resume-upload";

export default function StartPage() {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-sm text-neutral-600">正在准备上传页面…</p>}>
          <ResumeUpload />
        </Suspense>
      </section>
    </main>
  );
}
