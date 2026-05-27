import React from 'react';

export interface ProgressSegment {
  id: string;
  value: number;
  color: string;
}

interface ProgressRingProps {
  segments: ProgressSegment[];
  max: number;
  label: string;
  unit: string;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  segments,
  max,
  unit,
  size = 220,
  strokeWidth = 16,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const totalCurrent = segments.reduce((acc, seg) => acc + seg.value, 0);
  const isOver = totalCurrent > max;
  const totalVisiblePercentage = Math.min(totalCurrent / max, 1);
  const totalVisibleLength = totalVisiblePercentage * circumference;

  let currentAccumulatedPercentage = 0;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <filter id="color-blend" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="ring-3d-overlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.4"/>
          </linearGradient>
          
          <mask id="ring-mask">
            {/* The mask defines the exact crisp shape of the ring */}
            <circle
              stroke="white"
              strokeWidth={strokeWidth}
              strokeDasharray={`${totalVisibleLength} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </mask>
        </defs>

        {/* Background ring */}
        <circle
          className="text-zinc-800/80"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Over-limit red ring */}
        {isOver ? (
          <circle
            className="text-red-500 transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (Math.min(totalCurrent / max, 1) * circumference)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        ) : (
          /* Multi-segmented blended rings */
          <g mask="url(#ring-mask)" filter="url(#color-blend)">
            {segments.map((segment) => {
              if (segment.value <= 0) return null;
              
              const segmentPercentage = (segment.value / max);
              // Make segments slightly overlap to help blending
              const overlapPercentage = 0.05; 
              const visibleLength = (segmentPercentage + overlapPercentage) * circumference;
              const offset = -(currentAccumulatedPercentage * circumference);
              
              currentAccumulatedPercentage += segmentPercentage;

              return (
                <circle
                  key={segment.id}
                  stroke={segment.color}
                  // Make stroke thicker before mask to ensure it fills the mask after blurring
                  strokeWidth={strokeWidth + 12}
                  strokeDasharray={`${visibleLength} ${circumference}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  fill="transparent"
                  r={radius}
                  cx={size / 2}
                  cy={size / 2}
                  className="transition-all duration-1000 ease-out"
                  style={{ transformOrigin: 'center' }}
                />
              );
            })}
          </g>
        )}

        {/* 3D Overlay Ring (Applies inner shadow/bevel effect only over the colored area) */}
        {!isOver && totalCurrent > 0 && (
          <circle
            mask="url(#ring-mask)"
            className="pointer-events-none mix-blend-overlay"
            stroke="url(#ring-3d-overlay)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center z-10">
        <span className="text-zinc-400 text-sm font-medium mb-1">{isOver ? 'Te Pasaste' : 'Faltan'}</span>
        <div className="flex items-baseline space-x-1">
          <span className={`text-4xl font-bold tracking-tighter ${isOver ? 'text-red-500' : 'text-zinc-100'}`}>
            {Math.abs(max - totalCurrent).toFixed(0)}
          </span>
        </div>
        <span className="text-zinc-500 text-xs mt-1 font-semibold tracking-wider uppercase">{unit}</span>
      </div>
    </div>
  );
};
