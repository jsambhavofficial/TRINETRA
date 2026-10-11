"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", icon, loading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info focus-visible:ring-offset-1 focus-visible:ring-offset-space-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      primary: "bg-status-info hover:bg-blue-600 text-white shadow-sm border border-blue-500/30",
      secondary: "bg-surface-elevated hover:bg-space-700 text-slate-200 border border-surface-border hover:border-surface-borderHover",
      outline: "bg-transparent hover:bg-surface-elevated text-slate-300 border border-surface-border hover:border-surface-borderHover",
      ghost: "bg-transparent hover:bg-surface-elevated text-slate-300 hover:text-white",
      destructive: "bg-status-critical/20 hover:bg-status-critical/30 text-red-300 border border-status-critical/40",
      accent: "bg-epistemic-simulated hover:bg-purple-600 text-white shadow-sm border border-purple-400/30",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-xs px-3.5 py-2 gap-2",
      lg: "text-sm px-4.5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
