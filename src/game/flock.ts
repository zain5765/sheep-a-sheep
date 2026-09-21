/** Doodle sheep matching the viral splash vibe (white fluff + black face + stick legs). */

export function sheepSvg(opts: {
  x: number;
  y: number;
  scale?: number;
  variant?: 'plain' | 'dj';
}): string {
  const s = opts.scale ?? 1;
  const body = `
    <g transform="translate(${opts.x},${opts.y}) scale(${s})">
      <!-- fluff body -->
      <ellipse cx="28" cy="30" rx="20" ry="16" fill="#fff" stroke="#1a1a1a" stroke-width="2.2"/>
      <ellipse cx="14" cy="26" rx="9" ry="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="42" cy="26" rx="9" ry="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="28" cy="16" rx="11" ry="9" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="18" cy="38" rx="8" ry="7" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <ellipse cx="38" cy="38" rx="8" ry="7" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <!-- face -->
      <rect x="20" y="26" width="16" height="14" rx="7" fill="#1c1c1c"/>
      <circle cx="25" cy="32" r="3.2" fill="#fff"/>
      <circle cx="33" cy="32" r="3.2" fill="#fff"/>
      <circle cx="25.6" cy="32.6" r="1.15" fill="#111"/>
      <circle cx="33.6" cy="32.6" r="1.15" fill="#111"/>
      <!-- legs -->
      <path d="M20 46v12M26 46v12M32 46v12M38 46v12" stroke="#1a1a1a" stroke-width="2.6" stroke-linecap="round"/>
      ${
        opts.variant === 'dj'
          ? `
        <!-- headphones -->
        <path d="M16 18c0-8 5-13 12-13s12 5 12 13" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="12" y="18" width="8" height="12" rx="3" fill="#111"/>
        <rect x="36" y="18" width="8" height="12" rx="3" fill="#111"/>
        <!-- sunglasses -->
        <rect x="19" y="29" width="8" height="5" rx="1.5" fill="#111"/>
        <rect x="29" y="29" width="8" height="5" rx="1.5" fill="#111"/>
        <path d="M27 31.5h2" stroke="#111" stroke-width="2"/>
        <!-- tiny DJ deck -->
        <rect x="10" y="50" width="36" height="10" rx="2" fill="#2b2b2b"/>
        <circle cx="20" cy="55" r="3" fill="#ff5252"/>
        <circle cx="36" cy="55" r="3" fill="#40c4ff"/>
        <rect x="26" y="52" width="4" height="6" rx="1" fill="#fff59d"/>
      `
          : ''
      }
    </g>
  `;
  return body;
}

/** Full-bleed meadow flock for the home splash (TapTap-style composition). */
export function flockSceneHtml(): string {
  const sheep: string[] = [];
  // Dense packed rows like the original banner
  const rows = [
    { y: 28, count: 7, scale: 0.72, gap: 52, ox: -8 },
    { y: 68, count: 8, scale: 0.78, gap: 48, ox: -18 },
    { y: 112, count: 7, scale: 0.86, gap: 54, ox: -4 },
    { y: 158, count: 8, scale: 0.92, gap: 50, ox: -22 },
    { y: 208, count: 7, scale: 1.0, gap: 56, ox: -6 },
    { y: 262, count: 6, scale: 1.08, gap: 60, ox: 10 },
  ];

  let n = 0;
  for (const row of rows) {
    for (let i = 0; i < row.count; i++) {
      const x = row.ox + i * row.gap + (n % 3) * 3;
      const y = row.y + ((i + n) % 2) * 4;
      // Center slot ≈ DJ sheep
      const isDj = row.y === 158 && i === 3;
      sheep.push(
        sheepSvg({
          x,
          y,
          scale: row.scale,
          variant: isDj ? 'dj' : 'plain',
        }),
      );
      n++;
    }
  }

  return `
    <svg class="flock-svg" viewBox="0 0 360 340" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grassTuft" width="40" height="28" patternUnits="userSpaceOnUse">
          <path d="M8 28c2-10 4-16 5-20M14 28c1-8 3-14 2-18M22 28c2-9 5-15 6-19" stroke="#4caf50" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>
        </pattern>
      </defs>
      <rect width="360" height="340" fill="#7ed957"/>
      <rect width="360" height="340" fill="url(#grassTuft)" opacity=".7"/>
      ${sheep.join('\n')}
    </svg>
  `;
}
