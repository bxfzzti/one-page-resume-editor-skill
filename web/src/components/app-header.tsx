import Link from "next/link";
import { FileUser } from "lucide-react";

const NAV_ITEMS = [
  { label: "我的简历", href: "/resumes" },
  { label: "积分", href: "/points" },
  { label: "账户", href: "/account" },
];

export function AppHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-white">
            <FileUser className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-base font-semibold text-neutral-950">一页纸简历</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
