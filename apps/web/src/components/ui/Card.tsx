"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "base" | "elevated" | "interactive";
  borderAccent?: "none" | "info" | "warning" | "critical" | "simulated";
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = "base",
  borderAccent = "none",
  children,
  ...props
}) => {
  const variantStyles = {
    base: "glass-panel rounded-md p-3.5",
    elevated: "glass-panel-elevated rounded-md p-4 shadow-lg",
    interactive:
      "glass-panel rounded-md p-3.5 cursor-pointer hover:border-surface-borderHover hover:bg-surface-elevated/80 transition-all duration-150",
  };

  const accentStyles = {
    none: "",
    info: "border-l-2 border-l-status-info",
    warning: "border-l-2 border-l-status-warning",
    critical: "border-l-2 border-l-status-critical",
    simulated: "border-l-2 border-l-epistemic-simulated",
  };

  return (
    <div
      className={twMerge(clsx(variantStyles[variant], accentStyles[borderAccent], className))}
      {...props}
    >
      {children}
    </div>
  );
};
