"use client";

import React from "react";
import { clsx } from "clsx";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = "md",
}) => {
  return (
    <div
      className={clsx(
        "flex items-center gap-1 border-b border-surface-border p-1 bg-surface-base/60",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer select-none",
              size === "sm" ? "text-[11px] py-0.5 px-2" : "text-xs py-1 px-2.5",
              isActive
                ? "bg-surface-elevated text-slate-100 shadow-sm border border-surface-borderHover"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/40 border border-transparent"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  "rounded-full px-1.5 py-0.2 text-[10px] mono-telemetry",
                  isActive
                    ? "bg-status-info/20 text-blue-300 font-semibold"
                    : "bg-surface-card text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
