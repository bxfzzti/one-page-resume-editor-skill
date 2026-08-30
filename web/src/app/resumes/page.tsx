import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { AppHeader } from "@/components/app-header";
import { db } from "@/db/client";
import { resumeProjects } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";

export default async function ResumesPage() {
  const user = await getCurrentUser();
  const projects = user
    ? await db
        .select()
        .from(resumeProjects)
        .where(andUser(user.id))
        .orderBy(asc(resumeProjects.updatedAt))
    : [];

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <p className="text-sm text-teal-700">工作区</p>
            <h1 className="mt-1 text-2xl font-semibold">我的简历</h1>
          </div>
          <Link href="/start" className="rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white">新建简历</Link>
        </div>
        {!user ? (
          <p className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">登录后可以查看已保存的简历。</p>
        ) : projects.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">还没有简历项目，从上传或粘贴材料开始。</p>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/resumes/${project.id}`} className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-teal-700">
                <strong className="block text-base">{project.title}</strong>
                <span className="mt-2 block text-sm text-neutral-500">最近更新：{project.updatedAt.toLocaleDateString("zh-CN")}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function andUser(userId: string) {
  return eq(resumeProjects.userId, userId);
}
