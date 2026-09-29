import React from "react";
import { COLORS } from "../config";

const DOTS = ["#E0892B", "#B79BE3", "#7FA6E0", "#E48A73", "#8FBF8A", "#E8A547"];

/* Pastille de rôle (Batteuse, Bassiste…) avec avatar-initiale coloré. */
export const RolePill: React.FC<{ label: string; index: number; size: number; style?: React.CSSProperties }> = ({ label, index, size, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: size * 0.32,
      padding: `${size * 0.26}px ${size * 0.55}px ${size * 0.26}px ${size * 0.26}px`,
      borderRadius: 999,
      background: COLORS.surface,
      border: `2px solid ${COLORS.border}`,
      boxShadow: `0 14px 30px rgba(${COLORS.shadow}, 0.12), 0 2px 6px rgba(${COLORS.shadow}, 0.06)`,
      fontSize: size,
      fontWeight: 700,
      color: COLORS.text,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span
      style={{
        width: size * 1.25,
        height: size * 1.25,
        borderRadius: 999,
        background: DOTS[index % DOTS.length],
        color: "#fff",
        fontSize: size * 0.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label[0]}
    </span>
    {label}
  </div>
);
