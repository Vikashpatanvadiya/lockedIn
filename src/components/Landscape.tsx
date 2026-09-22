/**
 * A painted golden-hour landscape: mountains, a meadow, a big tree, and someone
 * on a bench reading their book. Drawn to sit under the landing page's sky.
 */

// Deterministic scatter so server and client render the same flowers.
function scatter(n: number, seed: number, box: [number, number, number, number]) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const [x0, y0, x1, y1] = box;
  return Array.from({ length: n }, () => {
    const y = y0 + rnd() * (y1 - y0);
    return { x: x0 + rnd() * (x1 - x0), y, r: 1.4 + rnd() * 2.2 * ((y - y0) / (y1 - y0) + 0.4), k: rnd() };
  });
}

const FLOWERS = scatter(260, 11, [0, 560, 1440, 720]);

/** Leaf clusters inside an ellipse, shaded darker toward the bottom-right. */
function foliage(n: number, seed: number, cx: number, cy: number, rx: number, ry: number, size: number) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const shades = ["#3d6428", "#4f7a2f", "#658f36", "#7ea53e", "#9dbb4c", "#c2d46a"];
  return Array.from({ length: n }, () => {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * d * rx;
    const y = cy + Math.sin(a) * d * ry;
    // light comes from the upper left (the sun sits behind, slightly right; keep it soft)
    const light = 1 - ((x - cx) / rx + (y - cy) / ry + 2) / 4;
    const idx = Math.max(0, Math.min(shades.length - 1, Math.round(light * (shades.length - 1) + (rnd() - 0.5) * 1.6)));
    return { x, y, r: size * (0.55 + rnd() * 0.6), fill: shades[idx] };
  }).sort((a, b) => a.y - b.y);
}

const BIG_TREE = [
  ...foliage(70, 5, 110, 110, 150, 110, 30),
  ...foliage(40, 7, 110, 70, 110, 70, 22),
];
const SMALL_TREE = foliage(40, 13, 22, 34, 44, 34, 12);
const GRASS = scatter(180, 29, [0, 575, 1440, 720]);

