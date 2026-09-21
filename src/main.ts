import './style.css';
import { Game, type PropKind } from './game/Game';
import { MAX_SLOTS, REGIONS, TILE_DEFS, type RegionId } from './game/config';
import { tileIconHtml } from './game/icons';
import type { TileData } from './game/types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const game = new Game();

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

function render(): void {
  const state = game.getState();
  app.innerHTML = '';

  if (state.screen === 'menu') {
    app.appendChild(renderMenu(state.region));
    return;
  }
  if (state.screen === 'rank') {
    app.appendChild(renderRank(state.ranks));
    return;
  }

  const shell = el('div', 'shell game-shell');

  const top = el('div', 'game-top');
  top.innerHTML = `
    <button class="icon-btn" type="button" data-act="home" aria-label="Home">⌂</button>
    <div class="level-badge">
      <strong>${state.level.name}</strong>
      <span>${state.level.subtitle}</span>
    </div>
    <div class="progress-pill">${state.total - state.remaining}/${state.total}</div>
  `;
  top.querySelector('[data-act="home"]')!.addEventListener('click', () => game.goMenu());

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
    .filter((t) => !t.removed && !t.inSlot && t.pile < 0 && !t.inHold)
    .sort((a, b) => a.layer - b.layer || a.uid - b.uid);
  for (const tile of boardTiles) {
    board.appendChild(
      renderTileBtn(tile, state.clickable.get(tile.uid) === true, state.level.tileSize, false),
    );
  }
  boardWrap.appendChild(board);
  stage.append(leftPiles, boardWrap, rightPiles);

  const hold = el('div', 'hold-row');
  hold.innerHTML = `<span class="hold-label">Hold</span>`;
  const holdSlots = el('div', 'hold-slots');
  for (let i = 0; i < 3; i++) {
    const slot = el('div', 'hold-slot');
    const item = state.hold[i];
    if (item) {
      const def = TILE_DEFS[item.type];
      slot.classList.add('filled');
      slot.style.setProperty('--tile-color', def.color);
      slot.innerHTML = `<button type="button" class="hold-tile">${tileIconHtml(item.type)}</button>`;
      slot.querySelector('button')!.addEventListener('click', () => game.clickTile(item.uid));
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
      slot.style.setProperty('--tile-color', def.color);
      slot.innerHTML = tileIconHtml(item.type);
    }
    slotsRow.appendChild(slot);
  }
  tray.appendChild(slotsRow);

  const props = el('div', 'props');
  props.append(
    propButton('Undo', '↩', state.undoLeft, 'undo'),
    propButton('Shuffle', '⟳', state.shuffleLeft, 'shuffle'),
    propButton('Remove', '⬆', state.removeLeft, 'remove'),
  );

  shell.append(top, stage, hold, tray, props);

  if (state.status === 'won') {
    const isLast = state.levelIndex >= 1;
    shell.appendChild(
      modal(
        isLast ? 'You cleared Level 2!' : 'Level 1 cleared!',
        isLast
          ? 'Only ~0.1% make it this far. Challenge a friend!'
          : 'That was the warm-up. Level 2 is the real challenge.',
        isLast
          ? [
              { label: 'Play again', primary: true, onClick: () => game.startGame() },
              { label: 'Home', onClick: () => game.goMenu() },
            ]
          : [
              { label: 'Enter Level 2', primary: true, onClick: () => game.nextLevel() },
              { label: 'Replay Level 1', onClick: () => game.restart() },
            ],
      ),
    );
  }

  if (state.status === 'lost') {
    shell.appendChild(
      modal(
        'Tray is full!',
        'Same as the original: 7 slots filled = fail. Watch an ad to revive (moves 3 tiles to Hold).',
        [
          ...(state.reviveLeft > 0
            ? [
                {
                  label: 'Watch ad to revive',
                  primary: true,
                  onClick: () => simulateAdThen(() => game.revive()),
                },
              ]
            : []),
          { label: 'Try again', onClick: () => game.restart() },
          { label: 'Home', onClick: () => game.goMenu() },
        ],
      ),
    );
  }

  app.appendChild(shell);
}

