import React from "react";
import { COLORS } from "../config";

/* Hexagone « pointe en haut » à coins arrondis, centré sur (cx, cy). */
export function hexPath(cx: number, cy: number, R: number, round = 0.18) {
  const v = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  const k = round;
  const pt = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let d = "";
  for (let i = 0; i < 6; i++) {
    const prev = v[(i + 5) % 6];
    const cur = v[i];
    const next = v[(i + 1) % 6];
    const pin = pt(cur, prev, k);
    const pout = pt(cur, next, k);
    d += `${i === 0 ? "M" : "L"}${pin[0].toFixed(2)},${pin[1].toFixed(2)} Q${cur[0].toFixed(2)},${cur[1].toFixed(2)} ${pout[0].toFixed(2)},${pout[1].toFixed(2)} `;
  }
  return d + "Z";
}

/** Centres des 7 alvéoles : 0 = centre, puis 1→6 dans le sens horaire depuis le haut-droite. */
export function clusterCenters(R: number, gap: number) {
  const d = Math.sqrt(3) * R + gap;
  return [
    [0, 0],
    ...[-60, 0, 60, 120, 180, 240].map((deg) => {
      const a = (deg * Math.PI) / 180;
      return [d * Math.cos(a), d * Math.sin(a)];
    }),
  ] as [number, number][];
}

export type CellState = { appear: number; fill: number; glow?: number };

/* Une alvéole : contour crème + miel qui monte depuis le bas (fill 0→1). */
export const HexCell: React.FC<{ id: string; cx: number; cy: number; R: number; state: CellState; stroke?: number }> = ({
  id,
  cx,
  cy,
  R,
  state,
  stroke = 5,
}) => {
  const { appear, fill } = state;
  if (appear <= 0.001) return null;
  const scale = 0.95 + 0.05 * appear;
  const path = hexPath(cx, cy, R);
  const level = cy + R - fill * 2.02 * R; // niveau du miel (y)
  const wave = Math.sin(fill * Math.PI) * R * 0.07;
  const surface = `M${cx - R * 1.2},${level} Q${cx - R * 0.5},${level - wave} ${cx},${level} T${cx + R * 1.2},${level} L${cx + R * 1.2},${cy + R * 1.2} L${cx - R * 1.2},${cy + R * 1.2} Z`;
  return (
    <g style={{ opacity: Math.min(1, appear * 1.6), transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px` }}>
      <defs>
        <clipPath id={`clip-${id}`}>
          <path d={path} />
        </clipPath>
        <linearGradient id={`honey-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFA650" />
          <stop offset="100%" stopColor={COLORS.accent} />
        </linearGradient>
      </defs>
      <path d={path} fill={COLORS.surface} stroke={COLORS.border} strokeWidth={stroke} strokeLinejoin="round" />
      {fill > 0.001 && (
        <g clipPath={`url(#clip-${id})`}>
          <path d={surface} fill={`url(#honey-${id})`} />
          <path d={hexPath(cx, cy - R * 0.1, R * 0.62)} fill="#fff" opacity={0.1 * fill} />
        </g>
      )}
      {fill > 0.001 && (
        <path d={path} fill="none" stroke={COLORS.accent} strokeWidth={stroke} strokeLinejoin="round" opacity={Math.min(1, fill * 3)} />
      )}
    </g>
  );
};
