import React from 'react';
import { Edit2, Trash2, Check, BadgeCheck } from 'lucide-react';
import type { FoodLog } from '../../types';

interface FoodCardProps {
  log: FoodLog;
  onEdit: (log: FoodLog) => void;
  onDelete: (id: number) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ log, onEdit, onDelete }) => {
  const isGrams = log.raw_input.toLowerCase().includes('gr') || log.raw_input.toLowerCase().includes('gramo');
  const portions = log.quantity;

  const getFormattedName = (log: FoodLog, portions: number, isGrams: boolean) => {
     let raw = log.raw_input;
     
     if (raw.startsWith('[CUSTOM:')) {
        raw = raw.substring(raw.indexOf(']') + 1).trim();
     }

     // Remove leading numbers and units that might have been cached in the DB
     raw = raw.replace(/^(\d+(?:\.\d+)?\s*(?:unidades|unidad|gramos|gramo|gr|g|ml)?\s*(?:de\s*)?)/i, '').trim();
     
     raw = raw.charAt(0).toUpperCase() + raw.slice(1);
     
     const suffix = isGrams ? `(${portions}gr)` : `(x${portions})`;

     if (raw.includes('(')) {
        const parts = raw.split(' (');
        const baseName = parts[0];
        const rest = parts.slice(1).join(' (');
        return `${baseName} ${suffix} (${rest}`;
     }
     
     return `${raw} ${suffix}`;
  }

  return (
    <div className="bg-zinc-950/80 backdrop-blur-sm p-4 rounded-2xl flex flex-col gap-3 border border-zinc-800 hover:border-zinc-700 transition-colors group relative overflow-hidden">
      {/* Glow Effect Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start">
        <div className="pr-4">
          <p className="text-sm font-semibold text-zinc-100 leading-tight flex items-center gap-1.5 flex-wrap">
            {getFormattedName(log, portions, isGrams)}
            {log.is_verified ? (
              <span title="Alimento Verificado Oficialmente" className="flex items-center justify-center text-emerald-500">
                <BadgeCheck className="w-[18px] h-[18px] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              </span>
            ) : null}
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
          {Number(log.calories).toFixed(1)} kcal
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <div className="flex gap-3 text-[11px] font-bold tracking-wide">
          <span className="text-blue-400/90">{Number(log.protein).toFixed(1)}g P</span>
          <span className="text-yellow-400/90">{Number(log.carbs).toFixed(1)}g C</span>
          <span className="text-purple-400/90">{Number(log.fats).toFixed(1)}g G</span>
        </div>
        
        <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(log); }}
            className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500/80 hover:text-red-500 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
