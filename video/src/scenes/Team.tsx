import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FPS, T, TEXT } from "../config";
import { drift, easeCam, lerp, mix, prog } from "../lib/anim";
import { useFormat } from "../lib/format";
import { box, capture } from "../lib/captures";
import { Device, deviceSize, statusBarH } from "../components/Device";
import { Screen } from "../components/Screen";
import { StepLabel } from "../components/StepLabel";
import { Tap } from "../components/Tap";
import { WhipBlur } from "../components/WhipBlur";
import { AcceptedOverlay, acceptCenter, JoinedToast, REQUEST_CARD, RequestCard, requestCardHeight } from "../components/RequestCard";

/* Scène 5 « 02 Choisis ton équipe » : page Night Owls ; la demande d'Inès sort de l'écran en 3D
   pendant que l'appareil s'assombrit ; tap sur Accepter → « Accepté » → pastille de confirmation. */
export const Team: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useFormat();
  const { fmt, m, W, H } = L;
  const d = drift(frame);

  const screenW = m ? 700 : 1180;
  const size = deviceSize(fmt, screenW);
  const k = screenW / (m ? 390 : 1440);
  const devX = W / 2 - size.outerW / 2;
  const devY = H / 2 - size.outerH / 2 + (m ? 20 : 30);
  const bezel = m ? 16 : 0;
  const bar = m ? 0 : 46;

  // Entrée en whip pan (depuis la droite)
  const whipIn = prog(frame, T.team.start, 0.45);
  const inX = (1 - whipIn) * W * 1.3;
  const inBlur = lerp(frame, [T.team.start * FPS, (T.team.start + 0.3) * FPS], [80, 0]);

  // La carte sort de l'écran
  const lift = prog(frame, T.team.cardOutAt, 0.9);
  const tilt = prog(frame, T.team.cardOutAt, 1.4, easeCam);
  const back = prog(frame, T.team.end - 0.4, 0.4, easeCam); // retour dans l'écran avant la scène 03
  const L1 = lift; // la carte reste « sortie » ; le retour est géré par `back`
  const dim = lift * (1 - back);

  // Rectangle d'origine (capture) → rectangle final (centre, grand)
  const b = box(fmt, "detail", "request");
  const from = { x: devX + bezel + b.x * k, y: devY + bezel + bar + statusBarH(fmt, screenW) + b.y * k, w: b.w * k };
  const u = m ? 2.45 : 2.2;
  const cardW = REQUEST_CARD.w * u;
  const cardH = requestCardHeight(u);
  const to = { x: W / 2 - cardW / 2, y: (m ? 1000 : 520) - cardH / 2 };
  // Échelle apparente : la carte nette démarre à la largeur de la capture
  const s0 = from.w / cardW;
  const sc = mix(s0, 1, L1);
  const cx = mix(from.x, to.x, L1);
  const cy = mix(from.y, to.y, L1);
  const cropFade = 1 - prog(frame, T.team.cardOutAt + 0.05, 0.22, (t) => t);

  // Accepter
  const accepted = prog(frame, T.team.acceptedAt, 0.45);
  const press = lerp(frame, [(T.team.tapAt - 0.05) * FPS, T.team.tapAt * FPS, (T.team.tapAt + 0.14) * FPS], [1, 0.96, 1]);
  const ac = acceptCenter(u);
  const toast = prog(frame, T.team.toastAt, 0.7);
  const glow = lerp(frame, [T.team.acceptedAt * FPS, (T.team.acceptedAt + 0.2) * FPS, (T.team.acceptedAt + 0.9) * FPS], [0, 1, 0]);

  const cap = capture(fmt, "detail");
  const acc = box(fmt, "detail", "accept");
  const dec = box(fmt, "detail", "decline");
  // retour : la carte file vers sa place dans l'écran en se dissolvant
  const slotCX = from.x + from.w / 2;
  const slotCY = from.y + (b.h * k) / 2;
  const backDX = (slotCX - (to.x + cardW / 2)) * back;
  const backDY = (slotCY - (to.y + cardH / 2)) * back;

  return (
    <AbsoluteFill style={{ transform: `translateX(${inX}px)` }}>
      <WhipBlur amount={inBlur}>
        <AbsoluteFill style={{ transform: `translate(${d.x}px, ${d.y}px)` }}>
          {/* Appareil (s'assombrit derrière la carte) */}
          <div
            style={{
              position: "absolute",
              left: devX,
              top: devY,
              transform: `perspective(2400px) rotateX(${d.rx}deg) rotateY(${d.ry}deg) scale(${1 - dim * 0.04})`,
              filter: `brightness(${1 - dim * 0.1}) blur(${dim * 3}px)`,
            }}
          >
            <Device fmt={fmt} screenW={screenW} url="hive-app.ch/projects/night-owls">
              <Screen fmt={fmt} page="detail" screenW={screenW}>
                {(kk) => (
                  <>
                  <AcceptedOverlay accept={acc} decline={dec} kk={kk} opacity={back} />
                  // la carte a quitté l'écran : on laisse une empreinte vide à sa place
                  <div
                    style={{
                      position: "absolute",
                      left: b.x * kk,
                      top: b.y * kk,
                      width: b.w * kk,
                      height: b.h * kk,
                      borderRadius: 14 * kk,
                      background: COLORS.cardSoft,
                      border: `${1.5 * kk}px dashed ${COLORS.border}`,
                      opacity: (1 - cropFade) * (1 - back),
                    }}
                  />
                  </>
                )}
              </Screen>
            </Device>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: m ? 86 : 18,
                background: `rgba(${COLORS.shadow}, ${dim * 0.32})`,
              }}
            />
          </div>

          {/* Carte qui sort de l'écran */}
          {lift > 0 && back < 1 && (
            <div
              style={{
                position: "absolute",
                left: cx,
                top: cy,
                transformOrigin: "0 0",
                opacity: 1 - back,
                transform: `translate(${backDX}px, ${backDY}px) perspective(1800px) scale(${sc * (1 - back * 0.55)}) rotateX(${Math.sin(tilt * Math.PI) * -14 + 3 * L1}deg) rotateY(${Math.sin(tilt * Math.PI) * 6}deg)`,
                filter: `drop-shadow(0 ${40 * L1}px ${60 * L1}px rgba(${COLORS.shadow}, ${0.3 * L1}))`,
              }}
            >
              <div style={{ position: "relative", borderRadius: 18 * u, boxShadow: `0 0 0 ${16 * glow}px rgba(${COLORS.glow}, ${0.18 * glow})` }}>
                <RequestCard u={u} accepted={accepted} press={press} />
                {cropFade > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 14 * u,
                      overflow: "hidden",
                      opacity: cropFade,
                      backgroundImage: `url(${staticFile(cap.file)})`,
                      backgroundSize: `${(cap.viewport.width / b.w) * 100}% ${(cap.viewport.height / b.h) * 100}%`,
                      backgroundPosition: `${(b.x / (cap.viewport.width - b.w)) * 100}% ${(b.y / (cap.viewport.height - b.h)) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Pastille « Inès a rejoint Night Owls » */}
          {toast > 0 && (
            <div
              style={{
                position: "absolute",
                left: W / 2,
                top: to.y + cardH + (m ? 90 : 60),
                transform: `translate(-50%, ${(1 - toast) * 50}px) scale(${0.95 + 0.05 * toast})`,
                opacity: Math.min(1, toast * 2) * (1 - Math.min(1, back * 2.5)),
                filter: toast < 0.4 ? `blur(${(0.4 - toast) * 12}px)` : undefined,
              }}
            >
              <JoinedToast size={m ? 38 : 30} />
            </div>
          )}

          <Tap x={to.x + ac.x} y={to.y + ac.y} at={T.team.tapAt} size={m ? 100 : 76} />
        </AbsoluteFill>
      </WhipBlur>

      <StepLabel
        num={TEXT.steps[1].num}
        label={TEXT.steps[1].label}
        at={T.team.labelAt}
        outAt={T.team.end - 0.3}
        size={L.sub}
        style={{ position: "absolute", left: m ? 70 : 110, top: m ? 170 : 90 }}
      />
    </AbsoluteFill>
  );
};

