// Visual effects. Pure decoration: every effect is skipped with prefers-reduced-motion,
// and the ember sky pauses when the tab is hidden (cheap on low-end phones).
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Floating embers rising from the altar into the night sky. */
export function startEmbers(canvas) {
  if (!canvas || reduce()) return;
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  const embers = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const spawn = (y) => ({
    x: Math.random() * w, y: y ?? h + 10, r: 0.6 + Math.random() * 1.8,
    vy: 0.15 + Math.random() * 0.45, sway: Math.random() * Math.PI * 2, life: 0.4 + Math.random() * 0.6,
    hue: 22 + Math.random() * 22,
  });
  resize();
  const count = Math.round(Math.min(55, Math.max(18, (w * h) / 26000)));
  for (let i = 0; i < count; i++) embers.push(spawn(Math.random() * h));
  addEventListener('resize', resize);

  let raf = 0;
  const tick = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (const e of embers) {
      e.y -= e.vy;
      e.sway += 0.012;
      const x = e.x + Math.sin(e.sway) * 14;
      const fade = Math.min(1, e.y / (h * 0.9)) * e.life * (0.75 + 0.25 * Math.sin(t / 300 + e.sway * 3));
      if (e.y < -10) Object.assign(e, spawn());
      const g = ctx.createRadialGradient(x, e.y, 0, x, e.y, e.r * 4);
      g.addColorStop(0, `hsla(${e.hue}, 100%, 70%, ${fade})`);
      g.addColorStop(1, `hsla(${e.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, e.y, e.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(tick);
  });
}

/** A burst of sparks from an element (correct answer, word added to the altar). */
export function burst(target, n = 18) {
  if (!target || reduce()) return;
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = 40 + Math.random() * 70;
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d - 30}px`);
    s.style.animationDelay = `${Math.random() * 80}ms`;
    document.body.append(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }
}

/** Shake an element (wrong answer). */
export function shake(target) {
  if (!target || reduce()) return;
  target.classList.remove('shake');
  void target.offsetWidth;
  target.classList.add('shake');
}

/** Count a number up from 0 (vitality). */
export function countUp(node, to, suffix = '%') {
  if (!node) return;
  if (reduce() || to === 0) { node.textContent = `${to}${suffix}`; return; }
  const start = performance.now();
  const dur = 900;
  const step = (t) => {
    const p = Math.min(1, (t - start) / dur);
    node.textContent = `${Math.round(to * (1 - Math.pow(1 - p, 3)))}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Replay the view entrance animation. */
export function enter(main) {
  if (reduce()) return;
  main.classList.remove('view-enter');
  void main.offsetWidth;
  main.classList.add('view-enter');
}
