import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS } from "../config";

/* Carte projet façon app Hive (couverture + titre + tags + infos), rendue nettement à la taille voulue. */
export type CardData = { title: string; by: string; cover: string; tags: string[]; city: string; people: string };

export const ProjectCard: React.FC<{ data: CardData; w: number }> = ({ data, w }) => {
  const u = w / 360;
  return (
    <div
      style={{
        width: w,
        borderRadius: 22 * u,
        overflow: "hidden",
        background: COLORS.surface,
        border: `${1.2 * u}px solid ${COLORS.border}`,
      }}
    >
      <Img src={staticFile(data.cover)} style={{ width: "100%", height: 200 * u, objectFit: "cover", display: "block" }} />
      <div style={{ padding: `${16 * u}px ${18 * u}px ${18 * u}px` }}>
        <div style={{ fontSize: 20 * u, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{data.title}</div>
        <div style={{ fontSize: 13 * u, fontWeight: 500, color: COLORS.muted, marginTop: 4 * u }}>Par {data.by}</div>
        <div style={{ display: "flex", gap: 6 * u, marginTop: 12 * u }}>
          {data.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 12 * u,
                fontWeight: 600,
                color: COLORS.accentHover,
                background: "rgba(224,137,43,0.1)",
                border: `${1 * u}px solid rgba(224,137,43,0.3)`,
                borderRadius: 99,
                padding: `${3 * u}px ${10 * u}px`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 14 * u,
            paddingTop: 12 * u,
            borderTop: `${1 * u}px solid ${COLORS.border}`,
            fontSize: 12.5 * u,
            fontWeight: 500,
            color: COLORS.muted,
          }}
        >
          <span>{data.people}</span>
          <span>{data.city}</span>
        </div>
      </div>
    </div>
  );
};
