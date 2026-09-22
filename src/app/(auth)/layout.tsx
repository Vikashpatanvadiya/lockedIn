import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BookCover, Sticker } from "@/components/BookCover";
import { Cloud } from "@/components/Cloud";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="text-ink" aria-label="LockedIn home">
          <Logo className="h-5" />
        </Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="font-hand text-lg text-ink-faint">you have air in your lungs and work to do.</p>
      </div>
      <div className="sky relative hidden overflow-hidden lg:block">
        <Cloud className="left-[-14%] top-[58%] w-[66%]" />
        <Cloud variant={1} className="right-[-16%] top-[10%] w-[60%]" />
        <Cloud className="left-[20%] top-[78%] w-[76%]" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative w-[46%] max-w-[340px]">
            <BookCover
              title="Year 21"
              subtitle="From this birthday to the next."
              color="kraft"
              owner="You"
              label="Days"
              days={365}
              pencil
              stickers
              className="w-full rotate-[-5deg] animate-float [--r:-5deg]"
            />
            <Sticker kind="star" className="!size-14 -right-10 top-8 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
