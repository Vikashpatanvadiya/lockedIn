export function Avatar({ name, src, size = 32 }: { name: string; src: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-sun font-hand text-lg font-semibold" style={{ width: size, height: size, fontSize: size * 0.55 }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
