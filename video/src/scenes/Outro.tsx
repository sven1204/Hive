import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, FPS, T, TEXT } from "../config";
import { cursorOn, drift, easeCam, lerp, mix, prog, typedCount } from "../lib/anim";
import { useFormat } from "../lib/format";
import { clusterCenters, HexCell, type CellState } from "../components/Hex";
import { MaskLine } from "../components/MaskLine";
import { Accent } from "../components/Accent";
import { Tap } from "../components/Tap";

/* Scènes 8 et 9 (23 → 28 s) : la grappe se remplit entièrement, puis se resserre en logo
   (deux alvéoles pleines + une en contour qui se remplit), « Hive » lettre par lettre,
   « hive-app.ch » tapé dans une pastille cliquée, fondu vers le crème (boucle). */
const LOGO_CELLS = [6, 1, 0]; // haut-gauche, haut-droite, bas (repère de la grappe)

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useFormat();
  const { m, W, H } = L;
  const s = frame / FPS;
  const d = drift(frame);
  const R = L.hexR;
  const gap = m ? 16 : 14;
  const centers = clusterCenters(R, gap);

  // ── Grappe pleine (impact à 23 s : léger slam 1.05 → 1)
  const slam = lerp(frame, [T.final.start * FPS, (T.final.start + 0.35) * FPS], [1.05, 1], easeCam);
  const fillOrder = [0, 1, 2, 3, 4, 5, 6];
  const toLogo = prog(frame, T.logo.start, 0.7, easeCam);

  // Repère : grappe (même place que l'intro) → logo
  const logoR = m ? 92 : 66;
  const logoPos = m ? { x: W / 2, y: 760 } : { x: 790, y: 480 };
  // centre de gravité des 3 alvéoles du logo, dans le repère grappe
  const gx = (centers[6][0] + centers[1][0] + centers[0][0]) / 3;
  const gy = (centers[6][1] + centers[1][1] + centers[0][1]) / 3;
  const scale = mix(1, logoR / R, toLogo) * slam;
  const ox = mix(L.clusterPos.x, logoPos.x - gx * (logoR / R), toLogo);
  const oy = mix(L.clusterPos.y, logoPos.y - gy * (logoR / R), toLogo);

  const cells: CellState[] = centers.map((_, i) => {
    const order = fillOrder.indexOf(i);
    const appear = prog(frame, T.final.start - 0.05 + order * 0.03, 0.4);
    let fill = prog(frame, T.final.start + 0.05 + order * 0.07, 0.4);
    const inLogo = LOGO_CELLS.includes(i);
    const fade = inLogo ? 0 : prog(frame, T.logo.start, 0.35, easeCam);
    // l'alvéole du bas du logo se vide (contour), puis se remplit à nouveau
    if (i === 0) {
      const drain = prog(frame, T.logo.start + 0.1, 0.35, easeCam);
      const refill = prog(frame, T.logo.fillAt, 0.55);
      fill = fill * (1 - drain) + refill;
    }
    return { appear: appear * (1 - fade), fill: Math.min(1, fill) };
  });

  // ── Textes (scène 8)
  const t1 = prog(frame, T.final.start + 0.1, 0.7);
  const t2 = prog(frame, T.final.line2At, 0.7);
  const tOut = prog(frame, T.logo.start - 0.05, 0.35, easeCam);

  // ── Logo : « Hive » lettre par lettre, puis pastille URL
  const letters = Array.from(TEXT.brand);
  const brandSize = m ? 190 : 170;
  const urlIn = prog(frame, T.logo.urlAt, 0.55);
  const nUrl = typedCount(frame, T.logo.urlAt + 0.2, T.logo.urlCharEvery, TEXT.url.length);
  const urlTyping = s >= T.logo.urlAt + 0.2 && nUrl < TEXT.url.length;
  const clicked = prog(frame, T.logo.clickAt, 0.25);
  const press = lerp(frame, [(T.logo.clickAt - 0.04) * FPS, T.logo.clickAt * FPS, (T.logo.clickAt + 0.14) * FPS], [1, 0.96, 1]);
  const pillSize = m ? 50 : 40;
  const pillPos = m ? { x: W / 2, y: 1300 } : { x: 960, y: 800 };
  const brandPos = m ? { x: W / 2, y: 1050 } : { x: 950, y: 470 };

  // ── Fondu final vers le crème (boucle)
  const fade = prog(frame, T.logo.fadeAt, T.logo.end - T.logo.fadeAt - 0.05, easeCam);

  return (
    <AbsoluteFill style={{ opacity: 1 - fade, transform: `translate(${d.x * (1 - toLogo)}px, ${d.y * (1 - toLogo)}px)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 18px 30px rgba(${COLORS.shadow}, 0.12))` }}>
        <g transform={`translate(${ox} ${oy}) scale(${scale})`}>
          {centers.map(([x, y], i) => (
            <HexCell key={i} id={`o${i}`} cx={x} cy={y} R={R} state={cells[i]} stroke={m ? 6 : 5} />
          ))}
        </g>
      </svg>

      {/* Scène 8 : textes */}
      {tOut < 1 && (
        <div
          style={{
            position: "absolute",
            left: m ? 60 : L.textPos.x,
            right: m ? 60 : undefined,
            top: m ? L.textPos.y - 100 : L.textPos.y - L.hero * 1.15,
            width: m ? undefined : 1000,
            textAlign: m ? "center" : "left",
            fontSize: L.hero,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: COLORS.text,
          }}
        >
          <MaskLine p={t1} out={tOut}>
            {TEXT.final.line1Pre}
            <Accent>{TEXT.final.line1Accent}</Accent>
            {TEXT.final.line1Post}
          </MaskLine>
          <MaskLine p={t2} out={tOut}>
            {TEXT.final.line2}
          </MaskLine>
        </div>
      )}

      {/* Scène 9 : « Hive » */}
      <div
        style={{
          position: "absolute",
          left: brandPos.x,
          top: brandPos.y,
          transform: m ? "translate(-50%, -50%)" : "translate(0, -50%)",
          display: "flex",
          fontSize: brandSize,
          fontWeight: 900,
          letterSpacing: "-0.05em",
          color: COLORS.text,
          lineHeight: 1,
        }}
      >
        {letters.map((ch, i) => {
          const p = prog(frame, T.logo.lettersAt + i * T.logo.letterEvery, 0.6);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: Math.min(1, p * 2),
                transform: `translateY(${(1 - p) * 0.35}em) rotate(${(1 - p) * 8}deg)`,
                filter: p < 0.6 ? `blur(${(0.6 - p) * 14}px)` : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {/* Pastille URL */}
      {urlIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: pillPos.x,
            top: pillPos.y,
            transform: `translate(-50%, -50%) translateY(${(1 - urlIn) * 40}px) scale(${(0.95 + 0.05 * urlIn) * press})`,
            opacity: Math.min(1, urlIn * 2),
            display: "flex",
            alignItems: "center",
            gap: pillSize * 0.4,
            height: pillSize * 2.1,
            padding: `0 ${pillSize * 0.9}px 0 ${pillSize * 0.7}px`,
            borderRadius: 999,
            background: clicked > 0.5 ? COLORS.accent : COLORS.surface,
            border: `2px solid ${clicked > 0.5 ? COLORS.accent : COLORS.border}`,
            color: clicked > 0.5 ? COLORS.white : COLORS.text,
            fontSize: pillSize,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: `0 20px 50px rgba(${clicked > 0.5 ? COLORS.glow : COLORS.shadow}, ${clicked > 0.5 ? 0.35 : 0.14})`,
            minWidth: pillSize * 7.6,
          }}
        >
          <svg width={pillSize * 0.85} height={pillSize * 0.85} viewBox="0 0 24 24" fill="none" stroke={clicked > 0.5 ? "#fff" : COLORS.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
          <span>{TEXT.url.slice(0, nUrl)}</span>
          {clicked < 0.5 && (
            <span style={{ width: 4, height: pillSize * 1.05, marginLeft: -pillSize * 0.3, borderRadius: 2, background: COLORS.accent, opacity: nUrl > 0 && cursorOn(frame, urlTyping) ? 1 : 0 }} />
          )}
        </div>
      )}
      <Tap x={pillPos.x + (m ? 110 : 90)} y={pillPos.y + (m ? 34 : 26)} at={T.logo.clickAt} size={m ? 96 : 70} />
    </AbsoluteFill>
  );
};
