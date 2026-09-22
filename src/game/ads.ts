/**
 * Rewarded ad gate — AdMob-ready.
 * Set localStorage `sheep_ad_unit` or env `VITE_ADMOB_REWARD_ID` when you wire AdMob.
 * Until then, uses the original-style short “watch ad” countdown.
 */

export type AdResult = { watched: boolean; via: 'admob' | 'mock' };

type AdMobLike = {
  prepareRewardVideoAd: (opts: { adId: string }) => Promise<void>;
  showRewardVideoAd: () => Promise<void>;
};

function rewardUnitId(): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (env?.VITE_ADMOB_REWARD_ID) return env.VITE_ADMOB_REWARD_ID;
    return localStorage.getItem('sheep_ad_unit') || '';
  } catch {
    return '';
  }
}

function getAdMob(): AdMobLike | null {
  const w = window as Window & { AdMob?: AdMobLike; CapacitorAdMob?: AdMobLike };
  return w.AdMob ?? w.CapacitorAdMob ?? null;
}

/** UI countdown overlay (same feel as original when SDK not wired). */
export function showMockRewardedAd(
  mount: HTMLElement,
  ui: { title: string; body: string; sheepHtml: string },
): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal ad-modal">
        <div class="modal-sheep">${ui.sheepHtml}</div>
        <h2>${ui.title}</h2>
        <p>${ui.body}</p>
        <div class="ad-bar"><i></i></div>
        <div class="ad-sec">5</div>
      </div>
    `;
    mount.appendChild(overlay);
    const bar = overlay.querySelector('.ad-bar > i') as HTMLElement;
    const sec = overlay.querySelector('.ad-sec') as HTMLElement;
    let left = 5;
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      bar.style.transition = 'width 5s linear';
      bar.style.width = '100%';
    });
    const tick = window.setInterval(() => {
      left -= 1;
      sec.textContent = String(Math.max(0, left));
      if (left <= 0) {
        clearInterval(tick);
        overlay.remove();
        resolve(true);
      }
    }, 1000);
  });
}

export async function showRewardedAd(
  mount: HTMLElement,
  ui: { title: string; body: string; sheepHtml: string },
): Promise<AdResult> {
  const unit = rewardUnitId();
  const admob = getAdMob();
  if (unit && admob) {
    try {
      await admob.prepareRewardVideoAd({ adId: unit });
      await admob.showRewardVideoAd();
      return { watched: true, via: 'admob' };
    } catch {
      /* fall through */
    }
  }
  const watched = await showMockRewardedAd(mount, ui);
  return { watched, via: 'mock' };
}
