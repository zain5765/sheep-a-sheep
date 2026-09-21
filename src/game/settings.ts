import type { LocaleCode } from '../i18n/pack';

const MUTE_KEY = 'sheep_mute';
const LOCALE_KEY = 'sheep_locale';

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(mute: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, mute ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

export function getStoredLocale(): string {
  try {
    return localStorage.getItem(LOCALE_KEY) || 'en';
  } catch {
    return 'en';
  }
}

export function setStoredLocale(code: LocaleCode): void {
  try {
    localStorage.setItem(LOCALE_KEY, code);
  } catch {
    /* ignore */
  }
}
