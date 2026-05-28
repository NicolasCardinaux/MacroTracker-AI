import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Loader2, Trash2, ChevronRight } from 'lucide-react';
import type { SavedMeal, MealType } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface LoadComboModalProps {
  mealType: MealType;
  onClose: () => void;
  onLoad: (combo: SavedMeal) => Promise<void>;
}

export const LoadComboModal: React.FC<LoadComboModalProps> = ({ mealType, onClose, onLoad }) => {
  const { user } = useAuth();
  const [combos, setCombos] = useState<SavedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingComboId, setLoadingComboId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCombos();
    }
  }, [user]);

  const loadCombos = async () => {
    if (!user) return;
    try {
      const data = await api.getSavedMeals(user.id);
      setCombos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que quieres eliminar este combo?')) return;
    
    try {
      await api.deleteSavedMeal(id);
      setCombos(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error(error);
      alert('Error al eliminar combo');
    }
  };

  const handleSelect = async (combo: SavedMeal) => {
    setLoadingComboId(combo.id);
    try {
      await onLoad(combo);
      onClose();
    } catch (e) {
      console.error(e);
      setLoadingComboId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh]"
      >
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-zinc-100">Cargar Combo</h3>
              <p className="text-xs font-medium text-zinc-500">Añadir a {mealType}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
              <p className="text-sm font-medium">Cargando tus combos...</p>
            </div>
          ) : combos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-zinc-600" />
              </div>
              <h4 className="text-zinc-300 font-bold mb-2">No tienes combos guardados</h4>
              <p className="text-sm text-zinc-500 max-w-[250px] mx-auto">
                Para guardar un combo, añade alimentos a una comida y usa el botón "Guardar como Combo Frecuente".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {combos.map(combo => (
                <div 
                  key={combo.id}
                  onClick={() => handleSelect(combo)}
                  className={`bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-yellow-500/50 transition-all group relative overflow-hidden ${loadingComboId === combo.id ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-zinc-100 text-base">{combo.combo_name}</h4>
                    <button
                      onClick={(e) => handleDelete(e, combo.id)}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 mb-4">
                    {combo.items.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-xs text-zinc-400 truncate flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        {item.raw_input}
                      </p>
                    ))}
                    {combo.items.length > 3 && (
                      <p className="text-xs text-zinc-500 italic pl-3">
                        + {combo.items.length - 3} alimentos más
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1 mr-2">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                        {combo.items.reduce((acc, i) => acc + i.calories, 0).toFixed(0)} kcal
                      </span>
                      <span className="text-[10px] font-bold text-blue-400/80 whitespace-nowrap">
                        {combo.items.reduce((acc, i) => acc + i.protein, 0).toFixed(0)}g P
                      </span>
                      <span className="text-[10px] font-bold text-yellow-400/80 whitespace-nowrap">
                        {combo.items.reduce((acc, i) => acc + i.carbs, 0).toFixed(0)}g C
                      </span>
                      <span className="text-[10px] font-bold text-purple-400/80 whitespace-nowrap">
                        {combo.items.reduce((acc, i) => acc + i.fats, 0).toFixed(0)}g G
                      </span>
                    </div>
                    
                    {loadingComboId === combo.id ? (
                      <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                        <ChevronRight className="w-3 h-3 font-bold" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
