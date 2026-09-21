import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { t } from '../i18n/locale';

/** Native Share when on device; Web Share / clipboard fallback in browser. */
export async function shareGame(): Promise<boolean> {
  const title = t('share.title');
  const text = t('share.text');
  const dialogTitle = t('share.dialog');
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return true;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return true;
  }
  return false;
}
