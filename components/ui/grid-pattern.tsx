"use client";

import { useId } from "react";
import { clsx } from "clsx";

interface GridPatternProps {
  width?: number;
  height?: number;
  dotSize?: number;
  dotColor?: string;
  className?: string;
  fade?: boolean;
}

export function GridPattern({
  width = 24,
  height = 24,
  dotSize = 1,
  dotColor = "rgba(99,102,241,0.25)",
  className,
  fade = true,
}: GridPatternProps) {
  const id = useId();
  const patternId = `dot-pattern-${id}`;
  const maskId = `dot-mask-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={clsx(
        "pointer-events-none absolute inset-0 h-full w-full",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={width / 2}
            cy={height / 2}
            r={dotSize}
            fill={dotColor}
          />
        </pattern>

        {fade && (
          <radialGradient id={maskId} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      {fade ? (
        <>
          <mask id={`${maskId}-mask`}>
            <rect width="100%" height="100%" fill={`url(#${maskId})`} />
          </mask>
          <rect
            width="100%"
            height="100%"
            fill={`url(#${patternId})`}
            mask={`url(#${maskId}-mask)`}
          />
        </>
      ) : (
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      )}
    </svg>
  );
}
