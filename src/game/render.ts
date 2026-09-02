import {
  GRID,
  intervalOf,
  type Dir,
  type World,
  type Particle,
  type FloatText,
} from "./core";

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const DIRV: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface DrawOpts {
  reduced: boolean;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------- fx helpers (mutate world) ---------------- */

const cellOf = (w: World) => (w.size ? w.size / GRID : 20);
const px = (w: World, cell: number) => (cell + 0.5) * cellOf(w);

export function spawnBurst(
  w: World,
  cx: number,
  cy: number,
  colors: string[],
  n: number,
  power = 1
): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const sp = (0.8 + Math.random() * 2.1) * power;
    w.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 0.6,
      life: 420 + Math.random() * 260,
      max: 680,
      r: 1.6 + Math.random() * 2.6,
      color: colors[i % colors.length],
    });
  }
}

export function spawnFloat(w: World, cellX: number, cellY: number, text: string): void {
  w.floats.push({ x: px(w, cellX), y: px(w, cellY), text, age: 0, max: 760 });
}

export function stepFx(w: World, dt: number): void {
  w.shake = Math.max(0, w.shake - dt);
  w.flash = Math.max(0, w.flash - dt * 1.15);
  const f = dt / 16.6;
  for (let i = w.particles.length - 1; i >= 0; i--) {
    const p: Particle = w.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      w.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * f;
    p.y += p.vy * f;
    p.vx *= 0.93;
    p.vy = p.vy * 0.93 + 0.045 * f;
  }
  for (let i = w.floats.length - 1; i >= 0; i--) {
    const t: FloatText = w.floats[i];
    t.age += dt;
    if (t.age >= t.max) w.floats.splice(i, 1);
  }
}

/* ---------------- draw ---------------- */

