import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, FPS, T, TEXT } from "../config";
import { drift, easeCam, lerp, mix, prog } from "../lib/anim";
import { useFormat } from "../lib/format";
import { ProjectCard } from "../components/ProjectCard";
import { MaskLine } from "../components/MaskLine";
import { Accent } from "../components/Accent";

/* Scène 7 : trois cartes projet arrivent en 3D l'une après l'autre (pile en éventail),
   avec « Un club. / Une startup. / Un groupe. » et un léger punch de scale à chaque arrivée. */
export const Montage: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useFormat();
  const { m, W, H } = L;
  const d = drift(frame);
  const at = (i: number) => T.montage.start + 0.05 + i * T.montage.cardEvery;
  const cardW = m ? 740 : 560;
  const center = m ? { x: W / 2, y: 1130 } : { x: 1300, y: H / 2 + 20 };
  const exit = prog(frame, T.montage.end - 0.2, 0.3, easeCam);

  // punch de scale global à chaque arrivée de carte
  const punch = TEXT.montage.reduce((acc, _, i) => {
    const t0 = (at(i) + 0.12) * FPS;
    return acc + lerp(frame, [t0, t0 + 3, t0 + 10], [0, 0.025, 0]);
  }, 0);

  return (
    <AbsoluteFill style={{ transform: `translate(${d.x}px, ${d.y}px) scale(${1 + punch})` }}>
      {/* Cartes */}
      <AbsoluteFill style={{ perspective: 2200, opacity: 1 - exit, transform: `scale(${1 - exit * 0.06})` }}>
        {TEXT.montageCards.map((card, i) => {
          const e = prog(frame, at(i), 0.8);
          if (e <= 0) return null;
          // nombre de cartes arrivées après celle-ci → recul dans la pile
          const pushedAll = TEXT.montageCards.reduce((acc, _, j) => (j > i ? acc + prog(frame, at(j), 0.7) : acc), 0);
          // seules les 3 dernières cartes restent visibles dans la pile
          const pushed = Math.min(pushedAll, 2);
          const gone = Math.min(1, Math.max(0, pushedAll - 2));
          if (gone >= 1) return null;
          const side = i % 2 === 0 ? -1 : 1;
          const x = mix(side * (m ? 520 : 700), 0, e) + pushed * side * (m ? 70 : 120);
          const y = mix(m ? 260 : 120, 0, e) - pushed * (m ? 60 : 30);
          const z = mix(-900, 0, e) - pushed * 180;
          const ry = mix(side * -48, 0, e) + pushed * side * 9;
          const rx = mix(22, 0, e) + d.rx;
          const rz = mix(side * 8, 0, e) + pushed * side * -4;
          return (
            <div
              key={card.title}
              style={{
                position: "absolute",
                left: center.x - cardW / 2,
                top: center.y - cardW * 0.62,
                transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry + d.ry}deg) rotateZ(${rz}deg) scale(${0.94 + 0.06 * e})`,
                opacity: Math.min(1, e * 2.5) * (1 - gone),
                filter: `drop-shadow(0 ${40 - pushed * 10}px 60px rgba(${COLORS.shadow}, ${0.22 - pushed * 0.05})) brightness(${1 - pushed * 0.05})`,
                zIndex: i,
              }}
            >
              <ProjectCard data={card} w={cardW} />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Mots */}
      <div
        style={{
          position: "absolute",
          left: m ? 0 : 150,
          width: m ? W : 760,
          top: m ? 250 : H / 2 - 70,
          textAlign: m ? "center" : "left",
          fontSize: m ? 120 : 124,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: COLORS.text,
        }}
      >
        {TEXT.montage.map((w, i) => {
          const p = prog(frame, at(i) + 0.08, 0.55);
          const next = i < TEXT.montage.length - 1 ? prog(frame, at(i + 1) + 0.02, 0.3, easeCam) : exit;
          if (p <= 0 || next >= 1) return null;
          const wordPunch = lerp(frame, [(at(i) + 0.08) * FPS, (at(i) + 0.4) * FPS], [1.08, 1], easeCam);
          return (
            <div key={i} style={{ position: "absolute", inset: 0 }}>
              <MaskLine p={p} out={next}>
                <span style={{ display: "inline-block", transform: `scale(${wordPunch})`, transformOrigin: m ? "50% 60%" : "0% 60%" }}>
                  {w.pre}
                  <Accent>{w.accent}</Accent>
                </span>
              </MaskLine>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
