"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "nominal"
    | "warning"
    | "critical"
    | "info"
    | "neutral"
    | "observed"
    | "inferred"
    | "predicted"
    | "simulated";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    nominal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    critical: "bg-red-500/10 text-red-400 border-red-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    observed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    inferred: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    predicted: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    simulated: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  const dotColors = {
    nominal: "bg-emerald-400",
    warning: "bg-amber-400",
    critical: "bg-red-400",
    info: "bg-blue-400",
    neutral: "bg-slate-400",
    observed: "bg-cyan-400",
    inferred: "bg-orange-400",
    predicted: "bg-pink-400",
    simulated: "bg-purple-400",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 font-medium tracking-wider",
    md: "text-xs px-2 py-0.5 font-medium",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 uppercase rounded border mono-telemetry select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};
