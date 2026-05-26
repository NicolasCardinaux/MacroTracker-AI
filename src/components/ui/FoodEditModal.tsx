import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Minus, Plus } from 'lucide-react';
import type { FoodLog, MealType } from '../../types';

interface FoodEditModalProps {
  log: FoodLog;
  onClose: () => void;
  onSave: (id: number, updatedLog: Partial<FoodLog>) => void;
}

export const FoodEditModal: React.FC<FoodEditModalProps> = ({ log, onClose, onSave }) => {
  const [rawInput, setRawInput] = useState(log.raw_input);
  const [mealType, setMealType] = useState<MealType>(log.meal_type);
  
  // Estados base (para que puedan ser recalculados si el usuario edita el total)
  const [baseCalories, setBaseCalories] = useState(log.base_calories ?? log.calories);
  const [baseProtein, setBaseProtein] = useState(log.base_protein ?? log.protein);
  const [baseCarbs, setBaseCarbs] = useState(log.base_carbs ?? log.carbs);
  const [baseFats, setBaseFats] = useState(log.base_fats ?? log.fats);

  const [quantity, setQuantity] = useState(log.quantity || 1);
  const [calories, setCalories] = useState(log.calories);
  const [protein, setProtein] = useState(log.protein);
  const [carbs, setCarbs] = useState(log.carbs);
  const [fats, setFats] = useState(log.fats);
  const [isSaving, setIsSaving] = useState(false);

  // Recalcular el TOTAL cuando el usuario cambia la CANTIDAD
  // Solo se recalcula si la cantidad realmente cambió en la UI, para no sobreescribir la edición manual
  const prevQuantityRef = React.useRef(quantity);
  useEffect(() => {
    if (quantity !== prevQuantityRef.current) {
      setCalories(Math.round(baseCalories * quantity));
      setProtein(Math.round(baseProtein * quantity * 10) / 10);
      setCarbs(Math.round(baseCarbs * quantity * 10) / 10);
      setFats(Math.round(baseFats * quantity * 10) / 10);
      prevQuantityRef.current = quantity;
    }
  }, [quantity, baseCalories, baseProtein, baseCarbs, baseFats]);

  // Funciones para manejar la edición manual de los totales
  const handleEditCalories = (val: number) => { setCalories(val); setBaseCalories(val / (quantity || 1)); };
  const handleEditProtein = (val: number) => { setProtein(val); setBaseProtein(val / (quantity || 1)); };
  const handleEditCarbs = (val: number) => { setCarbs(val); setBaseCarbs(val / (quantity || 1)); };
  const handleEditFats = (val: number) => { setFats(val); setBaseFats(val / (quantity || 1)); };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(log.id, {
      raw_input: rawInput,
      meal_type: mealType,
      quantity,
      base_calories: baseCalories,
      base_protein: baseProtein,
      base_carbs: baseCarbs,
      base_fats: baseFats,
      calories: Math.round(Number(calories)),
      protein: Math.round(Number(protein)),
      carbs: Math.round(Number(carbs)),
      fats: Math.round(Number(fats))
    });
    setIsSaving(false);
  };

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

        <div className="overflow-y-auto flex-1 hide-scrollbar space-y-4 pb-4">
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Descripción (Modificable)</label>
            <input 
              type="text" 
              value={rawInput} 
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Comida</label>
              <select 
                value={mealType} 
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Merienda">Merienda</option>
                <option value="Cena">Cena</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Cantidad {(quantity > 50 || log.raw_input.toLowerCase().includes('gr')) ? '(Gramos)' : '(Porciones)'}
              </label>
              <div className="flex items-center w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden h-[46px]">
                <button 
                  onClick={() => setQuantity(Math.max(0.1, quantity - (quantity >= 1 ? 1 : 0.1)))}
                  className="px-3 h-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  step="0.1"
                  value={Number(quantity).toString()} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-full bg-transparent text-zinc-100 text-center font-bold text-sm outline-none"
                />
                <button 
                  onClick={() => setQuantity(quantity + (quantity >= 1 ? 1 : 0.1))}
                  className="px-3 h-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 mt-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Información Nutricional (Total)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Calorías (kcal)</label>
                <input 
                  type="number" 
                  value={calories} 
                  onChange={(e) => handleEditCalories(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-400 mb-1">Proteínas (g)</label>
                <input 
                  type="number" 
                  value={protein} 
                  onChange={(e) => handleEditProtein(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-yellow-400 mb-1">Carbohidratos (g)</label>
                <input 
                  type="number" 
                  value={carbs} 
                  onChange={(e) => handleEditCarbs(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-purple-400 mb-1">Grasas (g)</label>
                <input 
                  type="number" 
                  value={fats} 
                  onChange={(e) => handleEditFats(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
