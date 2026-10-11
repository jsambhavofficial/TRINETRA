"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  collapsible?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  className,
  title,
  subtitle,
  headerActions,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "glass-panel rounded-md flex flex-col overflow-hidden text-slate-200",
          className
        )
      )}
      {...props}
    >
      {(title || headerActions) && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-surface-border bg-surface-elevated/40">
          <div className="min-w-0">
            {typeof title === "string" ? (
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mono-telemetry truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-1.5 shrink-0">{headerActions}</div>}
        </div>
      )}
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
};
