import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../config";
import { useFormat } from "../lib/format";

/* Fond crème + halo miel très discret + grain léger (bruit SVG décalé toutes les 2 images). */
const grainSvg = (seed: number) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )}")`;

const GRAINS = Array.from({ length: 6 }, (_, i) => grainSvg(i + 1));

export const Background: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const frame = useCurrentFrame();
  const { m } = useFormat();
  const t = frame / 30;
  const gx = 50 + Math.sin(t * 0.25) * 8;
  const gy = (m ? 42 : 45) + Math.cos(t * 0.2) * 6;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${m ? "90% 55%" : "60% 75%"} at ${gx}% ${gy}%, rgba(${COLORS.glow}, ${0.1 * glow}) 0%, rgba(${COLORS.glow}, 0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse 120% 100% at 50% 50%, rgba(0,0,0,0) 60%, rgba(${COLORS.shadow}, 0.06) 100%)` }}
      />
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: GRAINS[Math.floor(frame / 2) % GRAINS.length],
        backgroundSize: "240px 240px",
        opacity: 0.22,
        mixBlendMode: "multiply",
        pointerEvents: "none",
      }}
    />
  );
};
