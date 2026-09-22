"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-xl rounded-[28px] bg-paper p-7 shadow-2xl sm:p-9"
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-ink-soft hover:bg-paper-2 hover:text-ink">
              <X className="size-5" />
            </button>
            <h2 className="pr-10 font-display text-3xl font-semibold tracking-[-0.02em]">{title}</h2>
            <div className="mt-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
