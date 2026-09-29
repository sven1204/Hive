import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { CHAT, COLORS, FPS, PEOPLE, PERSON_COLORS, T, TEXT } from "../config";
import { cursorOn, drift, easeCam, lerp, mix, prog, typedCount } from "../lib/anim";
import { useFormat, type Fmt } from "../lib/format";
import { fontsReady } from "../lib/fonts";
import { Bubble3D, layoutBubble, type BubbleLayout, type BubbleSpec, type TypeScale } from "../components/Bubble3D";
import { Device, deviceSize } from "../components/Device";
import { Screen } from "../components/Screen";
import { AcceptedOverlay } from "../components/RequestCard";
import { box } from "../lib/captures";
import { StepLabel } from "../components/StepLabel";
import { Tap } from "../components/Tap";

/* Scène 6 « 03 Lancez-vous » : l'appareil recule (flou + assombri), les messages du groupe
   jaillissent de l'écran en bulles 3D, puis « Let's go » part du champ de saisie et se range en bas de la conversation. */

const CAM_Z = 12;
const FOV = 30;
const VISIBLE_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);

const TYPE: Record<Fmt, TypeScale> = {
  mobile: { name: 29, text: 40, pad: 36, maxW: 760, line: 51, radius: 44 },
  desktop: { name: 21, text: 29, pad: 28, maxW: 560, line: 38, radius: 32 },
};

/* Mise en page « messagerie » : les messages s'empilent de haut en bas, les miens à droite,
   ceux des autres à gauche (deux profondeurs). Quand la pile atteint le champ de saisie,
   elle défile vers le haut. */
const COLUMN = {
  mobile: { left: 64, right: 64, top: 330, gap: 30, bottom: 1560, fadeTop: 300, zOther: 0, zMine: 0.3, ry: 6 },
  desktop: { left: 420, right: 420, top: 185, gap: 18, bottom: 900, fadeTop: 170, zOther: -0.7, zMine: 0.35, ry: 7 },
};

const SPECS: BubbleSpec[] = [
  ...CHAT.map((m) => ({
    mine: m.from === "me",
    name: m.from === "me" ? undefined : PEOPLE[m.from].displayName,
    nameColor: m.from === "me" ? undefined : PERSON_COLORS[m.from],
    text: m.text,
  })),
  { mine: true, text: TEXT.composer },
];

const appearAt = (i: number) => (i < CHAT.length ? T.chat.firstBubbleAt + i * T.chat.bubbleEvery : T.chat.sendAt + 0.04);

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const t = frame / FPS;
  camera.position.set(Math.sin(t * 0.55) * 0.45, Math.cos(t * 0.42) * 0.25, CAM_Z);
  camera.lookAt(0, 0, -1.2);
  return null;
};

