import React from "react";

/* Révélation par masque : la ligne monte depuis sous sa ligne de base (p 0→1), sort vers le haut (out 0→1). */
export const MaskLine: React.FC<{ p: number; out?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  p,
  out = 0,
  children,
  style,
}) => (
  <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em", ...style }}>
    <div
      style={{
        transform: `translateY(${(1 - p) * 112 - out * 112}%) rotate(${(1 - p) * 3}deg)`,
        transformOrigin: "0% 100%",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  </div>
);
