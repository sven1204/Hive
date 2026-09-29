import React, { useId } from "react";

/* Flou de mouvement directionnel (filtre SVG) pour les whip pans et transitions rapides. */
export const WhipBlur: React.FC<{ amount: number; axis?: "x" | "y"; children: React.ReactNode }> = ({ amount, axis = "x", children }) => {
  const id = `whip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  if (amount < 0.3) return <>{children}</>;
  const std = axis === "x" ? `${amount} 0` : `0 ${amount}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={std} />
        </filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, filter: `url(#${id})` }}>{children}</div>
    </>
  );
};
