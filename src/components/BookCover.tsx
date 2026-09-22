import clsx from "clsx";
import { Cloud } from "./Cloud";
import type { CoverColor } from "@/lib/types";

export const COVER_COLORS: Record<CoverColor, { bg: string; name: string; text: string }> = {
  kraft: { bg: "#9b7150", name: "Kraft", text: "#fffaf2" },
  sky: { bg: "#6fb4f5", name: "Sky", text: "#ffffff" },
  blush: { bg: "#f2b3b0", name: "Blush", text: "#4a2320" },
  forest: { bg: "#1f4d3a", name: "Forest", text: "#f3efe4" },
  ink: { bg: "#2a2622", name: "Ink", text: "#f7f1e6" },
  sun: { bg: "#f3c94f", name: "Sun", text: "#2a1d12" },
};

type Props = {
  title: string;
  subtitle?: string;
  color: CoverColor;
  image?: string | null;
  owner?: string;
  label?: string;
  days?: number | string;
  className?: string;
  pencil?: boolean;
  stickers?: boolean;
};

/** A hardback notebook cover with a name-label sticker, Superr style. */
export function BookCover({ title, subtitle, color, image, owner, label, days, className, pencil, stickers }: Props) {
  const c = COVER_COLORS[color];
  return (
    <div className={clsx("@container relative aspect-[3/4]", className)}>
      <div
        className="cover-texture book-shadow absolute inset-0 overflow-hidden rounded-l-md rounded-r-[26px]"
        style={{ backgroundColor: c.bg, color: c.text }}
      >
        {color === "sky" && <CoverClouds />}
        {image && (
          <div className="absolute inset-x-[12%] top-[9%] h-[42%] overflow-hidden rounded-lg sticker rotate-[-1.5deg]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="size-full object-cover" />
          </div>
        )}

        <div
          className={clsx(
            "absolute inset-x-[14%] rounded-xl bg-white px-[6%] py-[4%] text-ink shadow-[0_2px_0_rgba(0,0,0,0.05),0_8px_18px_rgba(0,0,0,0.12)]",
            image ? "top-[56%]" : "top-[22%]",
          )}
        >
          <div className="flex items-baseline gap-2 border-b border-ink/15 pb-[3%]">
            <span className="text-[clamp(7px,1.6cqw,11px)] font-medium uppercase tracking-wide text-ink-soft">Title</span>
          </div>
          <p className="truncate pt-[3%] text-center font-hand text-[clamp(18px,7.5cqw,44px)] leading-none">{title || "My Book"}</p>
          {subtitle && (
            <p className="mt-[2%] line-clamp-2 text-center font-serif text-[clamp(9px,3cqw,15px)] italic leading-snug text-ink-soft">
              {subtitle}
            </p>
          )}
          {(owner || label || days) && (
            <div className="mt-[4%] grid grid-cols-[1fr_auto] border-t border-ink/15 pt-[3%] text-[clamp(7px,2.4cqw,12px)]">
              <span className="truncate">
                <span className="text-ink-soft">By </span>
                <span className="font-hand text-[1.5em] leading-none">{owner}</span>
              </span>
              <span className="border-l border-ink/15 pl-2">
                <span className="text-ink-soft">{label || "Days"} </span>
                <span className="font-hand text-[1.5em] leading-none">{days}</span>
              </span>
            </div>
          )}
        </div>

        {stickers && (
          <>
            <Sticker className="bottom-[8%] left-[12%] rotate-[-10deg]" kind="heart" />
            <Sticker className="bottom-[9%] left-[30%] rotate-[8deg]" kind="bolt" />
          </>
        )}
        <span className="absolute bottom-[4%] right-[7%] font-hand text-[clamp(10px,3.4cqw,18px)] opacity-60">no. 01</span>
      </div>
      {pencil && <Pencil />}
    </div>
  );
}

function CoverClouds() {
  return (
    <div className="absolute inset-0">
      <Cloud className="left-[-8%] top-[4%] w-[60%]" />
      <Cloud variant={1} className="right-[-18%] top-[30%] w-[70%]" />
      <Cloud variant={2} className="left-[-6%] top-[60%] w-[50%]" />
      <Cloud className="right-[-10%] top-[78%] w-[55%]" />
    </div>
  );
}

function Pencil() {
  return (
    <div className="absolute -right-[5%] top-[14%] h-[78%] w-[6%]">
      <div className="absolute inset-x-0 top-0 h-[4%] rounded-t-full bg-[#e86a6a]" />
      <div className="absolute inset-x-0 top-[4%] h-[3%] bg-[#c9c3b8]" />
      <div className="absolute inset-x-0 top-[7%] bottom-[8%] bg-gradient-to-r from-[#f6c54a] via-[#fbd96a] to-[#e3ab2c]" />
      <div
        className="absolute inset-x-0 bottom-0 h-[8%] bg-[#f1d9b5]"
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
      />
      <div className="absolute inset-x-0 top-[18%] h-[26%] -mx-[35%] rounded-sm bg-kraft-dark/90" />
    </div>
  );
}

export function Sticker({ kind, className }: { kind: "heart" | "bolt" | "star" | "sun"; className?: string }) {
  return (
    <span className={clsx("absolute block size-[14%] drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]", className)}>
      <svg viewBox="0 0 48 48" className="size-full">
        {kind === "heart" && (
          <>
            <path
              d="M24 42s-17-9.7-17-22.2C7 13 12 8.5 17.4 8.5c3 0 5.3 1.6 6.6 3.8 1.3-2.2 3.6-3.8 6.6-3.8C36 8.5 41 13 41 19.8 41 32.3 24 42 24 42Z"
              fill="#ef4b4b"
              stroke="#fff"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="21" r="3.2" fill="#fff" />
            <circle cx="28" cy="21" r="3.2" fill="#fff" />
            <circle cx="18.6" cy="21.6" r="1.6" fill="#2a1d12" />
            <circle cx="28.6" cy="21.6" r="1.6" fill="#2a1d12" />
          </>
        )}
        {kind === "bolt" && (
          <path d="M27 3 9 27h12l-3 18 21-26H26l4-16Z" fill="#f7cf3d" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        )}
        {kind === "star" && (
          <path
            d="m24 4 5.6 12.3 13.4 1.4-10 9 2.9 13.3L24 33.2 12.1 40l2.9-13.3-10-9 13.4-1.4L24 4Z"
            fill="#4da3f4"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        {kind === "sun" && (
          <>
            <circle cx="24" cy="24" r="12" fill="#e8662c" stroke="#fff" strokeWidth="3" />
            <path d="M16 26q8 7 16 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}
