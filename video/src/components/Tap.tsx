import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../config";
import { prog, lerp } from "../lib/anim";
import { FPS } from "../config";

/* Indicateur de tap : doigt (disque) qui se pose + onde qui s'étend. Pas de rebond. */
export const Tap: React.FC<{ x: number; y: number; at: number; size?: number }> = ({ x, y, at, size = 90 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS - at;
  if (t < -0.35 || t > 0.8) return null;
  const inP = prog(frame, at - 0.35, 0.3);
  const press = lerp(frame, [(at - 0.05) * FPS, at * FPS, (at + 0.12) * FPS], [1, 0.86, 1]);
  const ring = prog(frame, at, 0.6);
  const fade = lerp(frame, [(at + 0.35) * FPS, (at + 0.8) * FPS], [1, 0]);
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          width: size * 2.4,
          height: size * 2.4,
          left: -size * 1.2,
          top: -size * 1.2,
          borderRadius: 999,
          border: `4px solid rgba(${COLORS.glow}, ${0.55 * (1 - ring)})`,
          transform: `scale(${0.4 + ring * 0.6})`,
          opacity: t >= 0 ? 1 : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: size,
          height: size,
          left: -size / 2,
          top: -size / 2,
          borderRadius: 999,
          background: "rgba(255,253,249,0.55)",
          border: "3px solid rgba(255,255,255,0.9)",
          boxShadow: `0 10px 30px rgba(${COLORS.shadow}, 0.25)`,
          backdropFilter: "blur(2px)",
          transform: `translate(${(1 - inP) * 40}px, ${(1 - inP) * 60}px) scale(${press * (0.96 + 0.04 * inP)})`,
          opacity: inP * fade,
        }}
      />
    </div>
  );
};
