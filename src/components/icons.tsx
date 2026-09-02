import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconPlay = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M7 4.5v15l12-7.5L7 4.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconRestart = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12a9 9 0 1 0 2.6-6.3" />
    <path d="M3 4v4.5h4.5" />
  </svg>
);

export const IconTrophy = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5 3.5 3.5 0 0 0 6.5 11H7" />
    <path d="M17 6h2.5A1.5 1.5 0 0 1 21 7.5 3.5 3.5 0 0 1 17.5 11H17" />
  </svg>
);

export const IconSun = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" />
  </svg>
);

export const IconVolume = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" fill="currentColor" stroke="none" />
    <path d="M15 9a4.2 4.2 0 0 1 0 6" />
    <path d="M17.5 6.5a8 8 0 0 1 0 11" />
  </svg>
);

export const IconMuted = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" fill="currentColor" stroke="none" />
    <path d="m16 9 5 6m0-6-5 6" />
  </svg>
);

export const IconUp = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.4}>
    <path d="m5 14.5 7-7 7 7" />
  </svg>
);
export const IconDown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.4}>
    <path d="m5 9.5 7 7 7-7" />
  </svg>
);
export const IconLeft = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.4}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);
export const IconRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.4}>
    <path d="m9.5 5 7 7-7 7" />
  </svg>
);

export const IconLeaf = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-4.5 3.5-8 9.5-9 3.5-.6 6.5-1 6.5-1s-.4 3-1 6.5C17.9 15.5 15 20 11 20Z" />
    <path d="M5.5 19.5C8 15 11 12 15 9.5" />
  </svg>
);

export const IconGauge = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4.5 19a9 9 0 1 1 15 0" />
    <path d="m12 13 3.5-4.5" />
    <circle cx="12" cy="13.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBolt = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
  </svg>
);

export const IconHand = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M8.5 11.5V5a1.5 1.5 0 0 1 3 0v6" />
    <path d="M11.5 10.5V4a1.5 1.5 0 0 1 3 0v7" />
    <path d="M14.5 11V6a1.5 1.5 0 0 1 3 0v7.5a6.5 6.5 0 0 1-11 4.8l-2.6-3.5a1.6 1.6 0 0 1 2.4-2.1l1.2 1.3" />
  </svg>
);

/** Brand mark — a winding snake with a head and a little apple. */
export const SnakeMark = ({ size = 40, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...p}>
    <path
      d="M35 33H18a7.5 7.5 0 1 1 0-15h12a7.5 7.5 0 1 0 0-15h-14"
      stroke="var(--mint)"
      strokeWidth="5.5"
      strokeLinecap="round"
    />
    <circle cx="40" cy="12.5" r="3.6" fill="var(--coral)" />
    <circle cx="38.8" cy="11.3" r="1" fill="rgba(255,255,255,0.65)" />
  </svg>
);
