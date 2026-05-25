import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
  colorClass: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label, colorClass }) => {
  const percent = Math.min((current / max) * 100, 100);
  const isOver = current > max;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-sm font-semibold text-zinc-300">{label}</span>
        <div className="flex items-baseline space-x-1">
          <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-zinc-100'}`}>
            {current}g
          </span>
          <span className="text-xs font-medium text-zinc-500">/ {max}g</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out rounded-full ${
            isOver ? 'bg-red-500' : colorClass
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
