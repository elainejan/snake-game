import { GRID, intervalOf, type Dir, type Point, type World } from "./core";

const DIRS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface DrawOpts {
  reduced: boolean;
}

/** Board colors resolve from CSS custom properties each frame, so the
 *  arena re-themes instantly when the page theme flips. */
interface Theme {
  bg: string;
  grid: string;
  shade: string;
  mint: string;
  mintDeep: string;
  coral: string;
  appleGlow: string;
}

const themeOf = (el: HTMLCanvasElement): Theme => {
  const cs = getComputedStyle(el);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    bg: v("--board-bg") || "#101d16",
    grid: v("--grid-line") || "rgba(148,226,179,0.05)",
    shade: v("--board-shade") || "rgba(0,0,0,0.16)",
    mint: v("--mint") || "#6fe3a5",
    mintDeep: v("--mint-deep") || "#2e8f60",
    coral: v("--coral") || "#ff7a5c",
    appleGlow: v("--apple-glow") || "rgba(255,122,92,0.22)",
  };
};

/* ---------------- fx helpers (mutate world) ---------------- */

export const spawnBurst = (
  w: World,
  x: number,
  y: number,
  colors: string[],
  count: number,
  speed = 1
): void => {
  const cell = w.size ? w.size / GRID : 20;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = cell * (2.2 + Math.random() * 4.6) * speed;
    w.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 380 + Math.random() * 420,
      max: 800,
      r: cell * (0.06 + Math.random() * 0.11),
      color: colors[i % colors.length],
    });
  }
};

export const spawnFloat = (w: World, gx: number, gy: number, text: string): void => {
  w.floats.push({ x: gx, y: gy, text, age: 0, max: 800 });
};

/** Advances particles, floats, shake and flash. dt is in ms. */
export const stepFx = (w: World, dt: number): void => {
  const s = Math.min(50, dt) / 1000;
  for (const p of w.particles) {
    p.x += p.vx * s;
    p.y += p.vy * s;
    p.vx *= 1 - 2.4 * s;
    p.vy *= 1 - 2.4 * s;
    p.life -= dt;
  }
  w.particles = w.particles.filter((p) => p.life > 0);
  for (const f of w.floats) f.age += dt;
  w.floats = w.floats.filter((f) => f.age < f.max);
  w.shake = Math.max(0, w.shake - dt);
  w.flash = Math.max(0, w.flash - dt);
};

/* ---------------- draw ---------------- */

