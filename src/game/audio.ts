/**
 * Tiny WebAudio synth for game feedback — no audio assets needed.
 * Every cue is a short envelope-shaped oscillator blip, kept quiet
 * so the game stays pleasant with or without sound.
 */
export class SoundFX {
  muted: boolean;
  private ac: AudioContext | null = null;

  constructor(muted = false) {
    this.muted = muted;
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ac) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ac = new AC();
    }
    if (this.ac && this.ac.state === "suspended") {
      void this.ac.resume();
    }
    return this.ac;
  }

  /** Call from any user gesture to unlock audio on iOS. */
  unlock(): void {
    this.ensure();
  }

  private tone(
    f0: number,
    f1: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    delay = 0
  ): void {
    if (this.muted) return;
    const ac = this.ensure();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  eat(): void {
    this.tone(540, 900, 0.09, "triangle", 0.14);
    this.tone(1080, 1500, 0.07, "sine", 0.05, 0.02);
  }

  best(): void {
    [660, 880, 1175].forEach((f, i) =>
      this.tone(f, f * 1.25, 0.13, "triangle", 0.1, i * 0.075)
    );
  }

  over(): void {
    this.tone(300, 105, 0.42, "sawtooth", 0.08);
    this.tone(150, 55, 0.5, "triangle", 0.07, 0.06);
  }

  start(): void {
    this.tone(430, 740, 0.1, "triangle", 0.11);
    this.tone(740, 990, 0.09, "sine", 0.06, 0.07);
  }

  pause(): void {
    this.tone(520, 380, 0.09, "sine", 0.07);
  }

  resume(): void {
    this.tone(380, 540, 0.09, "sine", 0.07);
  }

  click(): void {
    this.tone(720, 720, 0.045, "sine", 0.05);
  }
}