export function draw(
  ctx: CanvasRenderingContext2D,
  w: World,
  now: number,
  opts: DrawOpts
): void {
  const size = w.size;
  if (!size) return;
  const cell = size / GRID;

  ctx.setTransform(w.dpr, 0, 0, w.dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.save();

  if (w.shake > 0 && !opts.reduced) {
    const m = (w.shake / 360) * 4;
    ctx.translate((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m);
  }

  // board base
  rr(ctx, 0, 0, size, size, 18);
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, "#122119");
  bg.addColorStop(1, "#0a150f");
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  ctx.clip();

  // subtle checkerboard
  ctx.fillStyle = "rgba(226,244,234,0.02)";
  for (let y = 0; y < GRID; y++)
    for (let x = y % 2; x < GRID; x += 2)
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);

  // top sheen
  const sheen = ctx.createLinearGradient(0, 0, 0, cell * 2.4);
  sheen.addColorStop(0, "rgba(255,255,255,0.035)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, cell * 2.4);

  // vignette
  const vg = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.32,
    size / 2, size / 2, size * 0.8
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(2,8,5,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, size, size);

  drawFood(ctx, w, cell, now, opts);
  drawSnake(ctx, w, cell, now, opts);
  drawParticles(ctx, w);
  drawFloats(ctx, w, cell);

  ctx.restore();

  // hairline inner border
  rr(ctx, 0.5, 0.5, size - 1, size - 1, 18);
  ctx.strokeStyle = "rgba(148,226,179,0.13)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  w: World,
  cell: number,
  now: number,
  opts: DrawOpts
): void {
  const fx = (w.food.x + 0.5) * cell;
  const fy = (w.food.y + 0.5) * cell;
  const pulse = opts.reduced ? 0 : Math.sin(now / 260);
  const r = cell * 0.3 * (1 + 0.05 * pulse);

  // glow
  const glowR = cell * (1.05 + 0.09 * pulse);
  const gg = ctx.createRadialGradient(fx, fy, r * 0.2, fx, fy, glowR);
  gg.addColorStop(0, "rgba(255,110,80,0.3)");
  gg.addColorStop(1, "rgba(255,110,80,0)");
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(fx, fy, glowR, 0, TAU);
  ctx.fill();

  // body
  const body = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r);
  body.addColorStop(0, "#ff9d80");
  body.addColorStop(1, "#ee4e2d");
  ctx.beginPath();
  ctx.arc(fx, fy, r, 0, TAU);
  ctx.fillStyle = body;
  ctx.fill();

  // highlight
  ctx.beginPath();
  ctx.arc(fx - r * 0.32, fy - r * 0.34, r * 0.26, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();

  // stem + leaf
  ctx.strokeStyle = "#7a4a2f";
  ctx.lineWidth = Math.max(1, cell * 0.05);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fx, fy - r * 0.9);
  ctx.lineTo(fx + r * 0.12, fy - r - cell * 0.09);
  ctx.stroke();

  ctx.save();
  ctx.translate(fx + r * 0.3, fy - r - cell * 0.06);
  ctx.rotate(-0.55);
  ctx.beginPath();
  ctx.ellipse(0, 0, cell * 0.13, cell * 0.055, 0, 0, TAU);
  ctx.fillStyle = "#3fbf7f";
  ctx.fill();
  ctx.restore();
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  w: World,
  cell: number,
  now: number,
  opts: DrawOpts
): void {
  if (!w.segments.length) return;

  const t =
    w.phase === "playing" ? clamp01(w.acc / intervalOf(w)) : 1;

  const pts = w.segments.map((s, i) => {
    const p = w.prev[Math.min(i, w.prev.length - 1)] ?? s;
    return {
      x: (p.x + (s.x - p.x) * t + 0.5) * cell,
      y: (p.y + (s.y - p.y) * t + 0.5) * cell,
    };
  });

  const dead = w.phase === "over";
  const fade = dead
    ? 0.42 + 0.58 * clamp01(1 - (now - w.deadAt) / 700)
    : 1;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };

  // under-stroke (dark rim)
  trace();
  ctx.strokeStyle = dead ? "#28463a" : "#0d3d27";
  ctx.lineWidth = cell * 0.72;
  ctx.stroke();

  // lit body, gradient head → tail
  const tail = pts[pts.length - 1];
  const g = ctx.createLinearGradient(pts[0].x, pts[0].y, tail.x, tail.y);
  if (dead) {
    g.addColorStop(0, "#84a896");
    g.addColorStop(1, "#4c6d5c");
  } else {
    g.addColorStop(0, "#96f3c0");
    g.addColorStop(1, "#2ba46a");
  }
  trace();
  ctx.strokeStyle = g;
  ctx.lineWidth = cell * 0.46;
  ctx.stroke();

  // head
  const hp = pts[0];
  const d = DIRV[w.dir];
  if (w.flash > 0 && !dead) {
    ctx.shadowColor = "rgba(150,243,192,0.9)";
    ctx.shadowBlur = (w.flash / 220) * 22;
  }
  ctx.beginPath();
  ctx.arc(hp.x, hp.y, cell * 0.42, 0, TAU);
  ctx.fillStyle = dead ? "#9fbca9" : "#c9f8de";
  ctx.fill();
  ctx.shadowBlur = 0;

  // eyes — orientation cue + blink; crossed out on death
  const perp = { x: -d.y, y: d.x };
  const eo = cell * 0.14;
  const es = cell * 0.175;
  const er = cell * 0.115;
  const blink = !opts.reduced && !dead && now % 3800 > 3655;

  for (const s of [-1, 1]) {
    const ex = hp.x + d.x * eo + perp.x * es * s;
    const ey = hp.y + d.y * eo + perp.y * es * s;
    if (dead) {
      ctx.strokeStyle = "#1d3a2d";
      ctx.lineWidth = Math.max(1, cell * 0.05);
      const k = er * 0.75;
      ctx.beginPath();
      ctx.moveTo(ex - k, ey - k);
      ctx.lineTo(ex + k, ey + k);
      ctx.moveTo(ex + k, ey - k);
      ctx.lineTo(ex - k, ey + k);
      ctx.stroke();
    } else if (blink) {
      ctx.strokeStyle = "#1d3a2d";
      ctx.lineWidth = Math.max(1, cell * 0.05);
      ctx.beginPath();
      ctx.moveTo(ex - perp.x * er, ey - perp.y * er);
      ctx.lineTo(ex + perp.x * er, ey + perp.y * er);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, TAU);
      ctx.fillStyle = "#f4fbf7";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + d.x * cell * 0.04, ey + d.y * cell * 0.04, cell * 0.058, 0, TAU);
      ctx.fillStyle = "#123123";
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.particles.length) return;
  ctx.save();
  for (const p of w.particles) {
    const a = clamp01(p.life / p.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.4, p.r * a), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloats(ctx: CanvasRenderingContext2D, w: World, cell: number): void {
  if (!w.floats.length) return;
  ctx.save();
  ctx.font = `700 ${Math.max(11, Math.round(cell * 0.58))}px Unbounded, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 6;
  for (const f of w.floats) {
    const k = clamp01(f.age / f.max);
    ctx.globalAlpha = 1 - k * k;
    ctx.fillStyle = "#ffd08a";
    ctx.fillText(f.text, f.x, f.y - k * cell * 1.2);
  }
  ctx.restore();
}
