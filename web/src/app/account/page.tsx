import { AppHeader } from "@/components/app-header";
import { getCurrentUser } from "@/server/auth/session";

export default async function AccountPage() {
  const user = await getCurrentUser();
  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm text-teal-700">账户</p>
        <h1 className="mt-1 text-2xl font-semibold">账户与隐私</h1>
        <div className="mt-6 space-y-3">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">登录账户</h2>
            <p className="mt-2 text-sm text-neutral-600">{user ? user.email : "尚未登录"}</p>
          </section>
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">数据贡献</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">默认不用于模型训练。只有你主动同意并通过脱敏检查后，任务数据才会用于改进服务。</p>
          </section>
        </div>
      </section>
    </main>
  );
}
