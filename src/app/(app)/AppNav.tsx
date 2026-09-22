"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/book", label: "My book" },
  { href: "/growth", label: "Growth" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={clsx(
            "rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4",
            path.startsWith(l.href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
