import React from "react";
import { COLORS } from "../config";

export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: COLORS.accent }}>{children}</span>
);
