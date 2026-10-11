"use client";

import React from "react";
import { clsx } from "clsx";

export interface StatusIndicatorProps {
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "ACTIVE" | "OFFLINE" | "STABLE";
  label?: string;
  sublabel?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  sublabel,
  pulse = true,
}) => {
  const isHealthy = status === "HEALTHY" || status === "ACTIVE" || status === "STABLE";
  const isDegraded = status === "DEGRADED";
  const isUnhealthy = status === "UNHEALTHY" || status === "OFFLINE";

  const colorClass = isHealthy
    ? "bg-emerald-400"
    : isDegraded
    ? "bg-amber-400"
    : "bg-red-400";

  const pingClass = isHealthy
    ? "bg-emerald-400/40"
    : isDegraded
    ? "bg-amber-400/40"
    : "bg-red-400/40";

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        {pulse && (
          <span
            className={clsx(
              "absolute inline-flex w-full h-full rounded-full animate-ping opacity-75 motion-reduce:hidden",
              pingClass
            )}
          />
        )}
        <span className={clsx("relative inline-flex rounded-full w-2 h-2", colorClass)} />
      </div>
      {label && (
        <span className="text-xs font-medium text-slate-300 mono-telemetry uppercase">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] text-slate-500 mono-telemetry">
          {sublabel}
        </span>
      )}
    </div>
  );
};
