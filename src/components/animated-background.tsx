import type { CSSProperties } from "react";

// Pre-computed so the layout is deterministic and cheap (no per-frame JS).
const PARTICLES = [
  { left: "6%", size: 6, dur: 17, delay: 0, drift: "30px", opacity: 0.5 },
  { left: "18%", size: 4, dur: 22, delay: 3, drift: "-24px", opacity: 0.4 },
  { left: "30%", size: 8, dur: 15, delay: 6, drift: "18px", opacity: 0.55 },
  { left: "44%", size: 3, dur: 25, delay: 1.5, drift: "-30px", opacity: 0.35 },
  { left: "57%", size: 6, dur: 19, delay: 8, drift: "26px", opacity: 0.5 },
  { left: "69%", size: 5, dur: 21, delay: 4, drift: "-18px", opacity: 0.45 },
  { left: "80%", size: 9, dur: 16, delay: 10, drift: "22px", opacity: 0.5 },
  { left: "92%", size: 4, dur: 24, delay: 2, drift: "-28px", opacity: 0.4 },
];

const LINES = [
  { top: "22%", dur: 11, delay: 0 },
  { top: "48%", dur: 14, delay: 5 },
  { top: "74%", dur: 12, delay: 9 },
];

export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {LINES.map((l, i) => (
        <span
          key={`l-${i}`}
          className="fx-line"
          style={
            {
              top: l.top,
              "--l-duration": `${l.dur}s`,
              "--l-delay": `${l.delay}s`,
            } as CSSProperties
          }
        />
      ))}
      {PARTICLES.map((p, i) => (
        <span
          key={`p-${i}`}
          className="fx-particle"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              "--p-duration": `${p.dur}s`,
              "--p-delay": `${p.delay}s`,
              "--p-drift": p.drift,
              "--p-opacity": p.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
