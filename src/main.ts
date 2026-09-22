import './style.css';
import { Game, type PropKind } from './game/Game';
import {
  COUNTRY_IDS,
  MAX_SLOTS,
  TILE_DEFS,
  provincesFor,
  type CountryId,
  type RegionId,
} from './game/config';
import { burstAt, confetti, flyBetween, pulse, shake, shuffleBoard } from './game/fx';
import { flockSceneHtml } from './game/flock';
import { buzz } from './game/haptics';
import { tileIconHtml } from './game/icons';
import { sfx } from './game/sfx';
import { showRewardedAd } from './game/ads';
import { todaySeed } from './game/rng';
import { shareChallenge, shareGame } from './game/share';
import { isMuted, toggleMuted } from './game/settings';
import { TUTORIAL_STEPS, markTutorialDone, tutBody, tutTitle, tutorialDone } from './game/tutorial';
import type { TileData } from './game/types';
import { applyDocumentLocale, getLocale, onLocaleChange, setLocale, t, type LocaleCode } from './i18n/locale';
import { placeLabel, syncPlaces } from './i18n/places';

const app = document.querySelector<HTMLDivElement>('#app')!;
const game = new Game();
let busy = false;
let tutStep = 0;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function requireTeam(then: () => void): void {
  const s = game.getState();
  if (!s.country) {
    app.appendChild(
      modal(t('modal.pick_country_title'), t('modal.pick_country_body'), [
        { label: t('common.ok'), primary: true, onClick: () => undefined },
      ]),
    );
    return;
  }
  if (!s.region) {
    app.appendChild(
      modal(t('modal.pick_province_title'), t('modal.pick_province_body'), [
        { label: t('common.ok'), primary: true, onClick: () => undefined },
      ]),
    );
    return;
  }
  then();
}

function modeBadge(mode: string): string {
  if (mode === 'daily') return `<span class="mode-pill">${t('mode.daily')}</span>`;
  if (mode === 'challenge') return `<span class="mode-pill challenge">${t('mode.challenge')}</span>`;
  return '';
}

function levelName(index: number): string {
  return t(index === 0 ? 'level.1.name' : 'level.2.name');
}

function levelSub(index: number): string {
  return t(index === 0 ? 'level.1.sub' : 'level.2.sub');
}

async function flyTileToTray(fromEl: HTMLElement, type: TileData['type'], size: number): Promise<void> {
  const from = fromEl.getBoundingClientRect();
  const tray = document.querySelector('.tray .slots');
  const empty = tray?.querySelector('.slot:not(.filled)') as HTMLElement | null;
  const targetEl = empty ?? tray;
  if (!targetEl) return;
  const to = targetEl.getBoundingClientRect();
  await flyBetween(from, to, tileIconHtml(type), size, 220);
  sfx.land();
}

async function onTileClick(uid: number, btn: HTMLButtonElement, size: number): Promise<void> {
  if (busy || game.getState().status !== 'playing') return;
  const state = game.getState();
  const tile = state.tiles.find((t) => t.uid === uid);
  if (!tile || !state.clickable.get(uid)) return;

  busy = true;
  btn.classList.add('launching');
  sfx.tap();
  void buzz('light');
  await flyTileToTray(btn, tile.type, size);
  const result = game.clickTile(uid);

  if (result.matched && result.pendingClearUids.length > 0) {
    await popMatchingSlots(result.pendingClearUids);
    sfx.match();
    void buzz('medium');
    const tray = document.querySelector('.tray');
    const r = tray?.getBoundingClientRect();
    if (r) burstAt(r.left + r.width / 2, r.top + r.height / 2, 16);
    pulse(tray);
    const end = game.commitMatchClears();
    if (end.won) {
      void buzz('heavy');
      if (game.getState().levelIndex >= 1) {
        sfx.win();
        confetti();
      } else {
        sfx.levelClear();
      }
    }
    if (end.lost) {
      sfx.fail();
      void buzz('heavy');
      shake(document.querySelector('.tray'), 500);
    }
    busy = false;
    return;
  }

  if (result.won) {
    void buzz('heavy');
    if (game.getState().levelIndex >= 1) {
      sfx.win();
      confetti();
    } else {
      sfx.levelClear();
    }
  }
  if (result.lost) {
    sfx.fail();
    void buzz('heavy');
    shake(document.querySelector('.tray'), 500);
  }
  busy = false;
}