export function Landscape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 720" aria-hidden className={className}>
      <defs>
        <radialGradient id="ls-sun">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#ffe2a8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ls-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9b9c4" />
          <stop offset="1" stopColor="#d9c7b8" />
        </linearGradient>
        <linearGradient id="ls-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7f98a6" />
          <stop offset="1" stopColor="#a9b3a6" />
        </linearGradient>
        <linearGradient id="ls-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a7bf6c" />
          <stop offset="1" stopColor="#7fa24c" />
        </linearGradient>
        <linearGradient id="ls-meadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9cbf55" />
          <stop offset="0.5" stopColor="#6f9a3a" />
          <stop offset="1" stopColor="#4f7a2c" />
        </linearGradient>
        <linearGradient id="ls-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbe3c2" stopOpacity="0" />
          <stop offset="1" stopColor="#fbe3c2" stopOpacity="0.7" />
        </linearGradient>
        <filter id="ls-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.11  0 0 0 0 0.07  0 0 0 0.13 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="ls-paint" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="12" />
        </filter>
        <filter id="ls-leaf" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="16" />
        </filter>
        <linearGradient id="ls-grain-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="ls-grain-mask">
          <rect y="260" width="1440" height="460" fill="url(#ls-grain-fade)" />
        </mask>
        <filter id="ls-soft">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* the sky itself is painted by the container, so it lines up with the section above */}
      <ellipse cx="960" cy="440" rx="560" ry="230" fill="url(#ls-sun)" />

      {/* warm clouds on the horizon */}
      <g fill="#fff3e2" filter="url(#ls-soft)" opacity="0.9">
        <ellipse cx="260" cy="330" rx="170" ry="34" />
        <ellipse cx="340" cy="305" rx="90" ry="40" />
        <ellipse cx="1120" cy="300" rx="210" ry="38" />
        <ellipse cx="1040" cy="275" rx="100" ry="42" />
        <ellipse cx="1210" cy="282" rx="80" ry="34" />
        <ellipse cx="700" cy="350" rx="140" ry="22" />
      </g>
      <g fill="#f7c996" filter="url(#ls-soft)" opacity="0.55">
        <ellipse cx="1120" cy="322" rx="190" ry="14" />
        <ellipse cx="270" cy="352" rx="150" ry="12" />
      </g>

      {/* far mountains with lit peaks */}
      <g filter="url(#ls-paint)">
      <path
        d="M0 430 L90 370 L160 395 L260 318 L340 372 L430 330 L520 392 L600 360 L700 408 L780 350 L860 300 L930 352 L1010 322 L1090 380 L1180 318 L1270 360 L1350 334 L1440 372 L1440 470 L0 470Z"
        fill="url(#ls-far)"
      />
      <path d="M260 318 L300 340 L285 346 L320 362 L340 372 L300 360 Z M860 300 L900 326 L884 330 L930 352 L880 344 Z M1180 318 L1220 340 L1206 344 L1270 360 L1210 352 Z" fill="#f4c9a0" opacity="0.8" />

      {/* mid mountains */}
      <path
        d="M0 470 L120 420 L220 452 L330 400 L450 460 L560 430 L640 470 L760 418 L880 468 L990 424 L1100 470 L1230 410 L1340 452 L1440 430 L1440 520 L0 520Z"
        fill="url(#ls-mid)"
      />
      </g>
      <rect y="380" width="1440" height="160" fill="url(#ls-haze)" />

      {/* rolling hills */}
      <path d="M0 520 C200 470 360 500 520 506 C700 512 820 470 1000 482 C1180 494 1320 470 1440 486 L1440 600 L0 600Z" fill="url(#ls-hill)" />
      <path d="M0 520 C200 470 360 500 520 506 C700 512 820 470 1000 482 C1180 494 1320 470 1440 486 L1440 500 C1300 490 1160 506 1000 500 C820 492 700 528 520 522 C360 516 200 490 0 536Z" fill="#fbe0b0" opacity="0.35" />

      {/* small tree, right */}
      <g transform="translate(1180 430)">
        <path d="M18 88 C20 70 17 58 20 40 L26 40 C27 60 25 72 28 88Z" fill="#5b4430" />
        <g filter="url(#ls-leaf)">
          {SMALL_TREE.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={l.fill} />
          ))}
        </g>
      </g>

      {/* meadow */}
      <path d="M0 560 C240 530 480 548 720 552 C960 556 1200 532 1440 548 L1440 720 L0 720Z" fill="url(#ls-meadow)" />
      <path d="M0 560 C240 530 480 548 720 552 C960 556 1200 532 1440 548 L1440 566 C1200 552 960 574 720 570 C480 566 240 552 0 580Z" fill="#d8e59a" opacity="0.45" />

      {/* big tree, left */}
      <g transform="translate(250 300)">
        <path d="M70 290 C78 240 66 200 80 150 C84 130 70 110 60 96 L74 92 C88 110 96 126 98 140 C104 118 120 104 136 96 L142 106 C122 118 112 136 108 160 C100 210 112 250 118 290Z" fill="#5a412c" />
        <path d="M86 290 C90 250 84 214 92 170 L100 172 C96 214 102 252 104 290Z" fill="#3f2d1f" opacity="0.5" />
        <g filter="url(#ls-leaf)">
          {BIG_TREE.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={l.fill} />
          ))}
        </g>
      </g>
      <ellipse cx="350" cy="592" rx="150" ry="16" fill="#3f6a2a" opacity="0.35" />

      {/* rocks */}
      <g>
        <path d="M150 640 C150 612 176 596 206 598 C236 600 252 620 250 644Z" fill="#a4968a" />
        <path d="M168 614 C182 604 202 602 220 606" stroke="#c9bcae" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M1230 690 C1226 650 1262 624 1306 626 C1352 628 1380 656 1376 694Z" fill="#9c8e84" />
        <path d="M1254 650 C1272 638 1300 634 1326 638" stroke="#c4b6a8" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M560 604 C560 590 574 582 590 583 C606 584 614 594 612 606Z" fill="#aa9c8f" />
      </g>

      {/* someone on a bench, reading their book */}
      <g transform="translate(940 520)">
        <ellipse cx="30" cy="42" rx="42" ry="6" fill="#3f6a2a" opacity="0.35" />
        <rect x="0" y="22" width="62" height="5" rx="1.5" fill="#6b4a2f" />
        <rect x="0" y="12" width="62" height="4" rx="1.5" fill="#7a5539" />
        <rect x="4" y="27" width="3" height="14" fill="#5a3e27" />
        <rect x="55" y="27" width="3" height="14" fill="#5a3e27" />
        {/* person */}
        <path d="M24 22 L24 6 C24 -4 40 -4 40 6 L40 22Z" fill="#e8662c" />
        <circle cx="32" cy="-10" r="8" fill="#e9b98f" />
        <path d="M24 -14 C26 -22 40 -22 41 -12 C36 -16 30 -16 24 -14Z" fill="#3a2a1d" />
        <path d="M26 22 L20 38 L25 38 L31 24Z M36 22 L40 38 L45 38 L41 22Z" fill="#2f3e56" />
        {/* open book */}
        <path d="M22 4 L32 8 L42 4 L42 12 L32 15 L22 12Z" fill="#fffdf8" />
        <path d="M32 8 L32 15" stroke="#c9bcae" strokeWidth="0.8" />
      </g>

      {/* grass tufts and wildflowers */}
      <g stroke="#4f7a2c" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
        {GRASS.map((g, i) => (
          <path key={i} d={`M${g.x} ${g.y} l${-2 - g.k * 3} ${-6 - g.r * 2} M${g.x} ${g.y} l${2 + g.k * 3} ${-5 - g.r * 2}`} />
        ))}
      </g>
      <g>
        {FLOWERS.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.k < 0.55 ? "#fffaf0" : f.k < 0.85 ? "#fbd25b" : "#f3a6a0"} opacity={0.85} />
        ))}
      </g>

      {/* painterly grain over the land */}
      <rect y="260" width="1440" height="460" filter="url(#ls-grain)" fill="#fff" mask="url(#ls-grain-mask)" />
    </svg>
  );
}
