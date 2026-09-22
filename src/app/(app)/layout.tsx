import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/data";
import { logout } from "@/app/actions/auth";
import { AppNav } from "./AppNav";
import { Avatar } from "@/components/Avatar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 rounded-full border border-line/70 bg-paper/85 pl-5 pr-1.5 backdrop-blur-md">
          <Link href="/book" aria-label="Your book" className="text-ink">
            <Logo className="h-[17px]" />
          </Link>
          <AppNav />
          <div className="flex items-center gap-1">
            <Link href="/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-paper-2" aria-label="Your profile">
              <Avatar name={user.name} src={user.avatar} />
              <span className="hidden text-sm font-medium md:inline">{user.name.split(" ")[0]}</span>
            </Link>
            <form action={logout}>
              <button className="h-9 rounded-full px-3 text-sm text-ink-soft hover:bg-paper-2 hover:text-ink">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="pt-5">{children}</main>
    </div>
  );
}
