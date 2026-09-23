import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { requireUser } from "@/lib/data";
import { logout } from "@/app/actions/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="LockedIn" className="text-ink">
          <Logo className="h-4" />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-surface">
            <Avatar name={user.name} />
            <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
          </Link>
          <form action={logout}>
            <button className="h-9 rounded-full px-3 text-sm text-ink-soft transition-colors hover:bg-surface hover:text-ink">Log out</button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
