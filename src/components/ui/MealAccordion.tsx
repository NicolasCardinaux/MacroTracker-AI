import React, { useState } from 'react';
import { ChevronDown, Plus, Star, BookmarkPlus, Trash2 } from 'lucide-react';
import type { FoodLog, MealType } from '../../types';

import { FoodCard } from './FoodCard';

interface MealAccordionProps {
  meal: MealType;
  logs: FoodLog[];
  onDeleteLog: (id: number) => void;
  onEditLog: (log: FoodLog) => void;
  onAddLog: (meal: MealType) => void;
  onSaveCombo?: (meal: MealType, logs: FoodLog[]) => void;
  onLoadCombo?: (meal: MealType) => void;
  onClearMeal?: (meal: MealType, logIds: number[]) => void;
}

export const MealAccordion: React.FC<MealAccordionProps> = ({ meal, logs, onDeleteLog, onEditLog, onAddLog, onSaveCombo, onLoadCombo, onClearMeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const visibleLogs = logs.filter(l => l.raw_input !== '__CATEGORY__');
  const totalCalories = visibleLogs.reduce((acc, l) => acc + l.calories, 0);

  return (
    <div className="bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-800/60 mb-4 overflow-hidden transition-all duration-300 backdrop-blur-md">
      <div 
        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-800/40 transition-colors gap-2 sm:gap-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
          <div className="min-w-0">
            <h4 className="font-bold text-zinc-100 text-base sm:text-lg truncate">{meal}</h4>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">
              {visibleLogs.length} {visibleLogs.length === 1 ? 'ítem' : 'ítems'}
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddLog(meal); }}
            className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors ml-1 sm:ml-2 shrink-0"
            title={`Añadir a ${meal}`}
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>
          
          {onLoadCombo && (
            <button 
              onClick={(e) => { e.stopPropagation(); onLoadCombo(meal); }}
              className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center hover:bg-yellow-500 hover:text-zinc-900 transition-colors shrink-0"
              title={`Cargar Combo guardado`}
            >
              <Star className="w-4 h-4 font-bold" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <span className="text-xs sm:text-sm font-extrabold text-zinc-200">
            {Number(totalCalories).toFixed(1)} kcal
          </span>
          <div className={`p-1 sm:p-1.5 rounded-full bg-zinc-800/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 pt-2 space-y-3">
          {visibleLogs.length === 0 ? (
            <div className="bg-zinc-950/40 rounded-2xl p-6 text-center border border-zinc-800/30 border-dashed">
              <p className="text-sm text-zinc-500 font-medium mb-2">Sin alimentos registrados.</p>
              <button 
                onClick={(e) => { e.stopPropagation(); onAddLog(meal); }}
                className="text-sm font-bold text-primary-500 hover:text-primary-400 transition-colors"
              >
                + Añadir alimento
              </button>
            </div>
          ) : (
            <>
              {visibleLogs.map(log => (
                <FoodCard 
                  key={log.id} 
                  log={log} 
                  onEdit={onEditLog} 
                  onDelete={onDeleteLog} 
                />
              ))}
              {visibleLogs.length > 1 && (
                <div className="flex items-center gap-2 mt-2">
                  {onSaveCombo && (
                    <button
                      onClick={() => onSaveCombo(meal, visibleLogs)}
                      className="flex-1 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      Guardar como Combo
                    </button>
                  )}
                  {onClearMeal && (
                    <button
                      onClick={() => onClearMeal(meal, visibleLogs.map(l => l.id))}
                      className="py-3 px-4 rounded-xl border border-dashed border-red-900/30 text-red-500/70 font-semibold text-sm flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                      title="Eliminar todos los alimentos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
