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
        "bg-[#FFA259] hover:bg-[#F97316] text-stone-900 font-extrabold shadow-sm border border-orange-300 active:bg-orange-600",
      secondary:
        "bg-[#F7F4EE] hover:bg-[#EFE9DF] text-stone-900 font-semibold border border-[#F3ECE2] active:bg-[#E5DDCF]",
      destructive:
        "bg-[#FF7E7E] hover:bg-[#FF6565] text-white font-extrabold shadow-sm border border-rose-300 active:bg-rose-600",
      outline:
        "border border-[#F3ECE2] bg-white text-stone-800 hover:bg-[#FFFDF8] hover:border-[#FFA259] active:bg-stone-50",
      ghost:
        "text-stone-600 hover:bg-[#F7F4EE] hover:text-stone-900",
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
