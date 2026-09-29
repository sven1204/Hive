import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, FPS, T, TEXT } from "../config";
import { cursorOn, drift, easeCam, lerp, mix, prog, typedCount } from "../lib/anim";
import { useFormat } from "../lib/format";
import { box } from "../lib/captures";
import { Device, deviceSize, statusBarH } from "../components/Device";
import { MobileNav, Screen } from "../components/Screen";
import { StepLabel } from "../components/StepLabel";
import { WhipBlur } from "../components/WhipBlur";

/* Scène 4 « 01 Crée ton projet » : l'appareil arrive en 3D, la caméra plonge sur le champ Titre
   où « Night Owls — groupe de rock » se tape en direct, puis sortie en whip pan. */
export const Create: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useFormat();
  const { fmt, m, W, H } = L;
  const s = frame / FPS;
  const d = drift(frame);

  const screenW = m ? 760 : 1180;
  const size = deviceSize(fmt, screenW);
  const title = box(fmt, "create", "title");
  const k = screenW / (m ? 390 : 1440);

  // Arrivée 3D de l'appareil
  const arrive = prog(frame, T.create.deviceAt, 1.0);
  const rx = mix(38, 8, arrive);
  const ry = mix(m ? -22 : -28, m ? -6 : -12, arrive);
  const tz = mix(-900, 0, arrive);
  const ty = mix(m ? 700 : 500, 0, arrive);

  // Zoom caméra sur le champ Titre (coordonnées dans l'appareil)
  const zoom = prog(frame, T.create.zoomAt, 1.0, easeCam);
  const bezel = m ? 16 : 0;
  const bar = m ? 0 : 46;
  const statusH = statusBarH(fmt, screenW);
  const fx = bezel + (title.x + title.w * (m ? 0.5 : 0.3)) * k; // point visé (dans l'appareil)
  // défilement de la page pendant le zoom : le champ remonte vers le milieu de l'écran
  const scroll = mix(0, Math.max(0, title.y - (m ? 330 : 380)), prog(frame, T.create.zoomAt - 0.1, 1.0, easeCam));
  const fy = bezel + bar + statusH + (title.y - scroll + title.h / 2) * k;
  const Z = m ? 1.42 : 2.6; // facteur de zoom
  // position de l'appareil au repos (coin haut-gauche)
  const restX = m ? W / 2 - size.outerW / 2 : W - size.outerW - 110;
  const restY = m ? 560 : H / 2 - size.outerH / 2 + 40;
  // cible : le champ vient au centre de l'écran
  const targetX = W / 2 - fx * Z;
  const targetY = (m ? 1000 : 560) - fy * Z;
  const x = mix(restX, targetX, zoom);
  const y = mix(restY, targetY, zoom);
  const sc = mix(1, Z, zoom);
  const rot = mix(1, 0.25, zoom);

  // Whip pan de sortie (vers la gauche) + flou de mouvement
  const whip = prog(frame, T.create.whipAt, 0.35, (t) => t * t * t);
  const whipX = -whip * W * 1.4;
  const blur = lerp(frame, [T.create.whipAt * FPS, (T.create.whipAt + 0.18) * FPS, T.create.end * FPS], [0, 60, 90]);

  // Texte tapé dans le champ
  const n = typedCount(frame, T.create.typeStart, T.create.charEvery, TEXT.typedTitle.length);
  const typing = s >= T.create.typeStart && n < TEXT.typedTitle.length;
  const focus = prog(frame, T.create.zoomAt + 0.5, 0.4);

  return (
    <AbsoluteFill style={{ transform: `translateX(${whipX}px)` }}>
      <WhipBlur amount={blur}>
        <AbsoluteFill style={{ perspective: 2600, transform: `translate(${d.x * rot}px, ${d.y * rot}px)` }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate(${x}px, ${y + ty}px) translateZ(${tz}px) scale(${sc})`,
            }}
          >
            <div
              style={{
                transformOrigin: `${fx}px ${fy}px`,
                transform: `rotateX(${rx * rot + d.rx}deg) rotateY(${ry * rot + d.ry}deg)`,
                opacity: Math.min(1, arrive * 3),
              }}
            >
              <Device fmt={fmt} screenW={screenW} url="hive-app.ch/create-project" shadow={1 - zoom * 0.5}>
                <Screen fmt={fmt} page="create" screenW={screenW} offsetY={scroll}>
                  {(kk) => (
                    <div
                      style={{
                        position: "absolute",
                        left: title.x * kk,
                        top: title.y * kk,
                        width: title.w * kk,
                        height: title.h * kk,
                        borderRadius: 10 * kk,
                        background: COLORS.surface,
                        border: `${1.5 * kk}px solid ${focus > 0.5 ? COLORS.accent : COLORS.border}`,
                        boxShadow: `0 0 0 ${3 * kk * focus}px rgba(${COLORS.glow}, 0.18)`,
                        display: "flex",
                        alignItems: "center",
                        padding: `0 ${11 * kk}px`,
                        fontSize: 15 * kk,
                        fontWeight: 500,
                        color: COLORS.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {n === 0 ? <span style={{ color: COLORS.muted, opacity: 0.75 }}>Ex. Club de foot du dimanche</span> : TEXT.typedTitle.slice(0, n)}
                      {focus > 0 && (
                        <span
                          style={{
                            width: 1.6 * kk,
                            height: 18 * kk,
                            marginLeft: n === 0 ? -1 : 1 * kk,
                            order: n === 0 ? -1 : 0,
                            background: COLORS.accent,
                            borderRadius: kk,
                            opacity: cursorOn(frame, typing) ? 1 : 0,
                          }}
                        />
                      )}
                    </div>
                  )}
                </Screen>
                {m && <MobileNav screenW={screenW} />}
              </Device>
            </div>
          </div>
        </AbsoluteFill>
      </WhipBlur>

      <StepLabel
        num={TEXT.steps[0].num}
        label={TEXT.steps[0].label}
        at={T.create.labelAt}
        size={L.sub}
        style={{ position: "absolute", left: m ? 70 : 110, top: m ? 170 : 90 }}
      />
    </AbsoluteFill>
  );
};
