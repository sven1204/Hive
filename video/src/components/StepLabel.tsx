import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../config";
import { prog } from "../lib/anim";

/* Label d'étape « 01 Crée ton projet » : pastille numérotée + libellé révélé par balayage. */
export const StepLabel: React.FC<{ num: string; label: string; at: number; outAt?: number; size: number; style?: React.CSSProperties }> = ({
  num,
  label,
  at,
  outAt,
  size,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 0.7);
  const wipe = prog(frame, at + 0.12, 0.75);
  const out = outAt ? prog(frame, outAt, 0.35) : 0;
  if (p <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.4,
        padding: `${size * 0.22}px ${size * 0.62}px ${size * 0.22}px ${size * 0.22}px`,
        borderRadius: 999,
        background: "rgba(255, 253, 249, 0.94)",
        border: `1.5px solid ${COLORS.border}`,
        boxShadow: `0 16px 40px rgba(${COLORS.shadow}, 0.14), 0 2px 8px rgba(${COLORS.shadow}, 0.06)`,
        // la pastille se déroule depuis la gauche, en même temps que le libellé
        clipPath: `inset(-40% ${(1 - wipe) * 72}% -40% -10% round 999px)`,
        opacity: (1 - out) * Math.min(1, p * 3),
        transform: `translateY(${-out * 30}px)`,
        ...style,
      }}
    >
      <div
        style={{
          height: size * 1.5,
          minWidth: size * 1.9,
          padding: `0 ${size * 0.42}px`,
          borderRadius: 999,
          background: COLORS.accent,
          color: COLORS.white,
          fontWeight: 700,
          fontSize: size * 0.72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "0.02em",
          transform: `scale(${0.95 + 0.05 * p})`,
          opacity: Math.min(1, p * 2),
          boxShadow: `0 6px 16px rgba(${COLORS.glow}, 0.25)`,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: size,
          fontWeight: 700,
          color: COLORS.text,
          letterSpacing: "-0.02em",
          clipPath: `inset(-20% ${(1 - wipe) * 100}% -20% 0)`,
          transform: `translateX(${(1 - wipe) * -24}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};
