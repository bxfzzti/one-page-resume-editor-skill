import { AppHeader } from "@/components/app-header";
import { getCurrentUser } from "@/server/auth/session";
import { PointLedgerService } from "@/server/points/point-ledger";

export default async function PointsPage() {
  const user = await getCurrentUser();
  const balance = user ? await new PointLedgerService().getBalance(user.id) : null;
  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm text-teal-700">积分</p>
        <h1 className="mt-1 text-2xl font-semibold">积分余额</h1>
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          {balance ? <p className="text-3xl font-semibold">{balance.available} <span className="text-base font-normal text-neutral-500">积分可用</span></p> : <p className="text-sm text-neutral-600">登录后查看积分余额。</p>}
          <p className="mt-3 text-sm text-neutral-500">1 元 = 10 积分。首版购买使用测试支付，不会真实扣款。</p>
        </div>
      </section>
    </main>
  );
}
