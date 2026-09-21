import { COUNTRIES, COUNTRY_IDS } from '../game/countries';
import { getLocale, register, t } from './locale';
import { PLACE_ZH } from './places.zh';

/**
 * Sync every country/province from countries.ts into the live i18n dictionary.
 * When you add a new place to countries.ts, call syncPlaces() (already at boot)
 * — it auto-registers `place:…` keys. Add zh in places.zh.ts for Chinese UI.
 */
export function syncPlaces(): string[] {
  const missing: string[] = [];
  const seen = new Set<string>();

  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const zh = PLACE_ZH[id];
    if (!zh) missing.push(id);
    register(`place:${id}`, { en: id, zh: zh ?? id });
  };

  for (const country of COUNTRY_IDS) {
    add(country);
    for (const region of COUNTRIES[country] as readonly string[]) add(region);
  }

  if (missing.length && import.meta.env.DEV) {
    console.warn(
      `[i18n] ${missing.length} place(s) missing Chinese in places.zh.ts:`,
      missing.slice(0, 20),
      missing.length > 20 ? '…' : '',
    );
  }
  return missing;
}

/** Localized country / province label for the active language. */
export function placeLabel(id: string): string {
  const key = `place:${id}`;
  if (getLocale() === 'en') return id;
  return t(key);
}
