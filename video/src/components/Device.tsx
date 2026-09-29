import React from "react";
import { COLORS } from "../config";
import type { Fmt } from "../lib/format";

/* Appareil : téléphone (mobile) ou fenêtre de navigateur (desktop).
   `screenW` = largeur de l'écran en px ; l'écran garde le ratio du viewport capturé. */
export const DEVICE = {
  mobile: { vw: 390, vh: 844, bezel: 16, radius: 86, bar: 0 },
  desktop: { vw: 1440, vh: 900, bezel: 0, radius: 18, bar: 46 },
};

/** Hauteur de la barre d'état (px écran) : le contenu de l'app commence en dessous. */
export function statusBarH(fmt: Fmt, screenW: number) {
  return fmt === "mobile" ? (47 * screenW) / 390 : 0;
}

const StatusBar: React.FC<{ screenW: number }> = ({ screenW }) => {
  const k = screenW / 390;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 47 * k,
        background: COLORS.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${4 * k}px ${30 * k}px 0 ${36 * k}px`,
        fontSize: 16 * k,
        fontWeight: 700,
        color: COLORS.text,
        zIndex: 5,
      }}
    >
      <span>9:41</span>
      <span style={{ display: "flex", gap: 6 * k, alignItems: "center" }}>
        <svg width={18 * k} height={12 * k} viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 3} width={3.4} height={3 + i * 3} rx={1} fill={COLORS.text} />
          ))}
        </svg>
        <svg width={27 * k} height={13 * k} viewBox="0 0 27 13">
          <rect x={0.5} y={0.5} width={23} height={12} rx={3.5} fill="none" stroke={COLORS.text} strokeOpacity={0.45} />
          <rect x={2.5} y={2.5} width={17} height={8} rx={2} fill={COLORS.text} />
          <rect x={24.5} y={4.5} width={1.8} height={4} rx={0.9} fill={COLORS.text} fillOpacity={0.45} />
        </svg>
      </span>
    </div>
  );
};

export function deviceSize(fmt: Fmt, screenW: number) {
  const d = DEVICE[fmt];
  const screenH = (screenW * d.vh) / d.vw;
  return { screenW, screenH, outerW: screenW + d.bezel * 2, outerH: screenH + d.bezel * 2 + d.bar };
}

export const Device: React.FC<{
  fmt: Fmt;
  screenW: number;
  url?: string;
  children: React.ReactNode;
  shadow?: number;
  style?: React.CSSProperties;
}> = ({ fmt, screenW, url = "hive-app.ch", children, shadow = 1, style }) => {
  const d = DEVICE[fmt];
  const { screenH, outerW, outerH } = deviceSize(fmt, screenW);
  const sh = `0 ${60 * shadow}px ${120 * shadow}px rgba(${COLORS.shadow}, ${0.22 * shadow}), 0 ${14 * shadow}px ${30 * shadow}px rgba(${COLORS.shadow}, ${0.12 * shadow})`;

  if (fmt === "mobile") {
    return (
      <div
        style={{
          width: outerW,
          height: outerH,
          borderRadius: d.radius,
          background: "linear-gradient(145deg, #3A2C1F, #1E160F)",
          padding: d.bezel,
          boxShadow: `${sh}, inset 0 0 0 2px rgba(255,255,255,0.08)`,
          position: "relative",
          ...style,
        }}
      >
        <div style={{ width: screenW, height: screenH, borderRadius: d.radius - d.bezel, overflow: "hidden", position: "relative", background: COLORS.bg }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: statusBarH("mobile", screenW), overflow: "hidden" }}>{children}</div>
          <StatusBar screenW={screenW} />
          <div
            style={{
              position: "absolute",
              top: screenW * 0.028,
              left: "50%",
              width: screenW * 0.3,
              height: screenW * 0.085,
              transform: "translateX(-50%)",
              borderRadius: 999,
              background: "#140E09",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: outerW,
        height: outerH,
        borderRadius: d.radius,
        background: COLORS.surface,
        border: `1.5px solid ${COLORS.border}`,
        boxShadow: sh,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div style={{ height: d.bar, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: `1.5px solid ${COLORS.border}` }}>
        {["#E8A06A", "#EAC27A", "#C9B89C"].map((c) => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
        ))}
        <div
          style={{
            margin: "0 auto",
            height: 28,
            padding: "0 90px",
            borderRadius: 99,
            background: COLORS.card,
            display: "flex",
            alignItems: "center",
            fontSize: 15,
            fontWeight: 500,
            color: COLORS.muted,
          }}
        >
          {url}
        </div>
        <span style={{ width: 55 }} />
      </div>
      <div style={{ width: screenW, height: screenH, overflow: "hidden", position: "relative", background: COLORS.bg }}>{children}</div>
    </div>
  );
};
