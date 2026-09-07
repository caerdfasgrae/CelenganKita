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
}: MobileHeaderProps) {
  return (
    <header
      className={`w-full pt-safe px-4 pb-3 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-warm-border/80 z-30 select-none ${
        sticky ? "sticky top-0 left-0 right-0" : "relative"
      } ${className}`}
    >
      <div className="flex items-center justify-between min-h-[44px] gap-3">
        {/* Left Side: Back Button or Logo / Mascot */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Kembali ke halaman sebelumnya"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-warm-border flex items-center justify-center text-stone-700 hover:text-stone-900 hover:border-warm-apricot transition-transform duration-75 active:scale-95 shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke halaman sebelumnya"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-warm-border flex items-center justify-center text-stone-700 hover:text-stone-900 hover:border-warm-apricot transition-transform duration-75 active:scale-95 shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-warm-apricot"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
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
