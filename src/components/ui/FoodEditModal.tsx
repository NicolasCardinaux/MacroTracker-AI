import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { FoodLog, MealType } from '../../types';

interface FoodEditModalProps {
  log: FoodLog;
  onClose: () => void;
  onSave: (id: number, updatedLog: Partial<FoodLog>) => void;
}

export const FoodEditModal: React.FC<FoodEditModalProps> = ({ log, onClose, onSave }) => {
  const [rawInput, setRawInput] = useState(log.raw_input);
  const [mealType, setMealType] = useState<MealType>(log.meal_type);
  const [calories, setCalories] = useState(log.calories);
  const [protein, setProtein] = useState(log.protein);
  const [carbs, setCarbs] = useState(log.carbs);
  const [fats, setFats] = useState(log.fats);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(log.id, {
      raw_input: rawInput,
      meal_type: mealType,
      calories: Math.round(Number(calories)),
      protein: Math.round(Number(protein)),
      carbs: Math.round(Number(carbs)),
      fats: Math.round(Number(fats))
    });
    setIsSaving(false);
  };

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-zinc-900 w-full max-w-md rounded-[32px] p-6 border border-zinc-800 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden m-auto">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white z-10 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-zinc-100 mb-6 pr-8">Editar Alimento</h3>

        <div className="overflow-y-auto flex-1 hide-scrollbar">
          <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Descripción</label>
            <input 
              type="text" 
              value={rawInput} 
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Comida</label>
            <select 
              value={mealType} 
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Desayuno">Desayuno</option>
              <option value="Almuerzo">Almuerzo</option>
              <option value="Merienda">Merienda</option>
              <option value="Cena">Cena</option>
              <option value="Snack">Snack</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Calorías (kcal)</label>
              <input 
                type="number" 
                value={calories} 
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-400 mb-1">Proteínas (g)</label>
              <input 
                type="number" 
                step="0.1"
                value={protein} 
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-yellow-400 mb-1">Carbohidratos (g)</label>
              <input 
                type="number" 
                step="0.1"
                value={carbs} 
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-400 mb-1">Grasas (g)</label>
              <input 
                type="number" 
                step="0.1"
                value={fats} 
                onChange={(e) => setFats(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 mb-2 w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Cambios
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
