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

function Shell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className="ov-scrim anim-fade absolute inset-0 z-10 flex items-center justify-center rounded-[18px] p-3 backdrop-blur-[3px] sm:p-4"
    >
      <div className="ov-card anim-pop w-full max-w-sm rounded-2xl p-5 text-center sm:p-6 lg:p-7">
        {children}
      </div>
    </div>
  );
}

const label = "ov-mute block text-[10px] font-bold uppercase tracking-[0.22em]";

function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ov-ghost inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.97] sm:h-11"
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
      className="font-display inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-mint text-sm font-bold tracking-wide text-mintink shadow-[0_14px_30px_-10px_rgba(20,120,70,0.55),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97] sm:h-12 sm:gap-2.5"
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
      <SnakeMark size={40} className="logo-mark anim-drift mx-auto sm:size-[44px]" />
      <h2 className="font-display mt-2.5 text-xl font-extrabold tracking-[0.14em] sm:mt-3 sm:text-2xl">
        SNAKE
      </h2>
      <p className="ov-mute mt-1 hidden text-sm sm:block sm:mt-1.5">
        Classic gameplay. Modern feel.
      </p>

      <div className="mt-4 sm:mt-5">
        <span className={label}>Choose difficulty</span>
        <div className="mt-2">
          <DifficultyPicker value={difficulty} onChange={onDifficulty} dark />
        </div>
        <p className="ov-mute mt-2 text-[11px] sm:text-xs">
          {DIFFS[difficulty].desc} · Best on {DIFFS[difficulty].label.toLowerCase()}:{" "}
          <span className="ov-gold font-semibold">{pad3(bests[difficulty])}</span>
        </p>
      </div>

      <div className="mt-4 sm:mt-5">
        <PlayButton onClick={onStart}>
          <IconPlay size={17} className="sm:hidden" />
          <IconPlay size={18} className="hidden sm:block" />
          START GAME
        </PlayButton>
      </div>

      <p className="ov-dim mt-3 text-[10px] leading-relaxed sm:mt-4 sm:text-[11px]">
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
      <span className="ov-badge mx-auto flex h-11 w-11 items-center justify-center rounded-full sm:h-12 sm:w-12">
        <IconPause size={19} className="sm:hidden" />
        <IconPause size={20} className="hidden sm:block" />
      </span>
      <h2 className="font-display mt-3 text-lg font-bold sm:mt-4 sm:text-xl">
        Game Paused
      </h2>
      <p className="ov-mute mt-1 text-sm">Take a break — your progress is saved.</p>
      <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
        <PlayButton onClick={onResume}>
          <IconPlay size={16} className="sm:hidden" />
          <IconPlay size={17} className="hidden sm:block" />
          RESUME GAME
        </PlayButton>
        <GhostButton onClick={onRestart}>
          <IconRestart size={15} className="sm:hidden" />
          <IconRestart size={16} className="hidden sm:block" />
          Restart
        </GhostButton>
      </div>
      <p className="ov-dim mt-3 text-[11px] sm:mt-4">Press Space to resume</p>
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
        <span className="ov-pill-gold anim-best mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] sm:mb-4 sm:px-3.5 sm:py-1.5">
          <IconTrophy size={12} className="sm:hidden" />
          <IconTrophy size={13} className="hidden sm:block" />
          New High Score
        </span>
      )}
      <h2 className="font-display text-xl font-extrabold sm:text-2xl">Game Over</h2>

      <div className="mt-4 flex items-end justify-center gap-6 sm:mt-5 sm:gap-8">
        <div>
          <span className={label}>Score</span>
          <p
            className={`font-display mt-1 text-[36px] font-extrabold leading-none sm:text-[44px] ${
              newBest ? "ov-gold" : "ov-mint"
            }`}
          >
            {pad3(score)}
          </p>
        </div>
        <div className="pb-1">
          <span className={label}>Best</span>
          <p className="font-display mt-1 flex items-center gap-1.5 text-lg font-bold leading-none sm:text-xl">
            <IconTrophy size={15} className="ov-gold sm:hidden" />
            <IconTrophy size={16} className="hidden ov-gold sm:block" />
            {pad3(best)}
          </p>
        </div>
      </div>

      <div className="ov-mute mt-3 flex items-center justify-center gap-2 text-[11px] sm:mt-4">
        <span className="ov-chip rounded-md px-2.5 py-1">
          Length <strong>{length}</strong>
        </span>
        <span className="ov-chip rounded-md px-2.5 py-1">
          Food <strong>{foods}</strong>
        </span>
      </div>

      <div className="mt-5 space-y-2 sm:mt-6 sm:space-y-2.5">
        <PlayButton onClick={onAgain}>
          <IconRestart size={16} className="sm:hidden" />
          <IconRestart size={17} className="hidden sm:block" />
          PLAY AGAIN
        </PlayButton>
        <GhostButton onClick={onMenu}>Change Difficulty</GhostButton>
      </div>
    </Shell>
  );
}