export const draw = (
  ctx: CanvasRenderingContext2D,
  w: World,
  now: number,
  opts: DrawOpts
): void => {
  const S = w.size;
  if (!S) return;
  const reduced = opts.reduced;
  const cell = S / GRID;
  const cx = (p: Point) => p.x * cell + cell / 2;
  const cy = (p: Point) => p.y * cell + cell / 2;
  const th = themeOf(ctx.canvas);
  const ft = now / 1000;

  ctx.setTransform(w.dpr, 0, 0, w.dpr, 0, 0);
  if (w.shake > 0 && !reduced) {
    const k = w.shake / 360;
    const m = k * k * 8;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  /* board surface */
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = th.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < GRID; i++) {
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, S);
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(S, i * cell + 0.5);
  }
  ctx.stroke();

  /* ---------- food ---------- */
  const pulse = reduced ? 1 : 1 + Math.sin(ft * 3.4) * 0.07;
  const fx = cx(w.food);
  const fy = cy(w.food) + (reduced ? 0 : Math.sin(ft * 2.2) * cell * 0.05);
  const R = cell * 0.31 * pulse;

  const glow = ctx.createRadialGradient(fx, fy, R * 0.2, fx, fy, R * 3);
  glow.addColorStop(0, th.appleGlow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(fx, fy, R * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = th.coral;
  ctx.beginPath();
  ctx.arc(fx, fy, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(fx - R * 0.34, fy - R * 0.36, R * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = th.mint;
  ctx.beginPath();
  ctx.ellipse(fx + R * 0.34, fy - R * 1.22, R * 0.5, R * 0.26, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = th.mintDeep;
  ctx.lineWidth = Math.max(1.5, cell * 0.07);
  ctx.beginPath();
  ctx.moveTo(fx, fy - R * 0.9);
  ctx.lineTo(fx + R * 0.06, fy - R * 1.35);
  ctx.stroke();

  /* ---------- snake ---------- */
  let alpha = 0;
  if (w.phase === "playing") {
    alpha = Math.max(0, Math.min(1, w.acc / intervalOf(w)));
  } else if (w.phase === "over") {
    alpha = Math.max(0, Math.min(1, (now - w.deadAt) / 130));
  }

  const pts = w.segments.map((seg, i) => {
    const p = w.prev[i] ?? seg;
    const raw = {
      x: p.x + (seg.x - p.x) * alpha,
      y: p.y + (seg.y - p.y) * alpha,
    };
    const lead =
      i === 0 && (w.phase === "paused" || w.phase === "ready") ? DIRS[w.dir] : { x: 0, y: 0 };
    return {
      x: (raw.x + lead.x * 0.32) * cell + cell / 2,
      y: (raw.y + lead.y * 0.32) * cell + cell / 2,
    };
  });

  const g = ctx.createLinearGradient(
    pts[0].x,
    pts[0].y,
    pts[pts.length - 1].x,
    pts[pts.length - 1].y
  );
  g.addColorStop(0, th.mint);
  g.addColorStop(1, th.mintDeep);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  /* separation outline */
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = cell * 0.82;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  /* body */
  ctx.strokeStyle = g;
  ctx.lineWidth = cell * 0.7;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  /* head: eyes + gaze */
  const h = pts[0];
  const d = DIRS[w.dir];
  const px = -d.y;
  const py = d.x;
  const eyeR = cell * 0.105;
  const dead = w.phase === "over";
  const blink = reduced || dead ? 0 : Math.max(0, Math.sin(ft * 0.9) - 0.965) / 0.035;

  for (const sgn of [-1, 1]) {
    const ex = h.x + d.x * cell * 0.16 + px * sgn * cell * 0.18;
    const ey = h.y + d.y * cell * 0.16 + py * sgn * cell * 0.18;
    const er = eyeR * (1 - 0.85 * blink);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fill();
    if (!dead && blink < 0.75) {
      ctx.fillStyle = "#10231a";
      ctx.beginPath();
      ctx.arc(ex + d.x * eyeR * 0.42, ey + d.y * eyeR * 0.42, eyeR * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (dead) {
    ctx.strokeStyle = "#10231a";
    ctx.lineWidth = Math.max(1.4, cell * 0.06);
    for (const sgn of [-1, 1]) {
      const ex = h.x + d.x * cell * 0.16 + px * sgn * cell * 0.18;
      const ey = h.y + d.y * cell * 0.16 + py * sgn * cell * 0.18;
      const k = eyeR * 0.6;
      ctx.beginPath();
      ctx.moveTo(ex - k, ey - k);
      ctx.lineTo(ex + k, ey + k);
      ctx.moveTo(ex + k, ey - k);
      ctx.lineTo(ex - k, ey + k);
      ctx.stroke();
    }
  }

  /* ---------- particles ---------- */
  for (const p of w.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.r * (p.life / p.max)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* ---------- floating score text ---------- */
  for (const f of w.floats) {
    const k = Math.min(1, f.age / f.max);
    ctx.globalAlpha = 1 - k * k;
    ctx.fillStyle = th.mint;
    ctx.font = `700 ${Math.round(cell * 0.62)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const rise = reduced ? 0 : k * cell * 1.3;
    ctx.fillText(f.text, cx({ x: f.x, y: f.y }), cy({ x: f.x, y: f.y }) - rise);
  }
  ctx.globalAlpha = 1;

  /* vignette */
  const v = ctx.createRadialGradient(S / 2, S / 2, S * 0.38, S / 2, S / 2, S * 0.74);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, th.shade);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, S, S);

  if (w.flash > 0) {
    ctx.fillStyle = `rgba(242,90,80,${(0.28 * (w.flash / 220)).toFixed(3)})`;
    ctx.fillRect(0, 0, S, S);
  }
};
