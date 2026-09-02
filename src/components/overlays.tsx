import type { ReactNode } from "react";
import { DIFFS, pad3, type Difficulty } from "../game/core";
import { DifficultyPicker } from "./panels";
import {
  IconPause,
  IconPlay,
  IconRestart,
  IconTrophy,
  SnakeMark,
} from "./icons";

/* Overlays sit on the (always dark) board, so they use fixed dark tones
   to stay legible in both page themes. */

function Shell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className="anim-fade absolute inset-0 z-10 flex items-center justify-center rounded-[18px] bg-[rgba(5,11,8,0.78)] p-4 backdrop-blur-[3px]"
    >
      <div className="anim-pop w-full max-w-sm rounded-2xl border border-[rgba(148,226,179,0.16)] bg-[#0f1d15] p-6 text-center text-[#e9f5ee] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:p-7">
        {children}
      </div>
    </div>
  );
}

const label = "block text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fae9c]";

function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[rgba(148,226,179,0.28)] font-semibold text-[#bfe8d2] transition-all duration-150 hover:border-[rgba(148,226,179,0.5)] hover:bg-[rgba(148,226,179,0.08)] active:scale-[0.97]"
    >
      {children}
    </button>
  );
}

function PlayButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#6fe3a5] font-display text-sm font-bold tracking-wide text-[#072517] shadow-[0_14px_30px_-10px_rgba(20,120,70,0.65),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
    >
      {children}
    </button>
  );
}

/* ---------------- Ready ---------------- */

export function ReadyOverlay({
  difficulty,
  bests,
  onDifficulty,
  onStart,
}: {
  difficulty: Difficulty;
  bests: Record<Difficulty, number>;
  onDifficulty: (d: Difficulty) => void;
  onStart: () => void;
}) {
  return (
    <Shell label="Start screen — choose difficulty and start the game">
      <SnakeMark size={44} className="logo-mark mx-auto anim-drift" />
      <h2 className="font-display mt-3 text-2xl font-extrabold tracking-[0.14em] text-[#e9f5ee]">
        SNAKE
      </h2>
      <p className="mt-1.5 text-sm text-[#8fae9c]">
        Classic gameplay. Modern feel.
      </p>

      <div className="mt-5">
        <span className={label}>Choose difficulty</span>
        <div className="mt-2">
          <DifficultyPicker
            value={difficulty}
            onChange={onDifficulty}
            dark
          />
        </div>
        <p className="mt-2 text-xs text-[#8fae9c]">
          {DIFFS[difficulty].desc} · Best on {DIFFS[difficulty].label.toLowerCase()}:{" "}
          <span className="font-semibold text-[#f2c86f]">{pad3(bests[difficulty])}</span>
        </p>
      </div>

      <div className="mt-5">
        <PlayButton onClick={onStart}>
          <IconPlay size={18} />
          START GAME
        </PlayButton>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[#6d8b7b]">
        Arrows / WASD or swipe to steer · Space pauses · R restarts
      </p>
    </Shell>
  );
}

/* ---------------- Paused ---------------- */

export function PauseOverlay({
  onResume,
  onRestart,
}: {
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <Shell label="Game paused">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(148,226,179,0.25)] bg-[rgba(148,226,179,0.08)] text-[#6fe3a5]">
        <IconPause size={20} />
      </span>
      <h2 className="font-display mt-4 text-xl font-bold text-[#e9f5ee]">
        Game Paused
      </h2>
      <p className="mt-1.5 text-sm text-[#8fae9c]">
        Take a break — your progress is saved.
      </p>
      <div className="mt-5 space-y-2.5">
        <PlayButton onClick={onResume}>
          <IconPlay size={17} />
          RESUME GAME
        </PlayButton>
        <GhostButton onClick={onRestart}>
          <IconRestart size={16} />
          Restart
        </GhostButton>
      </div>
      <p className="mt-4 text-[11px] text-[#6d8b7b]">Press Space to resume</p>
    </Shell>
  );
}

/* ---------------- Game over ---------------- */

export function OverOverlay({
  score,
  best,
  newBest,
  length,
  foods,
  onAgain,
  onMenu,
}: {
  score: number;
  best: number;
  newBest: boolean;
  length: number;
  foods: number;
  onAgain: () => void;
  onMenu: () => void;
}) {
  return (
    <Shell label={`Game over. Score ${score}.`}>
      {newBest && (
        <span className="anim-best mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(242,200,111,0.5)] bg-[rgba(242,200,111,0.12)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f2c86f]">
          <IconTrophy size={13} />
          New High Score
        </span>
      )}
      <h2 className="font-display text-2xl font-extrabold text-[#e9f5ee]">
        Game Over
      </h2>

      <div className="mt-5 flex items-end justify-center gap-8">
        <div>
          <span className={label}>Score</span>
          <p
            className={`font-display mt-1 text-[44px] font-extrabold leading-none ${
              newBest ? "text-[#f2c86f]" : "text-[#96f3c0]"
            }`}
          >
            {pad3(score)}
          </p>
        </div>
        <div className="pb-1">
          <span className={label}>Best</span>
          <p className="font-display mt-1 flex items-center gap-1.5 text-xl font-bold leading-none text-[#bfe8d2]">
            <IconTrophy size={16} className="text-[#f2c86f]" />
            {pad3(best)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8fae9c]">
        <span className="rounded-md border border-[rgba(148,226,179,0.18)] bg-[rgba(148,226,179,0.06)] px-2.5 py-1">
          Length <strong className="text-[#e9f5ee]">{length}</strong>
        </span>
        <span className="rounded-md border border-[rgba(148,226,179,0.18)] bg-[rgba(148,226,179,0.06)] px-2.5 py-1">
          Food <strong className="text-[#e9f5ee]">{foods}</strong>
        </span>
      </div>

      <div className="mt-6 space-y-2.5">
        <PlayButton onClick={onAgain}>
          <IconRestart size={17} />
          PLAY AGAIN
        </PlayButton>
        <GhostButton onClick={onMenu}>Change Difficulty</GhostButton>
      </div>
    </Shell>
  );
}
