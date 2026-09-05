import type { CSSProperties, ReactNode } from "react";
import {
  DIFFS,
  DIFF_ORDER,
  pad3,
  type Difficulty,
} from "../game/core";
import type { UIState } from "../game/useSnakeGame";
import {
  IconBolt,
  IconGauge,
  IconLeaf,
  IconPause,
  IconPlay,
  IconRestart,
  IconTrophy,
} from "./icons";

const DIFF_ICON: Record<Difficulty, (p: { size?: number; className?: string }) => ReactNode> = {
  easy: (p) => <IconLeaf {...p} />,
  medium: (p) => <IconGauge {...p} />,
  hard: (p) => <IconBolt {...p} />,
};

const DIFF_DOT: Record<Difficulty, string> = {
  easy: "#59c98d",
  medium: "#f2c86f",
  hard: "#ff7a5c",
};

const xsLabel =
  "block text-[10px] font-bold uppercase tracking-[0.22em] text-mute";

/* ---------------- speed dots ---------------- */

export function SpeedDots({
  level,
  active,
  dark,
}: {
  level: 1 | 2 | 3;
  active: boolean;
  dark?: boolean;
}) {
  const heights = ["h-1.5", "h-2.5", "h-3.5"];
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${h} ${
            i < level
              ? active
                ? "bg-mintink/80"
                : "bg-mint"
              : dark
                ? "pk-dot"
                : "bg-panel2 border border-line"
          }`}
        />
      ))}
    </span>
  );
}

/* ---------------- difficulty picker ---------------- */

export function DifficultyPicker({
  value,
  onChange,
  dark,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  dark?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Difficulty"
      className={`grid grid-cols-3 gap-1 rounded-[13px] border p-1 ${
        dark ? "pkc" : "border-line bg-panel2"
      }`}
    >
      {DIFF_ORDER.map((d) => {
        const active = d === value;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${DIFFS[d].label} difficulty`}
            onClick={() => onChange(d)}
            className={[
              "flex cursor-pointer flex-col items-center gap-1 rounded-[10px] px-2 py-2.5 transition-all duration-150",
              active
                ? "bg-mint text-mintink shadow-md shadow-black/15"
                : dark
                  ? "pkb"
                  : "text-mute hover:bg-panel hover:text-ink",
            ].join(" ")}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold">
              {DIFF_ICON[d]({ size: 13 })}
              {DIFFS[d].label}
            </span>
            <SpeedDots level={DIFFS[d].level} active={active} dark={dark} />
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- HUD bar ---------------- */

const PHASE_META: Record<
  UIState["phase"],
  { label: string; dot: string; pulse: boolean }
> = {
  ready: { label: "Ready", dot: "var(--mute)", pulse: false },
  playing: { label: "Playing", dot: "var(--mint)", pulse: true },
  paused: { label: "Paused", dot: "var(--gold)", pulse: false },
  over: { label: "Game Over", dot: "var(--coral)", pulse: false },
};

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-panel px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mute">
      {children}
    </span>
  );
}

export function HudBar({
  ui,
  onTogglePause,
  onRestart,
}: {
  ui: UIState;
  onTogglePause: () => void;
  onRestart: () => void;
}) {
  const meta = PHASE_META[ui.phase];
  const pausable = ui.phase === "playing" || ui.phase === "paused";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="mr-1 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${meta.pulse ? "anim-dot" : ""}`}
          style={
            {
              backgroundColor: meta.dot,
              "--pulse-color": "rgba(111,227,165,0.5)",
            } as CSSProperties
          }
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-mute">
          {meta.label}
        </span>
      </span>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Chip>
          Score
          <span
            key={ui.score}
            className="anim-score font-display text-[13px] font-bold tracking-normal text-ink normal-case"
          >
            {pad3(ui.score)}
          </span>
        </Chip>
        <Chip>
          <IconTrophy size={13} className="text-gold" />
          Best
          <span className="font-display text-[13px] font-bold tracking-normal text-ink normal-case">
            {pad3(ui.best)}
          </span>
        </Chip>
        <Chip>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: DIFF_DOT[ui.difficulty] }}
            aria-hidden="true"
          />
          <span className="text-[11px] font-bold normal-case tracking-normal text-ink">
            {DIFFS[ui.difficulty].label}
          </span>
        </Chip>
      </div>

      <span className="flex items-center gap-2">
        <button
          type="button"
          className="icon-btn"
          onClick={onTogglePause}
          disabled={!pausable}
          aria-label={ui.phase === "paused" ? "Resume game" : "Pause game"}
          title={ui.phase === "paused" ? "Resume (Space)" : "Pause (Space)"}
        >
          {ui.phase === "paused" ? <IconPlay size={16} /> : <IconPause size={16} />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onRestart}
          aria-label="Restart game"
          title="Restart (R)"
        >
          <IconRestart size={16} />
        </button>
      </span>
    </div>
  );
}