function popMatchingSlots(uids: number[]): Promise<void> {
  return new Promise((resolve) => {
    const set = new Set(uids);
    const slots = [...document.querySelectorAll('.tray .slot.filled')] as HTMLElement[];
    let any = false;
    for (const slot of slots) {
      const id = Number(slot.dataset.uid);
      if (!set.has(id)) continue;
      slot.classList.add('match-pop');
      any = true;
    }
    window.setTimeout(resolve, any ? 320 : 0);
  });
}

async function runUndoProp(): Promise<void> {
  if (busy) return;
  const preview = game.getState();
  if (preview.undoLeft <= 0 || preview.slots.length === 0) return;

  const lastUid = preview.slots[preview.slots.length - 1]?.uid;
  const traySlot = lastUid
    ? (document.querySelector(`.tray .slot.filled[data-uid="${lastUid}"]`) as HTMLElement | null)
    : (document.querySelector('.tray .slot.filled:last-child') as HTMLElement | null);
  const from = traySlot?.getBoundingClientRect();

  const leaving = game.undoLeave();
  if (!leaving || leaving.length === 0) return;

  busy = true;
  sfx.undo();
  void buzz('light');
  const tile = leaving[0];
  if (from && tile) {
    const board = document.querySelector('.board') as HTMLElement | null;
    const br = board?.getBoundingClientRect();
    const size = game.getState().level.tileSize || 40;
    const to = br
      ? new DOMRect(br.left + Math.max(0, tile.x), br.top + Math.max(0, tile.y), size, size)
      : from;
    await flyBetween(from, to, tileIconHtml(tile.type), size * 0.9, 260);
  }
  game.emitState();
  pulse(document.querySelector('.board'));
  busy = false;
}

async function runRemoveProp(): Promise<void> {
  if (busy) return;
  const filled = [...document.querySelectorAll('.tray .slot.filled')].slice(0, 3) as HTMLElement[];
  const holds = [...document.querySelectorAll('.hold-slot:not(.filled)')] as HTMLElement[];
  if (filled.length === 0) return;

  busy = true;
  sfx.remove();
  await Promise.all(
    filled.map((slot, i) => {
      const hold = holds[i] ?? document.querySelector('.hold-row');
      if (!hold) return Promise.resolve();
      const icon = slot.innerHTML;
      return flyBetween(slot.getBoundingClientRect(), hold.getBoundingClientRect(), icon, 46, 260);
    }),
  );
  const ok = game.removeProp();
  if (ok) pulse(document.querySelector('.hold-row'));
  busy = false;
}

async function runShuffleProp(): Promise<void> {
  if (busy) return;
  busy = true;
  sfx.shuffle();
  await shuffleBoard(document.querySelector('.board'));
  game.shuffle();
  busy = false;
}

