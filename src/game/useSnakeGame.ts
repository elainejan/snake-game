import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  GRID,
  POINTS,
  createWorld,
  intervalOf,
  isOpposite,
  randomFood,
  resetRun,
  saveBest,
  saveDifficulty,
  saveGames,
  speedFactor,
  type Difficulty,
  type Dir,
  type Phase,
  type World,
} from "./core";
import { draw, spawnBurst, spawnFloat, stepFx } from "./render";
import type { SoundFX } from "./audio";

export interface UIState {
  phase: Phase;
  score: number;
  foods: number;
  length: number;
  difficulty: Difficulty;
  best: number;
  bests: Record<Difficulty, number>;
  newBest: boolean;
  gamesPlayed: number;
  speed: number;
}

const DIR_KEYS: Record<string, Dir> = {
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

export function useSnakeGame(soundRef: RefObject<SoundFX | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const world = useRef<World>(null as unknown as World);
  if (world.current === null) world.current = createWorld();

  const reducedRef = useRef(
    typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [ui, setUi] = useState<UIState>(() => {
    const w = world.current;
    return {
      phase: w.phase,
      score: w.score,
      foods: w.foods,
      length: w.segments.length,
      difficulty: w.difficulty,
      best: w.best,
      bests: { ...w.bests },
      newBest: w.newBest,
      gamesPlayed: w.gamesPlayed,
      speed: 1,
    };
  });

  const syncUi = useCallback(() => {
    const w = world.current;
    setUi({
      phase: w.phase,
      score: w.score,
      foods: w.foods,
      length: w.segments.length,
      difficulty: w.difficulty,
      best: w.best,
      bests: { ...w.bests },
      newBest: w.newBest,
      gamesPlayed: w.gamesPlayed,
      speed: Math.round(speedFactor(w) * 100) / 100,
    });
  }, []);

  /* ---------------- gameplay ---------------- */

  const die = useCallback(() => {
    const w = world.current;
    w.phase = "over";
    w.shake = reducedRef.current ? 0 : 360;
    w.deadAt = performance.now();
    w.acc = 0;
    w.queue = [];
    w.gamesPlayed += 1;
    saveGames(w.gamesPlayed);
    if (!reducedRef.current && w.size) {
      const cell = w.size / GRID;
      spawnBurst(
        w,
        (w.segments[0].x + 0.5) * cell,
        (w.segments[0].y + 0.5) * cell,
        ["#9fbca9", "#6d8f7d", "#c9f8de"],
        16,
        1.1
      );
    }
    soundRef.current?.over();
    syncUi();
  }, [soundRef, syncUi]);

  const eat = useCallback(() => {
    const w = world.current;
    w.foods += 1;
    w.score += POINTS;
    w.flash = 220;
    soundRef.current?.eat();

    const cell = w.size ? w.size / GRID : 0;
    if (cell) {
      const fx = (w.food.x + 0.5) * cell;
      const fy = (w.food.y + 0.5) * cell;
      if (!reducedRef.current)
        spawnBurst(w, fx, fy, ["#ff8a68", "#ffd08a", "#96f3c0"], 13);
      spawnFloat(w, w.food.x, w.food.y, `+${POINTS}`);
    }

    if (w.score > w.best) {
      if (!w.newBest) {
        w.newBest = true;
        soundRef.current?.best();
        if (cell && !reducedRef.current) {
          spawnBurst(
            w,
            (w.segments[0].x + 0.5) * cell,
            (w.segments[0].y + 0.5) * cell,
            ["#f2c86f", "#ffe3a3", "#96f3c0"],
            22,
            1.3
          );
        }
      }
      w.best = w.score;
      w.bests[w.difficulty] = w.score;
      saveBest(w.difficulty, w.score);
    }

    w.food = randomFood(w.segments);
    syncUi();
  }, [soundRef, syncUi]);

  const tick = useCallback(() => {
    const w = world.current;
    if (w.queue.length) w.dir = w.queue.shift() as Dir;

    const head = w.segments[0];
    const dv =
      w.dir === "up"
        ? { x: 0, y: -1 }
        : w.dir === "down"
          ? { x: 0, y: 1 }
          : w.dir === "left"
            ? { x: -1, y: 0 }
            : { x: 1, y: 0 };
    const nx = head.x + dv.x;
    const ny = head.y + dv.y;

    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
      die();
      return;
    }

    const growing = nx === w.food.x && ny === w.food.y;
    const lastIdx = w.segments.length - 1;
    for (let i = 0; i < w.segments.length; i++) {
      if (!growing && i === lastIdx) continue; // tail vacates its cell
      const s = w.segments[i];
      if (s.x === nx && s.y === ny) {
        die();
        return;
      }
    }

    w.prev = w.segments.map((p) => ({ ...p }));
    w.segments.unshift({ x: nx, y: ny });
    if (growing) eat();
    else w.segments.pop();
  }, [die, eat]);

  /* ---------------- public actions ---------------- */

  const start = useCallback(() => {
    const w = world.current;
    resetRun(w);
    w.phase = "playing";
    soundRef.current?.unlock();
    soundRef.current?.start();
    syncUi();
  }, [soundRef, syncUi]);

  const toReady = useCallback(() => {
    const w = world.current;
    resetRun(w);
    w.phase = "ready";
    syncUi();
  }, [syncUi]);

  const pause = useCallback(() => {
    const w = world.current;
    if (w.phase !== "playing") return;
    w.phase = "paused";
    w.acc = 0;
    soundRef.current?.pause();
    syncUi();
  }, [soundRef, syncUi]);

  const resume = useCallback(() => {
    const w = world.current;
    if (w.phase !== "paused") return;
    w.phase = "playing";
    soundRef.current?.resume();
    syncUi();
  }, [soundRef, syncUi]);

  const primaryAction = useCallback(() => {
    const phase = world.current.phase;
    if (phase === "playing") pause();
    else if (phase === "paused") resume();
    else start();
  }, [pause, resume, start]);

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      const w = world.current;
      if (w.difficulty === d && w.phase === "ready") return;
      w.difficulty = d;
      saveDifficulty(d);
      resetRun(w);
      w.phase = "ready";
      soundRef.current?.click();
      syncUi();
    },
    [soundRef, syncUi]
  );

  const input = useCallback((dir: Dir) => {
    const w = world.current;
    if (w.phase !== "playing") return;
    const last = w.queue.length ? w.queue[w.queue.length - 1] : w.dir;
    if (dir === last || isOpposite(dir, last)) return;
    if (w.queue.length < 3) w.queue.push(dir);
  }, []);

  /* ---------------- main loop + sizing ---------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const size = Math.max(120, Math.floor(Math.min(rect.width, rect.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      world.current.size = size;
      world.current.dpr = dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      let dt = now - last;
      last = now;
      if (dt > 100) dt = 100;

      const w = world.current;
      if (w.phase === "playing") {
        w.acc += dt;
        let guard = 0;
        while (w.acc >= intervalOf(w) && guard++ < 4) {
          w.acc -= intervalOf(w);
          tick();
          if (w.phase !== "playing") {
            w.acc = 0;
            break;
          }
        }
      }
      stepFx(w, dt);
      draw(ctx, w, now, { reduced: reducedRef.current });
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (document.hidden && world.current.phase === "playing") {
        world.current.phase = "paused";
        world.current.acc = 0;
        syncUi();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tick, syncUi]);

  /* ---------------- keyboard ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const onWidget =
        !!target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA");
      const key = e.key.toLowerCase();

      if (DIR_KEYS[key]) {
        e.preventDefault();
        input(DIR_KEYS[key]);
        return;
      }
      if (key === " " || e.code === "Space") {
        if (onWidget) return; // let focused buttons behave natively
        e.preventDefault();
        primaryAction();
        return;
      }
      if (key === "r") {
        e.preventDefault();
        start();
        return;
      }
      if (key === "enter" && !onWidget) {
        const phase = world.current.phase;
        if (phase === "ready" || phase === "over") {
          e.preventDefault();
          start();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, primaryAction, start]);

  return {
    canvasRef,
    wrapRef,
    ui,
    start,
    pause,
    resume,
    primaryAction,
    toReady,
    setDifficulty,
    input,
  };
}
