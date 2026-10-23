import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { SoundFX } from "./game/audio";
import {
  loadMuted,
  loadTheme,
  saveMuted,
  saveTheme,
  type Dir,
  type Theme,
} from "./game/core";
import { useSnakeGame } from "./game/useSnakeGame";
import { Dpad } from "./components/dpad";
import { HudBar, SidePanel } from "./components/panels";
import { OverOverlay, PauseOverlay, ReadyOverlay } from "./components/overlays";
import { IconMoon, IconMuted, IconSun, IconVolume, SnakeMark } from "./components/icons";

/* ---------------- ambient backdrop ---------------- */

function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 95% 75% at 50% 0%, black 25%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 95% 75% at 50% 0%, black 25%, transparent 82%)",
        }}
      />
      <div
        className="absolute -left-36 -top-36 h-[36rem] w-[36rem] rounded-full"
        style={{ background: "radial-gradient(circle, var(--glow-1), transparent 65%)" }}
      />
      <div
        className="absolute -bottom-44 -right-36 h-[40rem] w-[40rem] rounded-full"
        style={{ background: "radial-gradient(circle, var(--glow-2), transparent 65%)" }}
      />
      <svg
        className="anim-drift absolute right-[-90px] top-24 hidden w-[560px] text-mint opacity-[0.05] md:block"
        viewBox="0 0 600 220"
        fill="none"
      >
        <path
          d="M-30 165 C 80 45, 180 215, 300 115 S 470 25, 640 95"
          stroke="currentColor"
          strokeWidth="30"
          strokeLinecap="round"
        />
        <circle cx="608" cy="90" r="11" fill="var(--coral)" />
      </svg>
      <svg
        className="absolute bottom-8 left-[-130px] hidden w-[520px] text-gold opacity-[0.05] lg:block"
        viewBox="0 0 600 200"
        fill="none"
      >
        <path
          d="M-20 60 C 120 170, 240 20, 360 100 S 560 170, 640 60"
          stroke="currentColor"
          strokeWidth="26"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ---------------- app ---------------- */