function render(): void {
  const state = game.getState();
  app.innerHTML = '';
  document.documentElement.lang = getLocale() === 'zh' ? 'zh-CN' : 'en';

  if (state.screen === 'menu') {
    app.appendChild(renderMenu(state.country, state.region));
    return;
  }
  if (state.screen === 'rank') {
    app.appendChild(renderRank(state.ranks));
    return;
  }

  const shell = el('div', 'shell game-shell');

  const top = el('div', 'game-top');
  top.innerHTML = `
    <button class="icon-btn" type="button" data-act="home" aria-label="${t('a11y.home')}">←</button>
    <div class="level-badge">
      <strong>${levelName(state.levelIndex)}${modeBadge(state.mode)}</strong>
      <span>${levelSub(state.levelIndex)}</span>
    </div>
    <div class="top-right">
      <div class="progress-pill">${state.total - state.remaining}/${state.total}</div>
      <button class="icon-btn" type="button" data-act="settings" aria-label="${t('a11y.settings')}">⚙</button>
    </div>
  `;
  top.querySelector('[data-act="home"]')!.addEventListener('click', () => {
    sfx.ui();
    sfx.stopAmbience();
    game.goMenu();
  });
  top.querySelector('[data-act="settings"]')!.addEventListener('click', () => {
    sfx.ui();
    openSettings();
  });

  const stage = el('div', 'stage');
  const leftPiles = el('div', 'piles piles-left');
  const rightPiles = el('div', 'piles piles-right');

  const pileMap = new Map<number, TileData[]>();
  for (const t of state.tiles) {
    if (t.removed || t.inSlot || t.pile < 0 || t.inHold) continue;
    const list = pileMap.get(t.pile) ?? [];
    list.push(t);
    pileMap.set(t.pile, list);
  }
  const pileKeys = [...pileMap.keys()].sort((a, b) => a - b);
  const mid = Math.ceil(pileKeys.length / 2);
  pileKeys.forEach((key, idx) => {
    const col = el('div', 'pile');
    const list = pileMap.get(key)!.sort((a, b) => a.layer - b.layer);
    list.forEach((tile, i) => {
      const isTop = i === list.length - 1;
      const btn = renderTileBtn(tile, isTop, state.level.tileSize * 0.82, true);
      btn.style.position = 'relative';
      btn.style.left = '0';
      btn.style.top = `${-i * 5}px`;
      btn.style.marginBottom = i === list.length - 1 ? '0' : '-72%';
      col.appendChild(btn);
    });
    (idx < mid ? leftPiles : rightPiles).appendChild(col);
  });

  const boardWrap = el('div', 'board-wrap');
  const board = el('div', 'board');
  board.style.width = `${state.level.boardWidth}px`;
  board.style.height = `${state.level.boardHeight}px`;
  const boardTiles = state.tiles
    .filter((tile) => !tile.removed && !tile.inSlot && tile.pile < 0 && !tile.inHold)
    .sort((a, b) => a.layer - b.layer || a.uid - b.uid);
  for (const tile of boardTiles) {
    board.appendChild(
      renderTileBtn(tile, state.clickable.get(tile.uid) === true, state.level.tileSize, false),
    );
  }
  boardWrap.appendChild(board);
  stage.append(leftPiles, boardWrap, rightPiles);

  const hold = el('div', 'hold-row');
  const holdSlots = el('div', 'hold-slots');
  for (let i = 0; i < 3; i++) {
    const slot = el('div', 'hold-slot');
    const item = state.hold[i];
    if (item) {
      const def = TILE_DEFS[item.type];
      slot.classList.add('filled');
      slot.style.setProperty('--tile-color', def.color);
      slot.innerHTML = `<button type="button" class="hold-tile">${tileIconHtml(item.type)}</button>`;
      slot.querySelector('button')!.addEventListener('click', () => {
        const holdBtn = slot.querySelector('button') as HTMLButtonElement;
        void onTileClick(item.uid, holdBtn, 50);
      });
    }
    holdSlots.appendChild(slot);
  }
  hold.appendChild(holdSlots);

  const tray = el('div', 'tray wood');
  const slotsRow = el('div', 'slots');
  for (let i = 0; i < MAX_SLOTS; i++) {
    const slot = el('div', 'slot');
    const item = state.slots[i];
    if (item) {
      const def = TILE_DEFS[item.type];
      slot.classList.add('filled');
      slot.dataset.uid = String(item.uid);
      slot.style.setProperty('--tile-color', def.color);
      slot.innerHTML = tileIconHtml(item.type);
    }
    slotsRow.appendChild(slot);
  }
  tray.appendChild(slotsRow);

  const props = el('div', 'props');
  props.append(
    propButton('prop.remove', '⬆', state.removeLeft, 'remove'),
    propButton('prop.undo', '↩', state.undoLeft, 'undo'),
    propButton('prop.shuffle', '⟳', state.shuffleLeft, 'shuffle'),
  );

  shell.append(top, stage, hold, tray, props);

  if (state.levelIndex === 0 && state.status === 'playing' && !tutorialDone()) {
    shell.appendChild(renderTutorial());
  }

  if (state.status === 'won') {
    const isLast = state.levelIndex >= 1 || state.mode !== 'normal';
    const dailyWin = state.mode === 'daily';
    const challengeWin = state.mode === 'challenge';
    const title = dailyWin
      ? t('win.daily.title')
      : challengeWin
        ? t('win.challenge.title')
        : t(isLast ? 'win.l2.title' : 'win.l1.title');
    const body = dailyWin
      ? t('win.daily.body')
      : challengeWin
        ? t('win.challenge.body')
        : `${t(isLast ? 'win.l2.body' : 'win.l1.body')}${isLast ? `<br><em class="win-pct">${t('win.pct')}</em>` : ''}`;

    const buttons =
      dailyWin || challengeWin || isLast
        ? [
            {
              label: t('win.challenge_friend'),
              primary: true,
              onClick: () => {
                void shareChallenge(state.seed);
              },
            },
            {
              label: t('win.again'),
              onClick: () => {
                if (dailyWin) game.startDaily();
                else if (challengeWin) game.startChallenge(state.seed);
                else game.startGame();
              },
            },
            { label: t('common.home'), onClick: () => game.goMenu() },
          ]
        : [
            {
              label: t('win.enter_l2'),
              primary: true,
              onClick: () => {
                sfx.ui();
                game.nextLevel();
              },
            },
            { label: t('win.replay_l1'), onClick: () => game.restart() },
          ];

    shell.appendChild(modal(title, body, buttons));
  }

  if (state.status === 'lost') {
    shell.appendChild(
      modal(t('lose.title'), t('lose.body'), [
        ...(state.reviveLeft > 0
          ? [
              {
                label: t('lose.ad'),
                primary: true,
                onClick: () => {
                  void showRewardedAd(app, {
                    title: t('ad.title'),
                    body: t('ad.body'),
                    sheepHtml: tileIconHtml('sheep'),
                  }).then((res) => {
                    if (!res.watched) return;
                    game.revive();
                    sfx.revive();
                    void buzz('medium');
                    pulse(document.querySelector('.hold-row'));
                  });
                },
              },
              {
                label: t('lose.share'),
                onClick: () => {
                  void shareGame().then(() => {
                    game.revive();
                    sfx.revive();
                    pulse(document.querySelector('.hold-row'));
                  });
                },
              },
            ]
          : []),
        {
          label: t('win.challenge_friend'),
          onClick: () => {
            void shareChallenge(state.seed);
          },
        },
        { label: t('lose.retry'), onClick: () => game.restart() },
        { label: t('common.home'), onClick: () => game.goMenu() },
      ]),
    );
  }

  app.appendChild(shell);
}

