import { PACK, type I18nEntry, type LocaleCode } from './pack';
import { getStoredLocale, setStoredLocale } from '../game/settings';

export type { LocaleCode, I18nEntry } from './pack';

export const EN: LocaleCode = 'en';
export const ZH: LocaleCode = 'zh';
export const ALLOWED: LocaleCode[] = [EN, ZH];

export const LABELS: Record<LocaleCode, string> = {
  en: 'English',
  zh: '简体中文',
};

type Listener = (code: LocaleCode) => void;

const listeners = new Set<Listener>();

/** Live dictionary — starts as pack, grows via register() / syncPlaces(). */
const STRINGS: Record<string, I18nEntry> = { ...PACK };

let current: LocaleCode = normalize(getStoredLocale());

export function normalize(code: string | null | undefined): LocaleCode {
  const c = (code || '').trim().toLowerCase();
  if (c.startsWith('zh')) return ZH;
  if (c.startsWith('en')) return EN;
  if (c === ZH || c === EN) return c;
  return EN;
}

export function isAllowed(code: string): code is LocaleCode {
  return ALLOWED.includes(normalize(code));
}

export function getLocale(): LocaleCode {
  return current;
}

export function setLocale(code: LocaleCode | string): void {
  const next = normalize(code);
  if (next === current) return;
  current = next;
  setStoredLocale(next);
  document.documentElement.lang = next === ZH ? 'zh-CN' : 'en';
  document.title = next === ZH ? '羊了个羊' : 'Sheep a Sheep';
  for (const fn of listeners) fn(next);
}

export function onLocaleChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function displayName(code: string): string {
  return LABELS[normalize(code)] ?? LABELS[EN];
}

/**
 * Add / override a string. Use this when adding new UI so both locales stay in sync.
 * Example: register('daily.banner', { en: 'Daily challenge', zh: '每日挑战' })
 */
export function register(key: string, entry: I18nEntry): void {
  if (!entry.en || !entry.zh) {
    console.warn(`[i18n] register("${key}") needs both en and zh`);
  }
  STRINGS[key] = entry;
}

export function registerMany(entries: Record<string, I18nEntry>): void {
  for (const [key, entry] of Object.entries(entries)) register(key, entry);
}

export function hasKey(key: string): boolean {
  return key in STRINGS;
}

/** Farmverse-style Locale.t — supports {0} {1} … placeholders. */
export function t(key: string, args: Array<string | number> = []): string {
  const entry = STRINGS[key];
  let text = key;
  if (entry) {
    text = entry[current] ?? entry[EN] ?? key;
  } else if (import.meta.env.DEV) {
    console.warn(`[i18n] missing key: ${key}`);
  }
  if (args.length === 0) return text;
  return text.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? ''));
}

export function lookupOr(key: string, fallback: string): string {
  return STRINGS[key] ? t(key) : fallback;
}

/** Apply document lang/title for the stored locale (call once at boot). */
export function applyDocumentLocale(): void {
  document.documentElement.lang = current === ZH ? 'zh-CN' : 'en';
  document.title = current === ZH ? '羊了个羊' : 'Sheep a Sheep';
}
