export type Dir = "up" | "down" | "left" | "right";
export type Phase = "ready" | "playing" | "paused" | "over";
export type Difficulty = "easy" | "medium" | "hard";

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  age: number;
  max: number;
}

export interface World {
  phase: Phase;
  difficulty: Difficulty;
  segments: Point[];
  prev: Point[];
  dir: Dir;
  queue: Dir[];
  food: Point;
  acc: number;
  score: number;
  foods: number;
  best: number;
  bests: Record<Difficulty, number>;
  newBest: boolean;
  gamesPlayed: number;
  shake: number;
  flash: number;
  deadAt: number;
  particles: Particle[];
  floats: FloatText[];
  size: number;
  dpr: number;
}

export const GRID = 21;
export const POINTS = 10;

export interface DiffSpec {
  label: string;
  base: number;
  min: number;
  speedup: number;
  desc: string;
  level: 1 | 2 | 3;
}

export const DIFFS: Record<Difficulty, DiffSpec> = {
  easy: { label: "Easy", base: 175, min: 106, speedup: 2.4, desc: "Relaxed pace", level: 1 },
  medium: { label: "Medium", base: 125, min: 74, speedup: 2.0, desc: "Classic speed", level: 2 },
  hard: { label: "Hard", base: 88, min: 50, speedup: 1.7, desc: "Full reflex test", level: 3 },
};

export const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard"];

/** Current tick interval in ms — gradually speeds up as the snake eats. */
export const intervalOf = (w: World): number => {
  const d = DIFFS[w.difficulty];
  return Math.max(d.min, d.base - w.foods * d.speedup);
};

export const speedFactor = (w: World): number =>
  DIFFS[w.difficulty].base / intervalOf(w);

export const isOpposite = (a: Dir, b: Dir): boolean =>
  (a === "up" && b === "down") ||
  (a === "down" && b === "up") ||
  (a === "left" && b === "right") ||
  (a === "right" && b === "left");

export const pad3 = (n: number): string =>
  n >= 1000 ? String(n) : String(Math.max(0, n)).padStart(3, "0");

/* ---------------- world factory ---------------- */

const startSnake = (): Point[] => {
  const c = Math.floor(GRID / 2);
  return [
    { x: c + 2, y: c },
    { x: c + 1, y: c },
    { x: c, y: c },
  ];
};

export const randomFood = (segments: Point[]): Point => {
  const taken = new Set(segments.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
  return free.length
    ? free[Math.floor(Math.random() * free.length)]
    : { x: 0, y: 0 };
};

/** Mutates a world back to a fresh run (keeps stats + sizing). */
export const resetRun = (w: World): void => {
  w.segments = startSnake();
  w.prev = w.segments.map((p) => ({ ...p }));
  w.dir = "right";
  w.queue = [];
  w.food = randomFood(w.segments);
  w.acc = 0;
  w.score = 0;
  w.foods = 0;
  w.newBest = false;
  w.best = w.bests[w.difficulty];
  w.particles = [];
  w.floats = [];
  w.shake = 0;
  w.flash = 0;
};

export const createWorld = (): World => {
  const difficulty = loadDifficulty();
  const bests = loadBests();
  const w: World = {
    phase: "ready",
    difficulty,
    segments: startSnake(),
    prev: startSnake(),
    dir: "right",
    queue: [],
    food: { x: 16, y: 10 },
    acc: 0,
    score: 0,
    foods: 0,
    best: bests[difficulty],
    bests,
    newBest: false,
    gamesPlayed: loadGames(),
    shake: 0,
    flash: 0,
    deadAt: 0,
    particles: [],
    floats: [],
    size: 0,
    dpr: 1,
  };
  w.food = randomFood(w.segments);
  return w;
};

/* ---------------- persistence ---------------- */

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode etc. — game still works */
  }
};

export const loadBests = (): Record<Difficulty, number> => {
  const out: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const d of DIFF_ORDER) {
    const n = Number(read(`snake:best:${d}`));
    out[d] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  return out;
};

export const saveBest = (d: Difficulty, v: number): void =>
  write(`snake:best:${d}`, String(v));

export const loadDifficulty = (): Difficulty => {
  const v = read("snake:difficulty");
  return v === "easy" || v === "hard" ? v : "medium";
};

export const saveDifficulty = (d: Difficulty): void =>
  write("snake:difficulty", d);

export const loadGames = (): number => {
  const n = Number(read("snake:games"));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

export const saveGames = (n: number): void => write("snake:games", String(n));

export type Theme = "dark" | "light";

export const loadTheme = (): Theme => (read("snake:theme") === "light" ? "light" : "dark");
export const saveTheme = (t: Theme): void => write("snake:theme", t);

export const loadMuted = (): boolean => read("snake:muted") === "1";
export const saveMuted = (m: boolean): void => write("snake:muted", m ? "1" : "0");