function renderMenu(country: CountryId | null, region: RegionId | null): HTMLDivElement {
  const provinces = country ? provincesFor(country) : [];
  const state = game.getState();
  const date = todaySeed();
  const dailyDone = state.dailyCleared;
  const menu = el('div', 'menu splash');
  menu.innerHTML = `
    <div class="splash-field" aria-hidden="true">${flockSceneHtml()}</div>
    <div class="splash-brand">
      <h1 class="brand-title">
        <span class="brand-cn">${t('brand.title')}</span>
      </h1>
    </div>
    <div class="splash-ui">
      <button type="button" class="daily-banner${dailyDone ? ' done' : ''}" data-daily>
        <strong>${t('daily.banner_title')}</strong>
        <span>${t('daily.banner_sub', [date])}</span>
        <em>${dailyDone ? t('daily.cleared') : t('daily.percent')}</em>
      </button>
      <p class="splash-sub">${t('splash.sub')}</p>
      <p class="region-label">${t('splash.team_need')}</p>
      <label class="region-label" for="country">${t('splash.country')}</label>
      <select id="country" class="region-select" aria-label="${t('a11y.country')}">
        <option value="">${t('splash.pick_country')}</option>
        ${COUNTRY_IDS.map(
          (c) =>
            `<option value="${c}" ${country === c ? 'selected' : ''}>${placeLabel(c)}</option>`,
        ).join('')}
      </select>
      <label class="region-label" for="province">${t('splash.province')}</label>
      <select id="province" class="region-select" aria-label="${t('a11y.province')}" ${country ? '' : 'disabled'}>
        <option value="">${country ? t('splash.pick_province') : t('splash.select_country_first')}</option>
        ${provinces
          .map(
            (p) =>
              `<option value="${p}" ${region === p ? 'selected' : ''}>${placeLabel(p)}</option>`,
          )
          .join('')}
      </select>
      ${
        country && region
          ? `<div class="team-bar">${t('splash.playing_for', [placeLabel(region), placeLabel(country)])}</div>`
          : ''
      }
      <button class="btn play" type="button">${t('splash.start')}</button>
      <button class="btn ghost daily-btn" type="button" data-daily2>${t('daily.play')}</button>
      <button class="ghost-link" type="button" data-challenge>${t('splash.challenge_friend')}</button>
      <button class="ghost-link" type="button" data-rank>${t('splash.ranks')}</button>
      <p class="region-label splash-lang-label">${t('settings.language')}</p>
      <div class="lang-row splash-lang" role="group" aria-label="${t('settings.language')}">
        <button type="button" class="lang-btn${getLocale() === 'en' ? ' active' : ''}" data-lang="en">${t('settings.lang.en')}</button>
        <button type="button" class="lang-btn${getLocale() === 'zh' ? ' active' : ''}" data-lang="zh">${t('settings.lang.zh')}</button>
      </div>
    </div>
  `;

  const startNormal = () =>
    requireTeam(() => {
      game.startGame();
      sfx.unlock();
      sfx.startAmbience();
      sfx.ui();
    });

  const startDaily = () =>
    requireTeam(() => {
      game.startDaily();
      sfx.unlock();
      sfx.startAmbience();
      sfx.ui();
    });

  menu.querySelector<HTMLSelectElement>('#country')!.addEventListener('change', (e) => {
    const v = (e.target as HTMLSelectElement).value as CountryId | '';
    if (v) game.setCountry(v);
  });
  menu.querySelector<HTMLSelectElement>('#province')!.addEventListener('change', (e) => {
    const v = (e.target as HTMLSelectElement).value as RegionId | '';
    if (v) game.setRegion(v);
  });
  menu.querySelector('.play')!.addEventListener('click', startNormal);
  menu.querySelectorAll('[data-daily], [data-daily2]').forEach((btn) => {
    btn.addEventListener('click', startDaily);
  });
  menu.querySelector('[data-challenge]')!.addEventListener('click', () => {
    sfx.ui();
    requireTeam(() => {
      const seed = `friend-${todaySeed()}-${Math.floor(Math.random() * 1e6)}`;
      void shareChallenge(seed).then(() => {
        game.startChallenge(seed);
        sfx.unlock();
        sfx.startAmbience();
      });
    });
  });
  menu.querySelector('[data-rank]')!.addEventListener('click', () => {
    sfx.ui();
    game.goRank();
  });
  menu.querySelectorAll<HTMLButtonElement>('.splash-lang [data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.lang as LocaleCode;
      if (code === getLocale()) return;
      sfx.ui();
      setLocale(code);
    });
  });

  if (state.pendingChallenge) {
    queueMicrotask(() => {
      app.appendChild(
        modal(t('challenge.invite_title'), t('challenge.invite_body'), [
          {
            label: t('challenge.accept'),
            primary: true,
            onClick: () => {
              if (!game.acceptPendingChallenge()) {
                app.appendChild(
                  modal(t('challenge.need_team'), t('challenge.invite_body'), [
                    { label: t('common.ok'), primary: true, onClick: () => undefined },
                  ]),
                );
                return;
              }
              sfx.unlock();
              sfx.startAmbience();
            },
          },
          {
            label: t('challenge.decline'),
            onClick: () => game.dismissPendingChallenge(),
          },
        ]),
      );
    });
  }

  return menu;
}

