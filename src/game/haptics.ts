import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function buzz(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    /* ignore */
  }
}
