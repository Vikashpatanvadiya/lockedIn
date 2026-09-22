"use client";

import { useLayoutEffect, useRef, type ComponentProps } from "react";
import clsx from "clsx";

/** A textarea that grows with its content (min `rows` lines). */
export function AutoTextarea({ className, value, rows = 2, ...props }: ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} rows={rows} value={value} className={clsx("field lines block overflow-hidden", className)} {...props} />;
}