function renderRank(
  ranks: { region: string; clears: number; you?: boolean }[],
): HTMLDivElement {
  const country = game.getState().country;
  const page = el('div', 'menu rank-page');
  page.innerHTML = `
    <div class="sheep-bubble small">${tileIconHtml('sheep')}</div>
    <h1>${t('rank.title')}</h1>
    <p class="tagline">${country ? t('rank.sub', [placeLabel(country)]) : t('rank.sub_default')}</p>
    <ol class="rank-list">
      ${ranks
        .map(
          (r, i) =>
            `<li class="${r.you ? 'you' : ''}"><span class="pos">${i + 1}</span><span class="name">${placeLabel(r.region)}</span><span class="score">${r.clears.toLocaleString()}</span></li>`,
        )
        .join('')}
    </ol>
    <button class="btn play" type="button" data-home>${t('rank.back')}</button>
  `;
  page.querySelector('[data-home]')!.addEventListener('click', () => game.goMenu());
  return page;
}

function renderTileBtn(
  tile: TileData,
  isTop: boolean,
  size: number,
  inPile: boolean,
): HTMLButtonElement {
  const def = TILE_DEFS[tile.type];
  const btn = el(
    'button',
    `tile${isTop ? ' top' : ' buried'}${inPile ? ' pile-tile' : ''}`,
  ) as HTMLButtonElement;
  btn.type = 'button';
  btn.style.width = `${size}px`;
  btn.style.height = `${size}px`;
  if (!inPile) {
    btn.style.left = `${tile.x}px`;
    btn.style.top = `${tile.y}px`;
    btn.style.zIndex = String(tile.layer + 1);
  }
  btn.style.setProperty('--tile-color', def.color);
  btn.disabled = !isTop;
  btn.setAttribute('aria-label', t(`tile.${tile.type}`));
  btn.innerHTML = `<span class="tile-face">${tileIconHtml(tile.type)}</span>`;
  btn.onclick = () => {
    void onTileClick(tile.uid, btn, size);
  };
  return btn;
}

