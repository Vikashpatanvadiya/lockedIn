import clsx from "clsx";

/** A soft, puffy cloud built from overlapping circles. Position/size it with className. */
export function Cloud({ className, variant = 0 }: { className?: string; variant?: 0 | 1 | 2 }) {
  const puffs = [
    [
      [60, 70, 34],
      [100, 52, 44],
      [150, 60, 40],
      [190, 76, 30],
      [128, 84, 40],
      [84, 88, 30],
    ],
    [
      [50, 78, 28],
      [86, 60, 36],
      [130, 46, 46],
      [176, 62, 36],
      [210, 80, 26],
      [130, 86, 38],
    ],
    [
      [70, 74, 30],
      [110, 58, 38],
      [150, 70, 32],
      [110, 88, 30],
    ],
  ][variant];
  const id = `cloud-shade-${variant}`;
  return (
    <svg viewBox="0 0 260 120" aria-hidden className={clsx("pointer-events-none absolute", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe9f7" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <g fill={`url(#${id})`} filter={`url(#${id}-blur)`}>
        {puffs.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
        <rect x={puffs[0][0]} y={78} width={puffs.at(-3)![0] - puffs[0][0] + 20} height={30} rx={15} />
      </g>
    </svg>
  );
}
