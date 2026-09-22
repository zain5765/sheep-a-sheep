import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { t } from '../i18n/locale';
import { buildChallengeUrl } from './challenge';

async function sharePayload(title: string, text: string, dialogTitle: string): Promise<boolean> {
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

/** Native Share when on device; Web Share / clipboard fallback in browser. */
export async function shareGame(): Promise<boolean> {
  return sharePayload(t('share.title'), t('share.text'), t('share.dialog'));
}

/** Share a friend-challenge link with the same board seed. */
export async function shareChallenge(seed: string): Promise<boolean> {
  const url = buildChallengeUrl(seed);
  const text = t('share.challenge_text', [url]);
  return sharePayload(t('share.title'), text, t('share.dialog'));
}
