import React, { useMemo } from "react";
import * as THREE from "three";
import { COLORS, FONT } from "../config";

/* Bulle de BD en vraie 3D : forme arrondie + queue côté expéditeur, extrudée avec biseau,
   matériau satiné, texte (nom + message) en texture sur la face avant. */

export type BubbleSpec = {
  name?: string;
  nameColor?: string;
  text: string;
  mine: boolean;
};

export type BubbleLayout = {
  wPx: number;
  hPx: number;
  canvas: HTMLCanvasElement;
  shadow: HTMLCanvasElement;
};

const SHADOW_BLUR = 34; // px, ombre douce brune (jamais noire)

function drawShadow(wPx: number, hPx: number, radius: number) {
  const pad = SHADOW_BLUR * 2;
  const c = document.createElement("canvas");
  c.width = wPx + pad * 2;
  c.height = hPx + pad * 2;
  const ctx = c.getContext("2d")!;
  ctx.filter = `blur(${SHADOW_BLUR}px)`;
  ctx.fillStyle = "rgba(58, 38, 22, 0.55)";
  ctx.beginPath();
  ctx.roundRect(pad, pad, wPx, hPx, radius);
  ctx.fill();
  return c;
}

export type TypeScale = { name: number; text: number; pad: number; maxW: number; line: number; radius: number };

const TEX_SCALE = 3; // résolution de la texture (x3 : texte net même de près)

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Mesure le texte et dessine la texture de la face avant (px « écran »). */
export function layoutBubble(spec: BubbleSpec, ts: TypeScale): BubbleLayout {
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `500 ${ts.text}px ${FONT}`;
  const lines = wrap(measure, spec.text, ts.maxW - ts.pad * 2);
  const textW = Math.max(...lines.map((l) => measure.measureText(l).width));
  measure.font = `700 ${ts.name}px ${FONT}`;
  const nameW = spec.name ? measure.measureText(spec.name).width : 0;
  const wPx = Math.ceil(Math.max(textW, nameW) + ts.pad * 2);
  const nameH = spec.name ? ts.name * 1.45 : 0;
  const hPx = Math.ceil(ts.pad * 1.55 + nameH + lines.length * ts.line);

  const canvas = document.createElement("canvas");
  canvas.width = wPx * TEX_SCALE;
  canvas.height = hPx * TEX_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(TEX_SCALE, TEX_SCALE);
  ctx.textBaseline = "alphabetic";
  let y = ts.pad * 0.78;
  if (spec.name) {
    ctx.font = `700 ${ts.name}px ${FONT}`;
    ctx.fillStyle = spec.nameColor || COLORS.accent;
    ctx.fillText(spec.name, ts.pad, y + ts.name);
    y += nameH;
  }
  ctx.font = `500 ${ts.text}px ${FONT}`;
  ctx.fillStyle = spec.mine ? "#FFFFFF" : COLORS.text;
  lines.forEach((l, i) => ctx.fillText(l, ts.pad, y + ts.text * 0.98 + i * ts.line));
  return { wPx, hPx, canvas, shadow: drawShadow(wPx, hPx, ts.radius) };
}

/** Contour de bulle (unités monde). Queue en bas, à droite si mine, sinon à gauche. */
function bubbleShape(w: number, h: number, r: number, mine: boolean) {
  const sx = mine ? 1 : -1;
  const X = (x: number) => x * sx;
  const tw = r * 0.9; // largeur de la queue
  const th = r * 0.62; // hauteur de la queue
  const s = new THREE.Shape();
  s.moveTo(X(-w / 2 + r), h / 2);
  s.lineTo(X(w / 2 - r), h / 2);
  s.quadraticCurveTo(X(w / 2), h / 2, X(w / 2), h / 2 - r);
  s.lineTo(X(w / 2), -h / 2 + r * 0.55);
  // queue : descend et pointe vers l'extérieur, puis revient sur le bord bas
  s.quadraticCurveTo(X(w / 2 + r * 0.02), -h / 2 - th * 0.45, X(w / 2 + tw * 0.42), -h / 2 - th);
  s.quadraticCurveTo(X(w / 2 - tw * 0.25), -h / 2 - th * 0.55, X(w / 2 - r - tw * 0.35), -h / 2);
  s.lineTo(X(-w / 2 + r), -h / 2);
  s.quadraticCurveTo(X(-w / 2), -h / 2, X(-w / 2), -h / 2 + r);
  s.lineTo(X(-w / 2), h / 2 - r);
  s.quadraticCurveTo(X(-w / 2), h / 2, X(-w / 2 + r), h / 2);
  return s;
}

export const Bubble3D: React.FC<{
  layout: BubbleLayout;
  mine: boolean;
  glass?: boolean; // verre dépoli translucide (messages des autres), sans fond coloré
  unit: number; // unités monde par px
  radiusPx: number;
  opacity?: number;
}> = ({ layout, mine, glass = false, unit, radiusPx, opacity = 1 }) => {
  const w = layout.wPx * unit;
  const h = layout.hPx * unit;
  const r = Math.min(radiusPx * unit, h / 2);
  const depth = 0.1;
  const bevelT = 0.055;
  const bevelS = 0.05;

  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(bubbleShape(w, h, r, mine), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevelT,
      bevelSize: bevelS,
      bevelSegments: 8,
      curveSegments: 28,
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [w, h, r, mine]);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(layout.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, [layout.canvas]);

  const shadowTex = useMemo(() => new THREE.CanvasTexture(layout.shadow), [layout.shadow]);
  const shW = layout.shadow.width * unit;
  const shH = layout.shadow.height * unit;

  const color = mine ? COLORS.accent : COLORS.white; // messages des autres : fond blanc
  const transparent = opacity < 0.999;

  return (
    <group>
      {/* ombre portée douce, décalée vers le bas et en retrait */}
      <mesh position={[0.06, -0.2, -0.55]} scale={1.04}>
        <planeGeometry args={[shW, shH]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={(glass ? 0.22 : 0.55) * opacity} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry} renderOrder={glass ? 1 : 0}>
        {glass ? (
          <meshPhysicalMaterial
            color="#FFFFFF"
            roughness={0.18}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.12}
            transparent
            opacity={0.3 * opacity}
            depthWrite={false}
          />
        ) : (
          <meshPhysicalMaterial
            color={color}
            roughness={mine ? 0.42 : 0.5}
            metalness={0}
            clearcoat={0.35}
            clearcoatRoughness={0.38}
            sheen={0.25}
            sheenColor={mine ? "#FFD7A8" : "#FFFFFF"}
            transparent={transparent}
            opacity={opacity}
          />
        )}
      </mesh>
      <mesh position={[0, 0, depth / 2 + bevelT + 0.003]} renderOrder={2}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
};
