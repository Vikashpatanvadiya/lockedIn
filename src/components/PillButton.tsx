import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps } from "react";

const base =
  "inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const tones = {
  orange: "bg-orange text-bg hover:bg-orange-soft",
  light: "bg-ink text-bg hover:bg-white",
  ghost: "border border-line text-ink hover:bg-surface",
} as const;

type Tone = keyof typeof tones;

export function PillLink({ tone = "orange", className, children, ...props }: ComponentProps<typeof Link> & { tone?: Tone }) {
  return (
    <Link {...props} className={clsx(base, tones[tone], className)}>
      {children}
    </Link>
  );
}

export function PillButton({ tone = "orange", className, children, ...props }: ComponentProps<"button"> & { tone?: Tone }) {
  return (
    <button {...props} className={clsx(base, tones[tone], className)}>
      {children}
    </button>
  );
}
