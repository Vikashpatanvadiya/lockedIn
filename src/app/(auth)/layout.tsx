import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-6">
      <Link href="/login" className="text-ink" aria-label="LockedIn">
        <Logo className="h-[18px]" />
      </Link>
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
