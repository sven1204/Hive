import React from "react";
import { Img, staticFile } from "remotion";
import { capture, type Box } from "../lib/captures";
import type { Fmt } from "../lib/format";

/* Capture réelle affichée dans l'écran de l'appareil. Les enfants reçoivent l'échelle
   (px écran / px CSS capturé) pour se caler sur les bounding boxes. */
export const Screen: React.FC<{
  fmt: Fmt;
  page: string;
  screenW: number;
  offsetY?: number;
  children?: (k: number) => React.ReactNode;
  style?: React.CSSProperties;
}> = ({ fmt, page, screenW, offsetY = 0, children, style }) => {
  const c = capture(fmt, page);
  const k = screenW / c.viewport.width;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-offsetY * k}px)`, ...style }}>
      <Img src={staticFile(c.file)} style={{ width: screenW, display: "block" }} />
      {children?.(k)}
    </div>
  );
};

/* Barre de navigation mobile de l'app, reprise d'une capture « viewport » et fixée en bas de l'écran. */
export const MobileNav: React.FC<{ screenW: number }> = ({ screenW }) => {
  const c = capture("mobile", "projects");
  const k = screenW / c.viewport.width;
  const navH = 74;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: screenW,
        height: navH * k,
        backgroundImage: `url(${staticFile(c.file)})`,
        backgroundSize: `${screenW}px ${c.viewport.height * k}px`,
        backgroundPosition: "bottom left",
        zIndex: 4,
      }}
    />
  );
};

export const boxStyle = (b: Box, k: number): React.CSSProperties => ({
  position: "absolute",
  left: b.x * k,
  top: b.y * k,
  width: b.w * k,
  height: b.h * k,
});
