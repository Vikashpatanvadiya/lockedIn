import clsx from "clsx";

/** The LockedIn wordmark, tinted with the current text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="LockedIn"
      className={clsx("inline-block aspect-[593/100] bg-current", className ?? "h-6")}
      style={{
        maskImage: "url(/logo.png)",
        WebkitMaskImage: "url(/logo.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}
