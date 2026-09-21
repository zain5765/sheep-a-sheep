/** DOM visual FX: particles, shakes, bursts, shuffle flip. */

export function burstAt(x: number, y: number, count = 14): void {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'fx-particle';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 28 + Math.random() * 42;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    p.style.background = ['#ffe566', '#fff', '#8fbf6a', '#ff8a65', '#81d4fa'][i % 5];
    document.body.appendChild(p);
    window.setTimeout(() => p.remove(), 520);
  }
}

export function shake(el: Element | null, ms = 420): void {
  if (!el) return;
  el.classList.add('fx-shake');
  window.setTimeout(() => el.classList.remove('fx-shake'), ms);
}

export function pulse(el: Element | null): void {
  if (!el) return;
  el.classList.add('fx-pulse');
  window.setTimeout(() => el.classList.remove('fx-pulse'), 280);
}

export function shuffleBoard(board: Element | null): Promise<void> {
  return new Promise((resolve) => {
    if (!board) {
      resolve();
      return;
    }
    board.classList.add('fx-shuffle');
    window.setTimeout(() => {
      board.classList.remove('fx-shuffle');
      resolve();
    }, 380);
  });
}

export function confetti(): void {
  const w = window.innerWidth;
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('div');
    p.className = 'fx-confetti';
    p.style.left = `${Math.random() * w}px`;
    p.style.top = `${-20 - Math.random() * 40}px`;
    p.style.setProperty('--fall', `${60 + Math.random() * 40}vh`);
    p.style.setProperty('--spin', `${360 + Math.random() * 720}deg`);
    p.style.background = ['#ffe566', '#ef5350', '#66bb6a', '#42a5f5', '#ab47bc', '#fff'][i % 6];
    p.style.animationDuration = `${1.2 + Math.random() * 0.9}s`;
    document.body.appendChild(p);
    window.setTimeout(() => p.remove(), 2200);
  }
}

export function flyBetween(
  from: DOMRect,
  to: DOMRect,
  html: string,
  size: number,
  ms = 240,
): Promise<void> {
  return new Promise((resolve) => {
    const ghost = document.createElement('div');
    ghost.className = 'fly-tile';
    ghost.style.width = `${size}px`;
    ghost.style.height = `${size}px`;
    ghost.style.left = `${from.left}px`;
    ghost.style.top = `${from.top}px`;
    ghost.innerHTML = html;
    document.body.appendChild(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    requestAnimationFrame(() => {
      ghost.style.transitionDuration = `${ms}ms`;
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.75)`;
      ghost.style.opacity = '0.3';
    });
    window.setTimeout(() => {
      ghost.remove();
      resolve();
    }, ms + 20);
  });
}
