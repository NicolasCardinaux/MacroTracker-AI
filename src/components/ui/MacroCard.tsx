import React from 'react';

interface MacroCardProps {
  label: string;
  current: number;
  max: number;
  colorClass: string;
  bgClass: string;
  icon?: React.ReactNode;
}

export const MacroCard: React.FC<MacroCardProps> = ({ label, current, max, colorClass, bgClass, icon }) => {
  const percent = Math.min((current / max) * 100, 100);
  const isOver = current > max;
  const remaining = max - current;

  return (
    <div className={`flex flex-col p-3 rounded-[20px] border border-zinc-800/60 ${bgClass} shadow-sm relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="opacity-80">{icon}</div>
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{label}</span>
        </div>
      </div>
      
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-lg font-black text-white">{current.toFixed(0)}</span>
        <span className="text-[10px] font-bold text-zinc-500 uppercase">/ {max}g</span>
      </div>
      
      {/* ProgressBar */}
      <div className="h-1.5 w-full bg-zinc-950/50 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-1000 ease-out rounded-full ${isOver ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${isOver ? 'text-red-400' : 'text-zinc-500'}`}>
          {isOver ? 'Excedido' : `${remaining.toFixed(0)}g libres`}
        </span>
      </div>
    </div>
  );
};