const Bubbles: React.FC<{ layouts: BubbleLayout[]; fmt: Fmt; W: number; H: number; composer: { x: number; y: number } }> = ({
  layouts,
  fmt,
  W,
  H,
  composer,
}) => {
  const frame = useCurrentFrame();
  const unit = VISIBLE_H / H;
  const toWorld = (px: number, py: number) => [(px - W / 2) * unit, -(py - H / 2) * unit] as const;
  const col = COLUMN[fmt];
  const t = frame / FPS;
  const ts0 = TYPE[fmt];
  const tail = ts0.radius * 0.62; // hauteur de la queue sous la bulle
  const tops: number[] = [];
  let yCur = col.top;
  layouts.forEach((L) => {
    tops.push(yCur);
    yCur += L.hPx + tail + col.gap;
  });
  // défilement : chaque bulle qui dépasse la limite basse fait remonter la pile
  let scroll = 0;
  let prevOver = 0;
  layouts.forEach((L, i) => {
    const over = Math.max(0, tops[i] + L.hPx + tail - col.bottom);
    scroll += (over - prevOver) * prog(frame, appearAt(i), 0.8, easeCam);
    prevOver = over;
  });
  const exit = prog(frame, T.chat.end - 0.02, 0.4, (x) => easeCam(x));
  const ts = TYPE[fmt];

  return (
    <>
      {SPECS.map((spec, i) => {
        const a = appearAt(i);
        const isSend = i === SPECS.length - 1;
        const e = isSend ? prog(frame, a, 0.6, easeCam) : prog(frame, a, 0.9);
        if (e <= 0) return null;
        const L = layouts[i];
        const w = L.wPx;
        const px = spec.mine ? W - col.right - w / 2 : col.left + w / 2;
        const py = tops[i] + L.hPx / 2 - scroll;
        const [wx, wy] = toWorld(px, py);
        const wz = spec.mine ? col.zMine : col.zOther;
        const ry = spec.mine ? -col.ry : col.ry;
        const rz = spec.mine ? 1.1 : -1.1;

        // départ : depuis l'écran de l'appareil (loin derrière), ou depuis le champ de saisie
        const [sx, sy] = isSend ? toWorld(composer.x, composer.y) : toWorld(W / 2, H * 0.52);
        const sz = isSend ? 0.6 : -4.2;
        const x = mix(sx, wx, e);
        const y = mix(sy, wy, isSend ? Math.min(1, e * 1.08) : e);
        const z = mix(sz, wz, e);
        const float = Math.min(1, e * 1.5);
        const fy = Math.sin(t * 1.15 + i * 1.7) * 0.03 * float;
        const frz = Math.sin(t * 0.8 + i) * 0.6 * float;
        const rotX = mix(isSend ? -12 : 25, 5, e) + Math.sin(t * 0.9 + i * 2.1) * 1.2 * float;
        const scale = mix(0.94, 1, e);
        // les messages qui remontent sous le label s'estompent, comme dans une messagerie qui défile
        const scrolledOut = Math.min(1, Math.max(0, (col.fadeTop - (py - L.hPx / 2)) / 140));
        const opacity = Math.min(1, e * 3.5) * (1 - exit) * (1 - scrolledOut);
        const d2r = Math.PI / 180;
        return (
          <group
            key={i}
            position={[x, y + fy + exit * (fmt === "mobile" ? 0.4 : 0.2) * (i % 2 ? 1 : -1), z + exit * 9]}
            rotation={[rotX * d2r, ry * d2r, (rz + frz) * d2r]}
            scale={scale}
          >
            <Bubble3D layout={L} mine={spec.mine} unit={unit} radiusPx={ts.radius} opacity={opacity} />
          </group>
        );
      })}
    </>
  );
};