export default function App() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [muted, setMuted] = useState<boolean>(loadMuted);

  const soundRef = useRef<SoundFX | null>(null);
  if (!soundRef.current) soundRef.current = new SoundFX(muted);

  const game = useSnakeGame(soundRef);
  const { ui } = game;

  /* theme + sound persistence */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (soundRef.current) soundRef.current.muted = muted;
    saveMuted(muted);
  }, [muted]);

  /* screen-reader announcements */
  const [announce, setAnnounce] = useState("");
  const prevPhase = useRef(ui.phase);
  useEffect(() => {
    if (ui.phase !== prevPhase.current) {
      prevPhase.current = ui.phase;
      if (ui.phase === "playing") setAnnounce("Game started. Good luck!");
      else if (ui.phase === "paused") setAnnounce("Game paused.");
      else if (ui.phase === "over")
        setAnnounce(`Game over. Score ${ui.score}.${ui.newBest ? " New high score!" : ""}`);
      else setAnnounce("Ready. Choose a difficulty, then press start.");
    }
  }, [ui.phase, ui.score, ui.newBest]);

  const prevBest = useRef(ui.newBest);
  useEffect(() => {
    if (ui.newBest && !prevBest.current) setAnnounce("New high score!");
    prevBest.current = ui.newBest;
  }, [ui.newBest]);

  /* swipe steering on the board */
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: ReactTouchEvent) => {
    const s = touchStart.current;
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    const dir: Dir =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up";
    game.input(dir);
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const togglePauseHud = () =>
    ui.phase === "paused" ? game.resume() : game.pause();

  const toggleTheme = () => {
    soundRef.current?.unlock();
    soundRef.current?.click();
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const toggleMute = () => {
    const next = !muted;
    if (soundRef.current) {
      soundRef.current.muted = next;
      if (!next) {
        soundRef.current.unlock();
        soundRef.current.click();
      }
    }
    setMuted(next);
  };

  return (
    <div
      data-theme={theme}
      className="relative min-h-dvh overflow-x-hidden bg-page text-ink lg:h-dvh lg:overflow-hidden"
    >
      <Backdrop />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-10 sm:px-6 lg:h-dvh lg:min-h-0 lg:max-w-[1200px] lg:px-8 lg:py-4 lg:pb-4">
        {/* header */}
        <header className="anim-rise flex items-center justify-between py-4 sm:py-5 lg:py-0 lg:pb-3">
          <div className="group-logo flex items-center gap-2.5 sm:gap-3">
            <SnakeMark size={36} className="logo-mark shrink-0 sm:hidden" />
            <SnakeMark size={40} className="logo-mark hidden shrink-0 sm:block" />
            <div>
              <p className="font-display text-base font-extrabold leading-none tracking-[0.2em] text-ink sm:text-lg">
                SNAKE
              </p>
              <p className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-mute sm:block">
                A modern classic
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleMute}
              aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
              aria-pressed={muted}
              title={muted ? "Sound off" : "Sound on"}
            >
              {muted ? <IconMuted size={17} /> : <IconVolume size={17} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
            >
              {theme === "dark" ? <IconSun size={17} /> : <IconMoon size={17} />}
            </button>
          </div>
        </header>

        {/* main */}
        <main className="flex min-h-0 flex-1 flex-col gap-6 lg:min-h-0 lg:flex-row lg:gap-7">
          <aside
            className="hidden lg:block lg:min-h-0 lg:w-[300px] lg:shrink-0 lg:self-stretch lg:overflow-y-auto"
            aria-label="Game information"
          >
            <SidePanel ui={ui} onDifficulty={game.setDifficulty} />
          </aside>

          <section className="flex min-h-0 flex-col lg:min-h-0 lg:flex-1" aria-label="Game board">
            <div className="mx-auto flex w-full max-w-[620px] flex-col lg:min-h-0 lg:max-w-none lg:flex-1">
              <HudBar ui={ui} onTogglePause={togglePauseHud} onRestart={game.start} />

              <div className="anim-rise lg:min-h-0 lg:flex-1" style={{ animationDelay: "90ms" }}>
                <div
                  ref={game.wrapRef}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  className="relative aspect-square w-full touch-none lg:flex lg:aspect-auto lg:h-full lg:w-full lg:items-center lg:justify-center"
                >
                  <div
                    className="h-full w-full rounded-[24px] border border-line bg-[var(--frame)] p-[10px] lg:h-[var(--frame-size,340px)] lg:w-[var(--frame-size,340px)]"
                    style={{ boxShadow: "var(--shadow-board)" }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[16px]">
                      <canvas ref={game.canvasRef} className="absolute inset-0" />

                      {ui.phase === "ready" && (
                        <ReadyOverlay
                          difficulty={ui.difficulty}
                          bests={ui.bests}
                          onDifficulty={game.setDifficulty}
                          onStart={game.start}
                        />
                      )}
                      {ui.phase === "paused" && (
                        <PauseOverlay onResume={game.resume} onRestart={game.start} />
                      )}
                      {ui.phase === "over" && (
                        <OverOverlay
                          score={ui.score}
                          best={ui.best}
                          newBest={ui.newBest}
                          length={ui.length}
                          foods={ui.foods}
                          onAgain={game.start}
                          onMenu={game.toReady}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* desktop caption */}
              <div className="mt-2.5 hidden items-center justify-between text-[11px] font-medium tracking-wide text-mute lg:flex">
                <span>Arrows / WASD steer · Space — pause · R — restart · Enter — start</span>
                <span>
                  Speed climbs as you eat{" "}
                  <span className="font-display font-bold text-mint">×{ui.speed.toFixed(2)}</span>
                </span>
              </div>

              {/* mobile controls */}
              <div className="mt-4 lg:hidden">
                <Dpad phase={ui.phase} onDir={game.input} onCenter={game.primaryAction} />
                <p className="mt-2.5 text-center text-[11px] text-mute">
                  or swipe directly on the board
                </p>
                <p className="mt-1 text-center text-[11px] text-mute">
                  Length <strong className="text-ink">{ui.length}</strong> · Food{" "}
                  <strong className="text-ink">{ui.foods}</strong> · Games{" "}
                  <strong className="text-ink">{ui.gamesPlayed}</strong>
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* footer */}
        <footer className="mt-8 border-t border-line pt-4 text-center text-[11px] leading-relaxed text-mute lg:hidden">
          <p>
            Steer with arrow keys, WASD, the pad or a swipe · Space pauses · R restarts.
          </p>
          <p className="mt-1">
            High scores, difficulty and theme are saved in this browser. No account, no
            ads — just the loop.
          </p>
        </footer>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
    </div>
  );
}
