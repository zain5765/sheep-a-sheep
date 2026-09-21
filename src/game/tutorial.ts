import { t } from '../i18n/locale';

export type TutStep = {
  id: string;
  titleKey: string;
  bodyKey: string;
  anchor?: 'board' | 'tray' | 'props';
};

export const TUTORIAL_STEPS: TutStep[] = [
  { id: 'tap', titleKey: 'tut.tap.title', bodyKey: 'tut.tap.body', anchor: 'board' },
  { id: 'match', titleKey: 'tut.match.title', bodyKey: 'tut.match.body', anchor: 'tray' },
  { id: 'props', titleKey: 'tut.props.title', bodyKey: 'tut.props.body', anchor: 'props' },
];

const KEY = 'sheep_tutorial_done_v1';

export function tutorialDone(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
}

export function markTutorialDone(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

export function tutTitle(step: TutStep): string {
  return t(step.titleKey);
}

export function tutBody(step: TutStep): string {
  return t(step.bodyKey);
}
