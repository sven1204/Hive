import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, FPS, T, TEXT } from "../config";
import { cursorOn, drift, easeCam, lerp, mix, prog, typedCount } from "../lib/anim";
import { useFormat } from "../lib/format";
import { clusterCenters, HexCell, hexPath, type CellState } from "../components/Hex";
import { MaskLine } from "../components/MaskLine";
import { Accent } from "../components/Accent";
import { RolePill } from "../components/RolePill";

/* Scènes 1 à 3 (0 → 7,8 s) en un seul plan continu :
   barre de saisie → alvéole centrale → grappe de 7 → remplissage + rôles → plongée. */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useFormat();
  const { m, W, H } = L;
  const s = frame / FPS;
  const R = L.hexR;
  const gap = m ? 16 : 14;

  // ── Position de la grappe : centre écran pendant le hook, puis place définitive
  const move = prog(frame, T.cluster.start, 0.7, easeCam);
  const start = { x: W / 2, y: m ? 900 : H / 2 };
  const cx = mix(start.x, L.clusterPos.x, move);
  const cy = mix(start.y, L.clusterPos.y, move);

  // ── Plongée finale dans l'alvéole centrale
  const dive = prog(frame, T.fill.diveAt, 0.6, (t) => easeCam(t) ** 1.6);
  const diveScale = 1 + dive * 16;
  const d = drift(frame, 1 - dive);

  // ── Hook : barre de saisie
  const barIn = prog(frame, 0.05, 0.6);
  const morph = prog(frame, T.hook.morphAt, 0.38, easeCam);
  const n = typedCount(frame, T.hook.typeStart, T.hook.charEvery, TEXT.hook.length);
  const typing = s >= T.hook.typeStart && n < TEXT.hook.length;
  const barW0 = m ? 970 : 1120;
  const barH0 = m ? 168 : 136;
  const hexW = Math.sqrt(3) * R;
  const barW = mix(barW0, hexW, morph);
  const barH = mix(barH0, 2 * R, morph);
  const barOpacity = 1 - prog(frame, T.hook.morphAt + 0.3, 0.12, (t) => t);
  const textOpacity = 1 - prog(frame, T.hook.morphAt, 0.14, (t) => t);

  // ── Alvéoles
  const centers = clusterCenters(R, gap);
  const centerAppear = prog(frame, T.hook.morphAt + 0.26, 0.3);
  const centerFill = prog(frame, T.hook.morphAt + 0.3, 0.55);
  const cells: CellState[] = centers.map((_, i) => {
    if (i === 0) return { appear: centerAppear, fill: centerFill };
    const k = i - 1;
    return {
      appear: prog(frame, T.cluster.start + 0.1 + k * 0.06, 0.6),
      fill: prog(frame, T.fill.firstAt + k * T.fill.every, 0.5),
    };
  });

  // ── Textes
  const fs = L.hero;
  const l1 = prog(frame, T.cluster.line1At, 0.8);
  const l2 = prog(frame, T.cluster.line2At, 0.8);
  const outA = prog(frame, T.fill.start - 0.05, 0.45, easeCam);
  const l3 = prog(frame, T.fill.textAt + 0.2, 0.8);
  const outB = prog(frame, T.fill.diveAt - 0.1, 0.35, easeCam);
  const textAlign = m ? "center" : "left";

  return (
    <AbsoluteFill style={{ transform: `translate(${d.x}px, ${d.y}px) rotate(${d.rot}deg)` }}>
      {/* Grappe + barre (même repère, pour la plongée) */}
      <AbsoluteFill
        style={{
          transform: `scale(${diveScale})`,
          transformOrigin: `${cx}px ${cy}px`,
          filter: dive > 0.01 ? `blur(${dive * 5}px)` : undefined,
        }}
      >
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 18px 30px rgba(${COLORS.shadow}, 0.12))` }}>
          {centers.map(([x, y], i) => (
            <HexCell key={i} id={`c${i}`} cx={cx + x} cy={cy + y} R={R} state={cells[i]} stroke={m ? 6 : 5} />
          ))}
          {/* halo miel discret autour des alvéoles pleines */}
          {centerFill > 0 && (
            <path d={hexPath(cx, cy, R * 1.05)} fill="none" stroke={`rgba(${COLORS.glow},0.25)`} strokeWidth={18} style={{ filter: "blur(14px)" }} opacity={centerFill} />
          )}
        </svg>

        {barOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              left: cx - barW / 2,
              top: cy - barH / 2,
              width: barW,
              height: barH,
              borderRadius: mix(barH0 / 2, R * 0.6, morph),
              background: COLORS.surface,
              border: `${m ? 3 : 2.5}px solid ${morph > 0.3 ? COLORS.accent : COLORS.border}`,
              boxShadow: `0 24px 60px rgba(${COLORS.shadow}, 0.14), 0 4px 12px rgba(${COLORS.shadow}, 0.06), 0 0 0 ${10 * barIn}px rgba(${COLORS.glow}, ${0.07 * (1 - morph)})`,
              opacity: barIn * barOpacity,
              transform: `translateY(${(1 - barIn) * 40}px) scale(${0.95 + 0.05 * barIn})`,
              display: "flex",
              alignItems: "center",
              padding: `0 ${m ? 48 : 44}px`,
              gap: 22,
              overflow: "hidden",
            }}
          >
            <svg width={barH0 * 0.34} height={barH0 * 0.34} viewBox="-12 -12 24 24" style={{ flexShrink: 0, opacity: textOpacity }}>
              <path d={hexPath(0, 0, 10, 0.2)} fill={COLORS.accent} />
            </svg>
            <div
              style={{
                fontSize: m ? 52 : 52,
                fontWeight: 500,
                color: COLORS.text,
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
                opacity: textOpacity,
                display: "flex",
                alignItems: "center",
              }}
            >
              {TEXT.hook.slice(0, n)}
              <span
                style={{
                  width: 5,
                  height: m ? 66 : 60,
                  marginLeft: 4,
                  borderRadius: 3,
                  background: COLORS.accent,
                  opacity: s >= 0.25 && cursorOn(frame, typing) ? 1 : 0,
                }}
              />
            </div>
          </div>
        )}

        {/* Pastilles de rôle */}
        {TEXT.roles.map((role, k) => {
          const at = T.fill.firstAt + k * T.fill.every + 0.04;
          const p = prog(frame, at, 0.55);
          if (p <= 0) return null;
          const [x, y] = centers[k + 1];
          const len = Math.hypot(x, y);
          const dist = len + R * (m ? 0.95 : 1.05);
          const px = cx + (x / len) * dist + (x / len) * (1 - p) * -30;
          const py = cy + (y / len) * dist * (m ? 1.02 : 1) + (y / len) * (1 - p) * -30;
          return (
            <div
              key={role}
              style={{
                position: "absolute",
                left: px,
                top: py,
                transform: `translate(-50%, -50%) scale(${0.94 + 0.06 * p})`,
                opacity: Math.min(1, p * 2.2) * (1 - dive),
                filter: p < 0.5 ? `blur(${(0.5 - p) * 8}px)` : undefined,
              }}
            >
              <RolePill label={role} index={k} size={m ? 34 : 26} />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Textes */}
      <div
        style={{
          position: "absolute",
          left: m ? 60 : L.textPos.x,
          right: m ? 60 : undefined,
          top: m ? L.textPos.y - 100 : L.textPos.y - fs * 1.15,
          width: m ? undefined : 1000,
          textAlign,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: COLORS.text,
          opacity: 1 - dive,
        }}
      >
        {s < T.fill.start + 0.5 && (
          <div style={{ position: "absolute", inset: 0 }}>
            <MaskLine p={l1} out={outA}>{TEXT.cluster.line1}</MaskLine>
            <MaskLine p={l2} out={outA}>
              {TEXT.cluster.line2Pre}
              <Accent>{TEXT.cluster.line2Accent}</Accent>
              {TEXT.cluster.line2Post}
            </MaskLine>
          </div>
        )}
        {s >= T.fill.textAt && (
          <div style={{ position: "absolute", inset: 0 }}>
            <MaskLine p={l3} out={outB}>
              {TEXT.fill.pre}
              <Accent>{TEXT.fill.accent}</Accent>
              ,
            </MaskLine>
            <MaskLine p={prog(frame, T.fill.textAt + 0.32, 0.8)} out={outB}>
              {TEXT.fill.post.slice(2)}
            </MaskLine>
          </div>
        )}
      </div>

      {/* Fin de plongée : l'intérieur de l'alvéole devient la scène suivante (crème) */}
      <AbsoluteFill style={{ backgroundColor: COLORS.bg, opacity: lerp(frame, [(T.fill.diveAt + 0.3) * FPS, T.fill.end * FPS], [0, 1]) }} />
    </AbsoluteFill>
  );
};