/* ---------------- side panel ---------------- */

function StatRow({ k, v, accent }: { k: string; v: ReactNode; accent?: boolean }) {
  return (
    <li className="flex items-center justify-between py-2">
      <span className="text-[13px] text-mute">{k}</span>
      <span
        className={`font-display text-[13px] font-bold ${accent ? "text-mint" : "text-ink"}`}
      >
        {v}
      </span>
    </li>
  );
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function SidePanel({
  ui,
  onDifficulty,
}: {
  ui: UIState;
  onDifficulty: (d: Difficulty) => void;
}) {
  const pct =
    ui.best > 0 ? Math.min(100, Math.round((ui.score / ui.best) * 100)) : ui.score > 0 ? 100 : 0;

  return (
    <div className="space-y-4">
      {/* live score */}
      <section className="panel anim-rise p-5" aria-label="Current score">
        <span className={xsLabel}>Score</span>
        <p
          key={ui.score}
          className="anim-score font-display mt-2 text-[46px] font-extrabold leading-none text-ink"
        >
          {pad3(ui.score)}
        </p>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-mute">
            <span>
              Best · {DIFFS[ui.difficulty].label}
            </span>
            <span className="flex items-center gap-1 font-bold text-gold">
              <IconTrophy size={12} />
              {pad3(ui.best)}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-panel2"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward best score"
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${ui.newBest ? 100 : pct}%`,
                backgroundColor: ui.newBest ? "var(--gold)" : "var(--mint)",
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-mute">
            {ui.newBest
              ? "Best beaten — you are setting the pace."
              : ui.best > 0
                ? `${pad3(Math.max(0, ui.best - ui.score))} points to beat your best.`
                : "First run on this mode — set the bar."}
          </p>
        </div>
      </section>

      {/* difficulty + per-mode bests */}
      <section className="panel anim-rise p-5" style={{ animationDelay: "70ms" }} aria-label="Difficulty">
        <span className={xsLabel}>Difficulty</span>
        <div className="mt-2.5">
          <DifficultyPicker value={ui.difficulty} onChange={onDifficulty} />
        </div>
        <ul className="mt-4 space-y-1.5">
          {DIFF_ORDER.map((d) => {
            const active = d === ui.difficulty;
            return (
              <li
                key={d}
                className={`flex items-center justify-between rounded-[10px] border px-3 py-2 transition-colors ${
                  active
                    ? "border-linestrong bg-panel2 text-ink"
                    : "border-transparent text-mute"
                }`}
              >
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: DIFF_DOT[d] }}
                    aria-hidden="true"
                  />
                  {DIFFS[d].label}
                </span>
                <span className="flex items-center gap-2">
                  <SpeedDots level={DIFFS[d].level} active={false} />
                  <span className={`font-display text-xs font-bold ${active ? "text-gold" : ""}`}>
                    {pad3(ui.bests[d])}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] leading-snug text-mute">
          Changing mode ends the current run. Bests save per mode, in this browser.
        </p>
      </section>

      {/* session stats */}
      <section className="panel anim-rise p-5" style={{ animationDelay: "140ms" }} aria-label="Session statistics">
        <span className={xsLabel}>Session</span>
        <ul className="mt-1.5 divide-y divide-line">
          <StatRow k="Snake length" v={ui.length} accent />
          <StatRow k="Food eaten" v={ui.foods} />
          <StatRow k="Speed" v={`×${ui.speed.toFixed(2)}`} />
          <StatRow k="Games played" v={ui.gamesPlayed} />
        </ul>
      </section>

      {/* controls */}
      <section className="panel anim-rise p-5" style={{ animationDelay: "210ms" }} aria-label="Keyboard controls">
        <span className={xsLabel}>Controls</span>
        <ul className="mt-2 space-y-2.5 text-[13px] text-mute">
          <li className="flex items-center justify-between gap-2">
            <span>Move</span>
            <span className="flex items-center gap-1">
              <Key>↑</Key>
              <Key>↓</Key>
              <Key>←</Key>
              <Key>→</Key>
              <span className="px-0.5 text-[11px]">or</span>
              <Key>WASD</Key>
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Pause / resume</span>
            <Key>Space</Key>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Restart</span>
            <Key>R</Key>
          </li>
        </ul>
      </section>
    </div>
  );
}
