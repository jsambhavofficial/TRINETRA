"use client";

import React from "react";
import { clsx } from "clsx";

export interface MetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  change?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  variant?: "neutral" | "info" | "warning" | "critical" | "success";
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  subtext,
  change,
  icon,
  variant = "neutral",
}) => {
  const valueColor = {
    neutral: "text-slate-100",
    info: "text-blue-400",
    warning: "text-amber-400",
    critical: "text-red-400",
    success: "text-emerald-400",
  }[variant];

  return (
    <div className="glass-panel rounded p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mono-telemetry mb-1">
        <span>{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={clsx("text-xl font-bold mono-telemetry tracking-tight", valueColor)}>
          {value}
        </span>
        {change && (
          <span
            className={clsx(
              "text-[11px] font-semibold mono-telemetry",
              change.trend === "up"
                ? "text-emerald-400"
                : change.trend === "down"
                ? "text-red-400"
                : "text-slate-400"
            )}
          >
            {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "•"}{" "}
            {change.value}
          </span>
        )}
      </div>
      {subtext && <p className="text-[11px] text-slate-500 mt-1 truncate">{subtext}</p>}
    </div>
  );
};
