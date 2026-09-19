import React from 'react';

interface StrokeStepSvgProps {
  strokes: string[];
  medians?: number[][][];
  activeStep: number; // 0-indexed: step 0 means 1st stroke
  showGrid?: boolean;
  gridType?: 'mizige' | 'tianzige' | 'jiugongge' | 'none';
  highlightColor?: string;
  pastStrokeColor?: string;
  futureStrokeColor?: string;
  showDirectionArrow?: boolean;
  className?: string;
}

export const StrokeStepSvg: React.FC<StrokeStepSvgProps> = ({
  strokes = [],
  medians = [],
  activeStep = 0,
  showGrid = true,
  gridType = 'mizige',
  highlightColor = '#34d399', // vibrant emerald
  pastStrokeColor = '#94a3b8', // clear slate for accumulated strokes
  futureStrokeColor,
  showDirectionArrow = false,
  className = 'w-full h-full',
}) => {
  // Center arrow / direction based on medians for the active stroke
  const currentMedian = medians[activeStep];
  const startPt = currentMedian && currentMedian.length > 0 ? currentMedian[0] : null;
  const endPt = currentMedian && currentMedian.length > 1 ? currentMedian[currentMedian.length - 1] : null;

  return (
    <svg
      viewBox="0 0 1024 1024"
      className={`${className} select-none overflow-hidden`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="strokeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor={highlightColor} floodOpacity="0.6" />
        </filter>
        <marker
          id="directionArrowHead"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Grid Guidelines */}
      {showGrid && gridType !== 'none' && (
        <g className="opacity-25 pointer-events-none">
          {/* Border Frame */}
          <rect
            x="4"
            y="4"
            width="1016"
            height="1016"
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeDasharray="16,16"
          />

          {/* Center Cross for Tian/Mi */}
          <line x1="0" y1="512" x2="1024" y2="512" stroke="#10b981" strokeWidth="6" strokeDasharray="16,16" />
          <line x1="512" y1="0" x2="512" y2="1024" stroke="#10b981" strokeWidth="6" strokeDasharray="16,16" />

          {/* Diagonals for Mi Zi Ge */}
          {gridType === 'mizige' && (
            <>
              <line x1="0" y1="0" x2="1024" y2="1024" stroke="#10b981" strokeWidth="4" strokeDasharray="12,12" />
              <line x1="1024" y1="0" x2="0" y2="1024" stroke="#10b981" strokeWidth="4" strokeDasharray="12,12" />
            </>
          )}

          {/* Jiu Gong Ge 3x3 */}
          {gridType === 'jiugongge' && (
            <>
              <line x1="341" y1="0" x2="341" y2="1024" stroke="#10b981" strokeWidth="4" strokeDasharray="12,12" />
              <line x1="682" y1="0" x2="682" y2="1024" stroke="#10b981" strokeWidth="4" strokeDasharray="12,12" />
              <line x1="0" y1="341" x2="1024" y2="341" stroke="#10b981" strokeWidth="4" strokeDasharray="12,12" />
              <line x1="0" y1="682" x2="1024" y2="682" stroke="#10b981" strokeWidth="4" strokeDasharray="12,12" />
            </>
          )}
        </g>
      )}

      {/* Font Matrix Transform: scale(1, -1) and translate(0, 900) */}
      <g transform="translate(0, 900) scale(1, -1)">
        {/* Optional: Future strokes in subtle ghost outline if requested */}
        {futureStrokeColor &&
          strokes.slice(activeStep + 1).map((pathD, fIdx) => (
            <path
              key={`future-${fIdx}`}
              d={pathD}
              fill={futureStrokeColor}
              opacity="0.15"
            />
          ))}

        {/* 1. Preceding Strokes (drawn up to activeStep - 1) in solid ink */}
        {strokes.slice(0, activeStep).map((pathD, pIdx) => (
          <path
            key={`past-${pIdx}`}
            d={pathD}
            fill={pastStrokeColor}
            opacity="0.95"
          />
        ))}

        {/* 2. Current Active Stroke in highlighted glow color with dynamic CSS animation */}
        {strokes[activeStep] && (
          <path
            key={`current-${activeStep}`}
            d={strokes[activeStep]}
            fill={highlightColor}
            filter="url(#strokeGlow)"
            className="hanzi-stroke-active transition-all duration-300"
          />
        )}

        {/* 3. Directional Flow Line & Dynamic Animated Tracing Arrow */}
        {showDirectionArrow && currentMedian && currentMedian.length >= 2 && (
          <g className="pointer-events-none">
            {/* Background shadow path for flow line */}
            <polyline
              points={currentMedian.map((pt) => `${pt[0]},${pt[1]}`).join(' ')}
              fill="none"
              stroke="#0f172a"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Dynamic traveling dashes stroke flow line */}
            <polyline
              points={currentMedian.map((pt) => `${pt[0]},${pt[1]}`).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="24,14"
              markerEnd="url(#directionArrowHead)"
              className="hanzi-stroke-flow-line"
            />
            {/* Starting Point Indicator Ring with Dynamic CSS Radar Ping */}
            {startPt && (
              <g>
                <circle
                  cx={startPt[0]}
                  cy={startPt[1]}
                  r="28"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  className="hanzi-target-ping"
                />
                <circle
                  cx={startPt[0]}
                  cy={startPt[1]}
                  r="20"
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="5"
                  className="drop-shadow-md"
                />
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  );
};
