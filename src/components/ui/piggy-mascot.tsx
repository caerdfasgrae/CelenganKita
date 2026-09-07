import React from "react";

export type MascotExpression = "happy" | "sleeping" | "eating" | "celebrate";

interface PiggyMascotProps {
  expression?: MascotExpression;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

export function PiggyMascot({
  expression = "happy",
  size = "md",
  className = "",
}: PiggyMascotProps) {
  const sizeClasses = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center justify-center relative select-none ${sizeClasses} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
        aria-hidden="true"
      >
        {/* Shadow Ground */}
        <ellipse cx="50" cy="90" rx="32" ry="5" fill="#EADCCB" fillOpacity="0.5" />

        {/* Floating Coin (for happy & celebrate) */}
        {(expression === "happy" || expression === "celebrate") && (
          <g className="animate-bounce" style={{ animationDuration: "2.5s" }}>
            <circle cx="50" cy="16" r="9" fill="#FFCB56" stroke="#D97706" strokeWidth="1.5" />
            <text
              x="50"
              y="20"
              fontSize="9"
              fontWeight="bold"
              fill="#92400E"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Rp
            </text>
          </g>
        )}

        {/* Sleeping Z z particles */}
        {expression === "sleeping" && (
          <g className="animate-pulse">
            <text x="68" y="24" fontSize="11" fontWeight="bold" fill="#F59E0B" fontFamily="sans-serif">
              Z
            </text>
            <text x="76" y="16" fontSize="8" fontWeight="bold" fill="#FBBF24" fontFamily="sans-serif">
              z
            </text>
          </g>
        )}

        {/* Confetti (celebrate) */}
        {expression === "celebrate" && (
          <g>
            <circle cx="22" cy="18" r="2.5" fill="#FF7E7E" />
            <circle cx="78" cy="20" r="2.5" fill="#10B981" />
            <rect x="28" y="10" width="3" height="3" rx="1" fill="#FFA259" transform="rotate(25 28 10)" />
            <rect x="68" y="12" width="3" height="3" rx="1" fill="#3B82F6" transform="rotate(-20 68 12)" />
          </g>
        )}

        {/* Ears */}
        {/* Left Ear */}
        <path
          d="M 28 32 C 22 22 26 14 36 22 Z"
          fill="#FFA259"
          stroke="#E06D53"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M 29 29 C 26 24 28 19 33 24 Z" fill="#FF7E7E" />

        {/* Right Ear */}
        <path
          d="M 72 32 C 78 22 74 14 64 22 Z"
          fill="#FFA259"
          stroke="#E06D53"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M 71 29 C 74 24 72 19 67 24 Z" fill="#FF7E7E" />

        {/* Body (Cute plump rounded piggy) */}
        <circle cx="50" cy="56" r="34" fill="#FFD8B3" stroke="#E06D53" strokeWidth="2.5" />

        {/* Belly Warm Highlight */}
        <ellipse cx="50" cy="62" rx="24" ry="18" fill="#FFF2E5" />

        {/* Snout */}
        <ellipse cx="50" cy="58" rx="14" ry="10" fill="#FFA259" stroke="#E06D53" strokeWidth="2" />
        {/* Nostrils */}
        <ellipse cx="45" cy="58" rx="2.5" ry="3.5" fill="#9C3624" />
        <ellipse cx="55" cy="58" rx="2.5" ry="3.5" fill="#9C3624" />

        {/* Eyes by Expression */}
        {expression === "happy" && (
          <g>
            <path
              d="M 36 43 C 38 39 42 39 44 43"
              stroke="#2C2A29"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 56 43 C 58 39 62 39 64 43"
              stroke="#2C2A29"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {expression === "sleeping" && (
          <g>
            <path
              d="M 35 44 C 38 47 43 47 45 44"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 55 44 C 58 47 63 47 65 44"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {expression === "celebrate" && (
          <g>
            <circle cx="40" cy="42" r="3.5" fill="#2C2A29" />
            <circle cx="39" cy="41" r="1.2" fill="#FFFFFF" />
            <circle cx="60" cy="42" r="3.5" fill="#2C2A29" />
            <circle cx="59" cy="41" r="1.2" fill="#FFFFFF" />
            <path d="M 46 69 Q 50 73 54 69" stroke="#2C2A29" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {expression === "eating" && (
          <g>
            <path d="M 36 42 Q 40 40 44 42" stroke="#2C2A29" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="60" cy="42" r="3.5" fill="#2C2A29" />
            <circle cx="59" cy="41" r="1.2" fill="#FFFFFF" />
            <path d="M 47 70 Q 50 76 53 70 Z" fill="#9C3624" />
            <circle cx="56" cy="71" r="1" fill="#D97706" />
          </g>
        )}

        {/* Rosy Cheeks */}
        <circle cx="32" cy="52" r="5" fill="#FF7E7E" fillOpacity="0.6" />
        <circle cx="68" cy="52" r="5" fill="#FF7E7E" fillOpacity="0.6" />

        {/* Feet */}
        <rect x="36" y="86" width="9" height="5" rx="2.5" fill="#FFA259" stroke="#E06D53" strokeWidth="1.5" />
        <rect x="55" y="86" width="9" height="5" rx="2.5" fill="#FFA259" stroke="#E06D53" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