export const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useFormat();
  const { fmt, m, W, H } = L;
  const s = frame / FPS;
  const [layouts, setLayouts] = useState<BubbleLayout[] | null>(null);
  const [handle] = useState(() => delayRender("Mise en page des bulles 3D"));

  useEffect(() => {
    let alive = true;
    fontsReady
      .then(() => document.fonts.ready)
      .then(() => {
        if (!alive) return;
        setLayouts(SPECS.map((spec) => layoutBubble(spec, TYPE[fmt])));
        continueRender(handle);
      });
    return () => {
      alive = false;
    };
  }, [fmt, handle]);

  // ── Appareil qui recule en arrière-plan
  const screenW = m ? 700 : 1180;
  const size = deviceSize(fmt, screenW);
  const enter = prog(frame, T.chat.start, 0.5, easeCam); // arrivée de la page messagerie (poussée verticale)
  const back = prog(frame, T.chat.deviceBackAt, 0.9, easeCam);
  const d = drift(frame);
  const exit = prog(frame, T.chat.end - 0.02, 0.4, easeCam);

  // ── Champ de saisie flottant
  const cIn = prog(frame, T.chat.composerAt, 0.6);
  const n = typedCount(frame, T.chat.typeStart, T.chat.charEvery, TEXT.composer.length);
  const sent = s >= T.chat.sendAt + 0.04;
  const typing = s >= T.chat.typeStart && n < TEXT.composer.length;
  const composer = { x: W / 2, y: m ? 1700 : 985 };
  const cW = m ? 900 : 860;
  const cH = m ? 128 : 92;
  const sendD = cH - (m ? 24 : 18);
  const sendX = composer.x + cW / 2 - sendD / 2 - (m ? 12 : 9);

  return (
    <AbsoluteFill>
      {/* Appareil */}
      <AbsoluteFill style={{ perspective: 2400, transform: `translate(${d.x}px, ${d.y}px)` }}>
        <div
          style={{
            position: "absolute",
            left: W / 2 - size.outerW / 2,
            top: H / 2 - size.outerH / 2 + (m ? 20 : 30),
            transform: `translateZ(${-back * 420}px) rotateX(${back * 6 + d.rx}deg) rotateY(${d.ry}deg) scale(${1 - exit * 0.1})`,
            filter: `blur(${back * 7}px) brightness(${1 - back * 0.12}) saturate(${1 - back * 0.25})`,
            opacity: 1 - exit,
          }}
        >
          <Device fmt={fmt} screenW={screenW} url="hive-app.ch/messages">
            <Screen fmt={fmt} page="detail" screenW={screenW} style={{ transform: `translateY(${-enter * size.screenH}px)` }}>
              {(kk) => {
                // continuité avec la scène 02 : la demande d'Inès est déjà acceptée
                return <AcceptedOverlay accept={box(fmt, "detail", "accept")} decline={box(fmt, "detail", "decline")} kk={kk} opacity={1} />;
              }}
            </Screen>
            <Screen fmt={fmt} page="chat" screenW={screenW} style={{ transform: `translateY(${(1 - enter) * size.screenH}px)` }} />
          </Device>
          <AbsoluteFill style={{ background: `rgba(${COLORS.shadow}, ${back * 0.14})`, borderRadius: m ? 86 : 18 }} />
        </div>
      </AbsoluteFill>

      {/* Bulles 3D */}
      {layouts && (
        <ThreeCanvas
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
          dpr={1}
        >
          <CameraRig />
          <hemisphereLight args={["#FFFFFF", "#EADFCB", 2.0]} />
          <directionalLight
            position={[-4, 6, 10]}
            intensity={2.3}
            color="#FFFBF4"
          />
          <directionalLight position={[5, -3, 6]} intensity={0.35} color="#FFD9B0" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2.2} color="#FFF3E2" position={[-4, 5, 6]} scale={[6, 3, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#FFD8A8" position={[5, -2, 4]} scale={[4, 4, 1]} />
          </Environment>
          <Bubbles layouts={layouts} fmt={fmt} W={W} H={H} composer={composer} />
        </ThreeCanvas>
      )}

      {/* Champ de saisie flottant */}
      {cIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: composer.x - cW / 2,
            top: composer.y - cH / 2,
            width: cW,
            height: cH,
            borderRadius: 999,
            background: COLORS.surface,
            border: `2px solid ${typing || n > 0 ? COLORS.accent : COLORS.border}`,
            boxShadow: `0 26px 60px rgba(${COLORS.shadow}, 0.18), 0 0 0 ${8 * cIn}px rgba(${COLORS.glow}, 0.08)`,
            transform: `translateY(${(1 - cIn) * 70 + exit * 60}px) scale(${0.95 + 0.05 * cIn})`,
            opacity: Math.min(1, cIn * 2) * (1 - exit),
            display: "flex",
            alignItems: "center",
            padding: `0 ${m ? 44 : 34}px`,
            fontSize: m ? 42 : 30,
            fontWeight: 500,
            color: COLORS.text,
            whiteSpace: "nowrap",
          }}
        >
          {!sent && n === 0 && <span style={{ color: COLORS.muted, opacity: 0.8 }}>Écrire à Night Owls…</span>}
          {!sent && TEXT.composer.slice(0, n)}
          {!sent && (
            <span style={{ width: 4, height: m ? 50 : 36, marginLeft: 3, borderRadius: 2, background: COLORS.accent, opacity: cursorOn(frame, typing) ? 1 : 0 }} />
          )}
          <div
            style={{
              position: "absolute",
              right: m ? 12 : 9,
              top: (cH - sendD) / 2 - 2,
              width: sendD,
              height: sendD,
              borderRadius: 999,
              background: n > 0 || sent ? COLORS.accent : COLORS.card,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${lerp(frame, [(T.chat.sendAt - 0.04) * FPS, T.chat.sendAt * FPS, (T.chat.sendAt + 0.12) * FPS], [1, 0.9, 1])})`,
              boxShadow: n > 0 ? `0 8px 20px rgba(${COLORS.glow}, 0.35)` : undefined,
            }}
          >
            <svg width={sendD * 0.46} height={sendD * 0.46} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
      <Tap x={sendX} y={composer.y} at={T.chat.sendAt} size={m ? 96 : 64} />

      {/* Label d'étape */}
      <StepLabel
        num={TEXT.steps[2].num}
        label={TEXT.steps[2].label}
        at={T.chat.labelAt}
        outAt={T.chat.end - 0.15}
        size={L.sub}
        style={{ position: "absolute", left: m ? 70 : 110, top: m ? 170 : 90 }}
      />
    </AbsoluteFill>
  );
};
