export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full bg-orange font-medium text-bg"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