function renderTutorial(): HTMLDivElement {
  const step = TUTORIAL_STEPS[Math.min(tutStep, TUTORIAL_STEPS.length - 1)];
  const overlay = el('div', `tut-overlay tut-${step.anchor ?? 'board'}`);
  overlay.innerHTML = `
    <div class="tut-card">
      <div class="tut-progress">${tutStep + 1}/${TUTORIAL_STEPS.length}</div>
      <h3>${tutTitle(step)}</h3>
      <p>${tutBody(step)}</p>
      <button type="button" class="btn primary tut-next">${
        tutStep >= TUTORIAL_STEPS.length - 1 ? t('tut.start') : t('tut.next')
      }</button>
      <button type="button" class="ghost-link tut-skip">${t('tut.skip')}</button>
    </div>
  `;
  overlay.querySelector('.tut-next')!.addEventListener('click', () => {
    sfx.ui();
    if (tutStep >= TUTORIAL_STEPS.length - 1) {
      markTutorialDone();
      tutStep = 0;
      render();
      return;
    }
    tutStep += 1;
    render();
  });
  overlay.querySelector('.tut-skip')!.addEventListener('click', () => {
    markTutorialDone();
    tutStep = 0;
    render();
  });
  return overlay;
}

function propButton(key: string, icon: string, left: number, kind: PropKind): HTMLButtonElement {
  const label = t(key);
  const btn = el('button', `btn prop${left <= 0 ? ' locked' : ''}`) as HTMLButtonElement;
  btn.type = 'button';
  btn.innerHTML = `<span class="prop-icon">${icon}</span><span class="prop-cn">${label}</span><em>${
    left > 0 ? `×${left}` : t('prop.share')
  }</em>`;
  btn.onclick = () => {
    sfx.unlock();
    if (left > 0) {
      if (kind === 'remove') void runRemoveProp();
      else if (kind === 'undo') void runUndoProp();
      else if (kind === 'shuffle') void runShuffleProp();
      return;
    }
    const overlay = modal(t('prop.unlock_title'), t('prop.unlock_body', [label]), [
      {
        label: t('prop.unlock_btn'),
        primary: true,
        onClick: () => {
          void shareGame().then(() => {
            game.unlockProp(kind);
            sfx.prop();
            void buzz('light');
          });
        },
      },
      { label: t('common.cancel'), onClick: () => undefined },
    ]);
    app.appendChild(overlay);
  };
  return btn;
}

