import React from "react";

export type MascotVariant = "pair" | "pingu" | "penga";
export type MascotExpression = "happy" | "sleeping" | "celebrate" | "eating";

export interface PenguinMascotProps {
  variant?: MascotVariant;
  expression?: MascotExpression;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
}

const sizeMap: Record<string, string> = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-28 h-28",
  xl: "w-36 h-36",
  hero: "w-48 h-36 sm:w-60 sm:h-44",
};

export function PenguinMascot({
  variant = "pair",
  expression = "happy",
  size = "md",
  className = "",
}: PenguinMascotProps) {
  const sizeClasses = sizeMap[size] || sizeMap.md;

  // Single Penguin (Pingu - Female with Pink Bow, or Penga - Male with Blue Tie)
  if (variant === "pingu" || variant === "penga") {
    const isPingu = variant === "pingu";
    return (
      <div
        className={`inline-flex items-center justify-center relative select-none ${sizeClasses} ${className}`}
        aria-label={isPingu ? "Maskot Pingu" : "Maskot Penga"}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="90" rx="28" ry="6" fill="#EADCCB" fillOpacity="0.6" />

          {/* Sleeping particles */}
          {expression === "sleeping" && (
            <g className="animate-pulse">
              <text x="68" y="24" fontSize="11" fontWeight="bold" fill="#F59E0B" fontFamily="sans-serif">
                Z
              </text>
              <text x="77" y="16" fontSize="8" fontWeight="bold" fill="#FBBF24" fontFamily="sans-serif">
                z
              </text>
            </g>
          )}

          {/* Celebrate confetti */}
          {expression === "celebrate" && (
            <g>
              <circle cx="20" cy="18" r="2.5" fill="#FF7E7E" />
              <circle cx="80" cy="20" r="2.5" fill="#10B981" />
              <rect x="25" y="10" width="3" height="3" rx="1" fill="#FFA259" transform="rotate(25 25 10)" />
              <rect x="72" y="12" width="3" height="3" rx="1" fill="#3B82F6" transform="rotate(-20 72 12)" />
            </g>
          )}

          {/* Feet */}
          <ellipse cx="40" cy="87" rx="8" ry="4.5" fill="#FF8C42" />
          <ellipse cx="60" cy="87" rx="8" ry="4.5" fill="#FF8C42" />

          {/* Body */}
          <ellipse cx="50" cy="56" rx="30" ry="32" fill="#2B2D2F" />

          {/* Flippers */}
          <ellipse cx="21" cy="58" rx="6.5" ry="14" fill="#242628" transform="rotate(16 21 58)" />
          <ellipse cx="79" cy="58" rx="6.5" ry="14" fill="#242628" transform="rotate(-16 79 58)" />

          {/* White Cream Belly */}
          <ellipse cx="50" cy="62" rx="20" ry="24" fill="#FFFDF8" />

          {/* Accessory: Bow on head for Pingu */}
          {isPingu && (
            <g transform="translate(42, 21)">
              {/* Bow Left Wing */}
              <ellipse cx="4" cy="4" rx="4.5" ry="3" fill="#E06D53" transform="rotate(-20 4 4)" />
              {/* Bow Right Wing */}
              <ellipse cx="12" cy="4" rx="4.5" ry="3" fill="#E06D53" transform="rotate(20 12 4)" />
              {/* Bow Center knot */}
              <circle cx="8" cy="4" r="2.5" fill="#C95138" />
            </g>
          )}

          {/* Accessory: Necktie for Penga */}
          {!isPingu && (
            <g transform="translate(46, 57)">
              <polygon points="4,0 2,14 6,14" fill="#4A90D9" />
              <polygon points="2,14 6,14 4,18" fill="#3B82F6" />
              <circle cx="4" cy="0" r="1.8" fill="#2563EB" />
            </g>
          )}

          {/* Cheeks blush */}
          <circle cx="34" cy="51" r="4.5" fill="#FFB6C1" fillOpacity="0.85" />
          <circle cx="66" cy="51" r="4.5" fill="#FFB6C1" fillOpacity="0.85" />

          {/* Eyes */}
          {expression === "sleeping" ? (
            <g stroke="#2B2D2F" strokeWidth="2" strokeLinecap="round">
              <path d="M 33 46 Q 37 42 41 46" />
              <path d="M 59 46 Q 63 42 67 46" />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <circle cx="37" cy="45" r="5" fill="#FFFFFF" />
              <circle cx="37.5" cy="45" r="3.2" fill="#1C1D1F" />
              <circle cx="36" cy="43.5" r="1.3" fill="#FFFFFF" />

              {/* Right Eye */}
              <circle cx="63" cy="45" r="5" fill="#FFFFFF" />
              <circle cx="62.5" cy="45" r="3.2" fill="#1C1D1F" />
              <circle cx="61" cy="43.5" r="1.3" fill="#FFFFFF" />
            </g>
          )}

          {/* Beak */}
          <polygon points="46,48 54,48 50,55" fill="#FF8C42" />

          {/* Little Heart on shoulder */}
          <path
            d="M 23 41 C 23 39 20 38 19 40 C 18 38 15 39 15 41 C 15 43 19 46 19 46 C 19 46 23 43 23 41 Z"
            fill="#E06D53"
            transform="scale(0.85) translate(4, 2)"
          />
        </svg>
      </div>
    );
  }

  // Pair Variant: Pingu and Penga standing side by side with the Rp coin
  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${sizeClasses} ${className}`}
      aria-label="Maskot CelenganKita: Pingu dan Penga"
    >
      <svg
        viewBox="0 0 160 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-102"
      >
        {/* Ground shadow */}
        <ellipse cx="80" cy="100" rx="68" ry="8" fill="#EADCCB" fillOpacity="0.6" />

        {/* Floating particles */}
        {expression === "celebrate" && (
          <g>
            <circle cx="24" cy="18" r="2.5" fill="#FF7E7E" />
            <circle cx="136" cy="20" r="2.5" fill="#10B981" />
            <rect x="35" y="10" width="3.5" height="3.5" rx="1" fill="#FFA259" transform="rotate(25 35 10)" />
            <rect x="125" y="12" width="3.5" height="3.5" rx="1" fill="#3B82F6" transform="rotate(-20 125 12)" />
          </g>
        )}

        {expression === "sleeping" && (
          <g className="animate-pulse">
            <text x="76" y="24" fontSize="11" fontWeight="bold" fill="#F59E0B" fontFamily="sans-serif">
              Z
            </text>
            <text x="85" y="16" fontSize="8" fontWeight="bold" fill="#FBBF24" fontFamily="sans-serif">
              z
            </text>
          </g>
        )}

        {/* ----------------- LEFT PENGUIN: PINGU (Female) ----------------- */}
        <g id="pingu">
          {/* Feet */}
          <ellipse cx="42" cy="95" rx="7" ry="4" fill="#FF8C42" />
          <ellipse cx="58" cy="95" rx="7" ry="4" fill="#FF8C42" />

          {/* Body */}
          <ellipse cx="50" cy="65" rx="25" ry="29" fill="#2B2D2F" />

          {/* Left Flipper */}
          <ellipse cx="27" cy="66" rx="5.5" ry="12" fill="#222426" transform="rotate(15 27 66)" />
          {/* Right Flipper (Holding towards center) */}
          <ellipse cx="71" cy="66" rx="5.5" ry="12" fill="#222426" transform="rotate(-22 71 66)" />

          {/* White Belly */}
          <ellipse cx="50" cy="71" rx="17" ry="21" fill="#FFFDF8" />

          {/* Bow on Head */}
          <g transform="translate(42, 33)">
            <ellipse cx="4" cy="4" rx="4" ry="2.8" fill="#E06D53" transform="rotate(-20 4 4)" />
            <ellipse cx="12" cy="4" rx="4" ry="2.8" fill="#E06D53" transform="rotate(20 12 4)" />
            <circle cx="8" cy="4" r="2.2" fill="#C95138" />
          </g>

          {/* Cheeks */}
          <circle cx="36" cy="59" r="4" fill="#FFB6C1" fillOpacity="0.85" />
          <circle cx="64" cy="59" r="4" fill="#FFB6C1" fillOpacity="0.85" />

          {/* Eyes */}
          {expression === "sleeping" ? (
            <g stroke="#2B2D2F" strokeWidth="1.8" strokeLinecap="round">
              <path d="M 35 55 Q 39 51 43 55" />
              <path d="M 57 55 Q 61 51 65 55" />
            </g>
          ) : (
            <g>
              <circle cx="39" cy="54" r="4.5" fill="#FFFFFF" />
              <circle cx="39.5" cy="54" r="2.8" fill="#1C1D1F" />
              <circle cx="38" cy="52.5" r="1.1" fill="#FFFFFF" />

              <circle cx="61" cy="54" r="4.5" fill="#FFFFFF" />
              <circle cx="60.5" cy="54" r="2.8" fill="#1C1D1F" />
              <circle cx="59.5" cy="52.5" r="1.1" fill="#FFFFFF" />
            </g>
          )}

          {/* Beak */}
          <polygon points="46,57 54,57 50,64" fill="#FF8C42" />

          {/* Heart near Pingu */}
          <path
            d="M 28 50 C 28 48 25 47 24 49 C 23 47 20 48 20 50 C 20 52 24 55 24 55 C 24 55 28 52 28 50 Z"
            fill="#E06D53"
          />
        </g>

        {/* ----------------- CENTER GOLD COIN (Celengan) ----------------- */}
        <g id="coin" className={expression === "happy" || expression === "celebrate" ? "animate-bounce" : ""} style={{ animationDuration: "3s" }}>
          <circle cx="80" cy="75" r="11" fill="#FFCB56" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="80" cy="75" r="9" fill="#FFDF78" />
          <text
            x="80"
            y="79"
            fontSize="8"
            fontWeight="bold"
            fill="#92400E"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Rp
          </text>
        </g>

        {/* ----------------- RIGHT PENGUIN: PENGA (Male) ----------------- */}
        <g id="penga">
          {/* Feet */}
          <ellipse cx="102" cy="95" rx="7" ry="4" fill="#FF8C42" />
          <ellipse cx="118" cy="95" rx="7" ry="4" fill="#FF8C42" />

          {/* Body */}
          <ellipse cx="110" cy="65" rx="25" ry="29" fill="#2B2D2F" />

          {/* Left Flipper (towards coin) */}
          <ellipse cx="89" cy="66" rx="5.5" ry="12" fill="#222426" transform="rotate(22 89 66)" />
          {/* Right Flipper */}
          <ellipse cx="133" cy="66" rx="5.5" ry="12" fill="#222426" transform="rotate(-15 133 66)" />

          {/* White Belly */}
          <ellipse cx="110" cy="71" rx="17" ry="21" fill="#FFFDF8" />

          {/* Blue Tie */}
          <g transform="translate(106, 66)">
            <polygon points="4,0 1.5,14 6.5,14" fill="#4A90D9" />
            <polygon points="1.5,14 6.5,14 4,18" fill="#3B82F6" />
            <circle cx="4" cy="0" r="1.8" fill="#2563EB" />
          </g>

          {/* Cheeks */}
          <circle cx="96" cy="59" r="4" fill="#FFB6C1" fillOpacity="0.85" />
          <circle cx="124" cy="59" r="4" fill="#FFB6C1" fillOpacity="0.85" />

          {/* Eyes */}
          {expression === "sleeping" ? (
            <g stroke="#2B2D2F" strokeWidth="1.8" strokeLinecap="round">
              <path d="M 95 55 Q 99 51 103 55" />
              <path d="M 117 55 Q 121 51 125 55" />
            </g>
          ) : (
            <g>
              <circle cx="99" cy="54" r="4.5" fill="#FFFFFF" />
              <circle cx="99.5" cy="54" r="2.8" fill="#1C1D1F" />
              <circle cx="98" cy="52.5" r="1.1" fill="#FFFFFF" />

              <circle cx="121" cy="54" r="4.5" fill="#FFFFFF" />
              <circle cx="120.5" cy="54" r="2.8" fill="#1C1D1F" />
              <circle cx="119.5" cy="52.5" r="1.1" fill="#FFFFFF" />
            </g>
          )}

          {/* Beak */}
          <polygon points="106,57 114,57 110,64" fill="#FF8C42" />

          {/* Heart near Penga */}
          <path
            d="M 132 50 C 132 48 129 47 128 49 C 127 47 124 48 124 50 C 124 52 128 55 128 55 C 128 55 132 52 132 50 Z"
            fill="#E06D53"
          />
        </g>
      </svg>
    </div>
  );
}

export const PiggyMascot = PenguinMascot;
