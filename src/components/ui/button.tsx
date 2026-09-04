"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Normalisasi radius: rounded-lg (tidak excessive rounded/pill)
    const baseStyles =
      "inline-flex items-center justify-center font-bold transition select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] rounded-lg";

    // Target sentuh ramah jempol (Touch target >= 44px untuk size md & lg)
    const sizeStyles = {
      sm: "min-h-[36px] px-3 py-1.5 text-xs gap-1.5",
      md: "min-h-[44px] px-4 py-2.5 text-xs sm:text-sm gap-2",
      lg: "min-h-[48px] px-5 py-3 text-sm gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20",
      secondary:
        "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200",
      destructive:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20",
      outline:
        "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
      ghost:
        "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