function openSettings(): void {
  const muted = isMuted();
  const locale = getLocale();
  const overlay = el('div', 'modal-overlay');
  const card = el('div', 'modal');
  card.innerHTML = `
    <div class="modal-sheep">${tileIconHtml('sheep')}</div>
    <h2>${t('settings.title')}</h2>
    <p>${t('settings.hint')}</p>
    <div class="lang-row" role="group" aria-label="${t('settings.language')}">
      <button type="button" class="lang-btn${locale === 'en' ? ' active' : ''}" data-lang="en">${t('settings.lang.en')}</button>
      <button type="button" class="lang-btn${locale === 'zh' ? ' active' : ''}" data-lang="zh">${t('settings.lang.zh')}</button>
    </div>
    <div class="modal-actions settings-actions"></div>
  `;
  const row = card.querySelector('.settings-actions')!;
  const muteBtn = el('button', 'btn primary', muted ? t('settings.mute_off') : t('settings.mute_on'));
  muteBtn.onclick = () => {
    const nowMuted = toggleMuted();
    if (nowMuted) sfx.stopAmbience();
    else {
      sfx.unlock();
      sfx.startAmbience();
      sfx.ui();
    }
    muteBtn.textContent = nowMuted ? t('settings.mute_off') : t('settings.mute_on');
  };
  const restartBtn = el('button', 'btn ghost', t('settings.restart'));
  restartBtn.onclick = () => {
    overlay.remove();
    sfx.ui();
    game.restart();
  };
  const homeBtn = el('button', 'btn ghost', t('settings.home'));
  homeBtn.onclick = () => {
    overlay.remove();
    sfx.stopAmbience();
    game.goMenu();
  };
  const closeBtn = el('button', 'btn ghost', t('common.close'));
  closeBtn.onclick = () => overlay.remove();
  row.append(muteBtn, restartBtn, homeBtn, closeBtn);

  card.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((btn) => {
    btn.onclick = () => {
      const code = btn.dataset.lang as LocaleCode;
      sfx.ui();
      setLocale(code);
      overlay.remove();
      openSettings();
    };
  });

  overlay.appendChild(card);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  app.appendChild(overlay);
}

function modal(
  title: string,
  body: string,
  buttons: { label: string; primary?: boolean; onClick: () => void }[],
): HTMLDivElement {
  const overlay = el('div', 'modal-overlay');
  const card = el('div', 'modal');
  card.innerHTML = `<div class="modal-sheep">${tileIconHtml('sheep')}</div><h2>${title}</h2><p>${body}</p>`;
  const actions = el('div', 'modal-actions');
  for (const b of buttons) {
    const btn = el('button', b.primary ? 'btn primary' : 'btn ghost', b.label);
    btn.onclick = () => {
      overlay.remove();
      b.onClick();
    };
    actions.appendChild(btn);
  }
  card.appendChild(actions);
  overlay.appendChild(card);
  return overlay;
}

syncPlaces();
applyDocumentLocale();
game.subscribe(render);
onLocaleChange(() => render());
render();
