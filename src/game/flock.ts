/** Calm meadow hero — sparse cows on the ridge, soft sky. */

function cowSvg(opts: {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  variant?: 'plain' | 'dj';
  delay?: string;
}): string {
  const s = opts.scale ?? 1;
  const flip = opts.flip
    ? `translate(${opts.x},${opts.y}) scale(${-s},${s}) translate(-56,0)`
    : `translate(${opts.x},${opts.y}) scale(${s})`;
  const delay = opts.delay ? ` style="animation-delay:${opts.delay}"` : '';
  return `
    <g transform="${flip}">
      <g class="splash-cow"${delay}>
        <ellipse cx="30" cy="32" rx="22" ry="15" fill="#f7f2ea" stroke="#243028" stroke-width="2"/>
        <ellipse cx="20" cy="28" rx="6" ry="5" fill="#2f342c"/>
        <ellipse cx="38" cy="36" rx="7" ry="5.5" fill="#2f342c"/>
        <ellipse cx="34" cy="24" rx="5" ry="4" fill="#2f342c"/>
        <ellipse cx="12" cy="26" rx="11" ry="9" fill="#f7f2ea" stroke="#243028" stroke-width="2"/>
        <ellipse cx="6" cy="18" rx="4" ry="5" fill="#f7f2ea" stroke="#243028" stroke-width="1.6"/>
        <ellipse cx="18" cy="17" rx="3.5" ry="4.5" fill="#f7f2ea" stroke="#243028" stroke-width="1.6"/>
        <path d="M5 14l-2-7M17 13l2-7" stroke="#243028" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="9" cy="25" r="2.2" fill="#1c201c"/>
        <ellipse cx="5" cy="30" rx="3" ry="2.2" fill="#e8b4b8"/>
        <path d="M18 46v11M26 46v11M34 46v11M42 46v11" stroke="#243028" stroke-width="2.4" stroke-linecap="round"/>
        ${
          opts.variant === 'dj'
            ? `
          <path d="M2 16c0-8 5-13 12-13s12 5 12 13" fill="none" stroke="#1c201c" stroke-width="3" stroke-linecap="round"/>
          <rect x="-2" y="16" width="8" height="11" rx="3" fill="#1c201c"/>
          <rect x="20" y="16" width="8" height="11" rx="3" fill="#1c201c"/>
          <rect x="4" y="22" width="8" height="5" rx="1.5" fill="#1c201c"/>
          <rect x="13" y="22" width="6" height="5" rx="1.5" fill="#1c201c"/>
        `
            : ''
        }
      </g>
    </g>
  `;
}

/** Meadow banner for the splash hero (not a full-screen wallpaper). */
export function flockSceneHtml(): string {
  return `
    <svg class="flock-svg" viewBox="0 0 360 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="splashSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5aa8d4"/>
          <stop offset="45%" stop-color="#8ec9e6"/>
          <stop offset="78%" stop-color="#b5d9b8"/>
          <stop offset="100%" stop-color="#6ebf72"/>
        </linearGradient>
        <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8fc98f"/>
          <stop offset="100%" stop-color="#6db56e"/>
        </linearGradient>
        <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5fad63"/>
          <stop offset="100%" stop-color="#3f8f4a"/>
        </linearGradient>
        <radialGradient id="sunGlow" cx="82%" cy="18%" r="32%">
          <stop offset="0%" stop-color="#fff1b0" stop-opacity="1"/>
          <stop offset="45%" stop-color="#ffd978" stop-opacity=".4"/>
          <stop offset="100%" stop-color="#ffd978" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect width="360" height="280" fill="url(#splashSky)"/>
      <circle cx="295" cy="52" r="72" fill="url(#sunGlow)"/>
      <circle cx="295" cy="52" r="22" fill="#ffe082"/>

      <g fill="#fff" opacity=".5">
        <ellipse cx="68" cy="48" rx="34" ry="13"/>
        <ellipse cx="92" cy="44" rx="20" ry="11"/>
        <ellipse cx="46" cy="46" rx="16" ry="9"/>
        <ellipse cx="175" cy="36" rx="26" ry="10"/>
        <ellipse cx="194" cy="34" rx="14" ry="8"/>
      </g>

      <path d="M-20 168 C70 128 130 148 190 138 C260 126 310 118 380 148 L380 220 L-20 220 Z" fill="url(#hillFar)" opacity=".9"/>
      <path d="M-30 198 C50 164 120 180 175 172 C250 160 300 186 390 158 L390 280 L-30 280 Z" fill="url(#hillNear)"/>

      ${cowSvg({ x: 22, y: 118, scale: 0.7, delay: '0s' })}
      ${cowSvg({ x: 100, y: 132, scale: 0.82, flip: true, delay: '-1.4s' })}
      ${cowSvg({ x: 188, y: 108, scale: 0.95, variant: 'dj', delay: '-2.2s' })}
      ${cowSvg({ x: 278, y: 138, scale: 0.74, delay: '-0.7s' })}
    </svg>
  `;
}
