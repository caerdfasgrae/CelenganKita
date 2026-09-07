import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export interface MobileHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  sticky?: boolean;
  hideOnDesktop?: boolean;
}

/**
 * MobileHeader provides an ergonomic, native-feeling mobile app bar with:
 * 1. Automatic safe-area clearance for Android status bar, camera punch holes, and iOS notches.
 * 2. Finger-friendly back button with >= 44px tap target.
 * 3. Proper horizontal gutters and clear visual hierarchy.
 */
export function MobileHeader({
  title,
  subtitle,
  backHref,
  onBack,
  rightAction,
  className = "",
  sticky = true,
  hideOnDesktop = false,
}: MobileHeaderProps) {
  return (
    <header
      className={`${
        hideOnDesktop ? "md:hidden" : ""
      } w-full pt-safe px-4 pb-3 bg-warm-canvas/95 backdrop-blur-md border-b border-warm-border/50 z-30 select-none ${
        sticky ? "sticky top-0 left-0 right-0" : "relative"
      } ${className}`}
    >
      <div className="flex items-center justify-between min-h-[48px] gap-3">
        {/* Left Side: Back Button or Logo / Mascot */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Kembali ke halaman sebelumnya"
              className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 active:bg-stone-200/50 transition-colors active:scale-90 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.3]" aria-hidden="true" />
            </Link>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke halaman sebelumnya"
              className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-stone-700 hover:text-stone-950 active:bg-stone-200/50 transition-colors active:scale-90 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.3]" aria-hidden="true" />
            </button>
          ) : null}

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h1 className="text-base sm:text-lg font-black tracking-tight text-warm-espresso truncate leading-tight">
                {title}
              </h1>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[11px] font-medium text-stone-500 truncate leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Badge or Button */}
        {rightAction && <div className="shrink-0 flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
}
