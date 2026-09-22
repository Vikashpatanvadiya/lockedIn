import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type Tone = "orange" | "periwinkle" | "sun" | "ink" | "paper";

const tones: Record<Tone, string> = {
  orange: "bg-orange text-white hover:bg-[#d65a22]",
  periwinkle: "bg-periwinkle text-ink hover:bg-[#9dbbf5]",
  sun: "bg-sun text-ink hover:bg-[#f9d968]",
  ink: "bg-ink text-paper hover:bg-black",
  paper: "bg-page text-ink border border-line hover:bg-white",
};

function Inner({ children, tone }: { children: ReactNode; tone: Tone }) {
  return (
    <>
      <span className="pl-5 pr-1">{children}</span>
      <span
        className={clsx(
          "grid size-9 place-items-center rounded-full transition-transform group-hover:translate-x-0.5",
          tone === "ink" ? "bg-paper text-ink" : "bg-ink text-paper",
        )}
      >
        <ArrowRight className="size-4" strokeWidth={2.25} />
      </span>
    </>
  );
}

const base =
  "group inline-flex h-11 items-center gap-2 rounded-full pr-1 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function PillLink({ tone = "orange", className, children, ...props }: ComponentProps<typeof Link> & { tone?: Tone }) {
  return (
    <Link {...props} className={clsx(base, tones[tone], className)}>
      <Inner tone={tone}>{children}</Inner>
    </Link>
  );
}

export function PillButton({ tone = "orange", className, children, ...props }: ComponentProps<"button"> & { tone?: Tone }) {
  return (
    <button {...props} className={clsx(base, tones[tone], className)}>
      <Inner tone={tone}>{children}</Inner>
    </button>
  );
}