function renderMenu(region: RegionId | null): HTMLDivElement {
  const menu = el('div', 'menu');
  menu.innerHTML = `
    <div class="flock" aria-hidden="true"></div>
    <div class="menu-hero">
      <div class="sheep-bubble">${tileIconHtml('sheep')}</div>
      <h1>Sheep a Sheep</h1>
      <p class="tagline">Level 1 easy · Level 2 almost impossible</p>
      <p class="hint">Match 3 in the 7-slot tray. Plan ahead — success = order + props + 999 tries.</p>
    </div>
    <label class="region-label" for="region">Your team needs you</label>
    <select id="region" class="region-select">
      <option value="">Pick your region…</option>
      ${REGIONS.map((r) => `<option value="${r}" ${region === r ? 'selected' : ''}>${r}</option>`).join('')}
    </select>
    ${region ? `<div class="team-bar">Playing for <strong>${region}</strong></div>` : ''}
    <button class="btn play" type="button">Start Game</button>
    <button class="ghost-link" type="button" data-rank>Region clears</button>
  `;
  menu.querySelector<HTMLSelectElement>('#region')!.addEventListener('change', (e) => {
    const v = (e.target as HTMLSelectElement).value as RegionId | '';
    if (v) game.setRegion(v);
  });
  menu.querySelector('.play')!.addEventListener('click', () => {
    if (!game.getState().region) {
      app.appendChild(
        modal('Pick a region first', 'Join a team like the original province challenge.', [
          { label: 'OK', primary: true, onClick: () => undefined },
        ]),
      );
      return;
    }
    game.startGame();
  });
  menu.querySelector('[data-rank]')!.addEventListener('click', () => game.goRank());
  return menu;
}

function renderRank(
  ranks: { region: string; clears: number; you?: boolean }[],
): HTMLDivElement {
  const page = el('div', 'menu rank-page');
  page.innerHTML = `
    <div class="sheep-bubble small">${tileIconHtml('sheep')}</div>
    <h1>Region clears</h1>
    <p class="tagline">Your province / state team needs you</p>
    <ol class="rank-list">
      ${ranks
        .map(
          (r, i) =>
            `<li class="${r.you ? 'you' : ''}"><span class="pos">${i + 1}</span><span class="name">${r.region}</span><span class="score">${r.clears}</span></li>`,
        )
        .join('')}
    </ol>
    <button class="btn play" type="button" data-home>Back Home</button>
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
  btn.setAttribute('aria-label', def.label);
  btn.innerHTML = `<span class="tile-face">${tileIconHtml(tile.type)}</span>`;
  btn.onclick = () => game.clickTile(tile.uid);
  return btn;
}

function propButton(label: string, icon: string, left: number, kind: PropKind): HTMLButtonElement {
  const btn = el('button', `btn prop${left <= 0 ? ' locked' : ''}`) as HTMLButtonElement;
  btn.type = 'button';
  btn.innerHTML = `<span class="prop-icon">${icon}</span><span>${label}</span><em>${left > 0 ? `×${left}` : 'Share'}</em>`;
  btn.onclick = () => {
    if (left > 0) {
      if (kind === 'undo') game.undo();
      if (kind === 'shuffle') game.shuffle();
      if (kind === 'remove') game.removeProp();
      return;
    }
    const overlay = modal(
      'Share to unlock',
      `Share Sheep a Sheep with a friend to get 1× ${label} (same rule as the original).`,
      [
        {
          label: 'Share & unlock',
          primary: true,
          onClick: () => {
            const text = 'Can you clear Level 2 of Sheep a Sheep? Only 0.1% can!';
            if (navigator.share) {
              navigator.share({ title: 'Sheep a Sheep', text }).catch(() => undefined);
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(text).catch(() => undefined);
            }
            game.unlockProp(kind);
          },
        },
        { label: 'Cancel', onClick: () => undefined },
      ],
    );
    app.appendChild(overlay);
  };
  return btn;
}

function simulateAdThen(done: () => void): void {
  const overlay = modal('Watching ad…', 'Ad placeholder (3 sec) — then you revive.', []);
  app.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
    done();
  }, 3000);
}

function modal(
  title: string,
  body: string,
  buttons: { label: string; primary?: boolean; onClick: () => void }[],
): HTMLDivElement {
  const overlay = el('div', 'modal-overlay');
  const card = el('div', 'modal');
  card.innerHTML = `<div class="modal-sheep">${tileIconHtml('sheep')}</div><h2>${title}</h2><p>${body}</p>`;
  const row = el('div', 'modal-actions');
  for (const b of buttons) {
    const btn = el('button', b.primary ? 'btn primary' : 'btn ghost', b.label);
    btn.onclick = () => {
      overlay.remove();
      b.onClick();
    };
    row.appendChild(btn);
  }
  card.appendChild(row);
  overlay.appendChild(card);
  return overlay;
}

game.subscribe(render);
render();
