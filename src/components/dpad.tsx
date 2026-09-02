import type { PointerEvent, ReactNode } from "react";
import type { Dir, Phase } from "../game/core";
import {
  IconDown,
  IconLeft,
  IconPause,
  IconPlay,
  IconRestart,
  IconRight,
  IconUp,
} from "./icons";

interface DpadProps {
  phase: Phase;
  onDir: (d: Dir) => void;
  onCenter: () => void;
}

function PadButton({
  label,
  onPress,
  className = "",
  children,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  className?: string;
  children: ReactNode;
  primary?: boolean;
}) {
  const handle = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onPress();
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={handle}
      className={[
        "flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-100 select-none touch-none",
        "active:scale-90",
        primary
          ? "border-transparent bg-mint text-mintink shadow-lg shadow-black/20"
          : "border-line bg-panel text-ink shadow-sm shadow-black/10 active:bg-panel2 active:border-linestrong",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Dpad({ phase, onDir, onCenter }: DpadProps) {
  const centerLabel =
    phase === "playing"
      ? "Pause game"
      : phase === "paused"
        ? "Resume game"
        : phase === "over"
          ? "Play again"
          : "Start game";

  return (
    <div
      className="mx-auto grid w-max select-none grid-cols-3 gap-2.5"
      role="group"
      aria-label="On-screen game controls"
    >
      <div />
      <PadButton label="Move up" onPress={() => onDir("up")}>
        <IconUp size={22} />
      </PadButton>
      <div />

      <PadButton label="Move left" onPress={() => onDir("left")}>
        <IconLeft size={22} />
      </PadButton>
      <PadButton label={centerLabel} onPress={onCenter} primary>
        {phase === "playing" ? (
          <IconPause size={22} />
        ) : phase === "over" ? (
          <IconRestart size={21} />
        ) : (
          <IconPlay size={22} />
        )}
      </PadButton>
      <PadButton label="Move right" onPress={() => onDir("right")}>
        <IconRight size={22} />
      </PadButton>

      <div />
      <PadButton label="Move down" onPress={() => onDir("down")}>
        <IconDown size={22} />
      </PadButton>
      <div />
    </div>
  );
}
