"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { ImagePlus, X } from "lucide-react";

/** Resize an image in the browser so it can be stored as a small JPEG data URL. */
export async function resizeImage(file: File, max = 1200, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  className?: string;
  max?: number;
};

export function ImagePicker({ value, onChange, label = "Add a photo", className, max }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await resizeImage(file, max));
    } catch {
      setError("Couldn't read that image. Try a JPG or PNG.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={clsx(
          "group relative flex size-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
          value ? "border-transparent" : "border-line bg-page hover:border-kraft/50 hover:bg-white",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 p-4 text-center text-sm text-ink-soft">
            <ImagePlus className="size-6" strokeWidth={1.5} />
            {busy ? "Preparing…" : label}
          </span>
        )}
        {value && (
          <span className="absolute inset-0 grid place-items-center bg-ink/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100">
            Change photo
          </span>
        )}
      </button>
      {value && (
        <button
          type="button"
          aria-label="Remove photo"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white"
        >
          <X className="size-4" />
        </button>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-2 text-sm text-orange">{error}</p>}
    </div>
  );
}
