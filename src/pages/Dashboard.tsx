import React, { useState, useEffect, useRef } from 'react';
import { getLocalDateString } from '../utils/date';
import { createPortal } from 'react-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { ProgressRing } from '../components/ui/ProgressRing';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MealAccordion } from '../components/ui/MealAccordion';
import { CategoryInputModal } from '../components/ui/CategoryInputModal';
import { FoodEditModal } from '../components/ui/FoodEditModal';
import { AccountModal } from '../components/ui/AccountModal';
import { Logo } from '../components/ui/Logo';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { User as UserIcon, X as XIcon, ChevronLeft, ChevronRight, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { DailyGoals, FoodLog, GeminiNutritionResponse, MealType } from '../types';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isListening, startListening, stopListening, transcript, resetTranscript, manuallySetTranscript, error: speechError } = useSpeechRecognition();
  
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  
  // UI States
  const [activeCategoryInput, setActiveCategoryInput] = useState<MealType | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [iaResponse, setIaResponse] = useState<GeminiNutritionResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user, selectedDate]);

  // Bloquear scroll cuando los modales inline están abiertos
  useEffect(() => {
    if (showNewCategoryModal || logToDelete !== null || showAccountModal || errorAlert !== null || successAlert !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showNewCategoryModal, logToDelete, showAccountModal, errorAlert, successAlert]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [fetchedGoals, fetchedLogs] = await Promise.all([
      api.getDailyGoals(user.id),
      api.getFoodLogsByDate(user.id, selectedDate)
    ]);
    
    if (fetchedGoals) {
      setGoals(fetchedGoals);
    }
    setLogs(fetchedLogs);
    setLoading(false);
  };

  const currentTotals = logs.reduce((acc, log) => ({
    calories: acc.calories + Number(log.calories),
    protein: acc.protein + Number(log.protein),
    carbs: acc.carbs + Number(log.carbs),
    fats: acc.fats + Number(log.fats),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const getMealColor = (meal: string) => {
    switch (meal) {
      case 'Desayuno': return '#10b981'; // green
      case 'Almuerzo': return '#3b82f6'; // blue
      case 'Merienda': return '#eab308'; // yellow
      case 'Cena': return '#ef4444'; // red
      case 'Snack': return '#a855f7'; // purple
      default: return '#0ea5e9'; // custom meals (sky)
    }
  };

  const mealTotals = logs.reduce((acc, log) => {
    // Extract real category
    let realCategory = log.meal_type as string;
    if (log.raw_input.startsWith('[CUSTOM:')) {
      const endIdx = log.raw_input.indexOf(']');
      if (endIdx > -1) {
        realCategory = log.raw_input.substring(8, endIdx);
      }
    }
    acc[realCategory] = (acc[realCategory] || 0) + Number(log.calories);
    return acc;
  }, {} as Record<string, number>);

  const ringSegments = Object.entries(mealTotals).map(([meal, value]) => ({
    id: meal,
    value,
    color: getMealColor(meal)
  }));

  const getDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = getLocalDateString();
    if (dateStr === today) return "Hoy";
    
    const formatted = d.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    return formatted.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleProcessText = async (text: string) => {
    if (text.trim().length < 3 || !activeCategoryInput) return;
    setIsProcessing(true);
    setApiError(null);
    if (isListening) stopListening();

    try {
      const result = await api.analyzeFoodWithGemini(text, undefined, undefined, user?.id);
      await handleConfirmSaveNew(activeCategoryInput, text, result);
    } catch (error: any) {
      setApiError(error.message || "Error al procesar con IA. Intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  const handleConfirmSaveNew = async (mealType: string, rawInput: string, aiData: GeminiNutritionResponse) => {
    if (!user) return;
    
    const isCustom = !['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'].includes(mealType);
    const dbMealType = isCustom ? 'Snack' : (mealType as MealType);

    const foods = aiData.foods?.length > 0 ? aiData.foods : [{ name: rawInput, amount: '', quantity: 1, unit: 'unidad', base_calories: 0, base_protein: 0, base_carbs: 0, base_fats: 0, total_calories: 0, total_protein: 0, total_carbs: 0, total_fats: 0 }];
    
    const logsToInsert = foods.map(f => {
      const q = Number(f.quantity) || 1;
      const u = f.unit === 'unidad' ? (q === 1 ? '' : 'unidades ') : (f.unit + ' de ');
      const cleanName = `${q} ${u}${f.name}`.trim().replace(/\s+/g, ' ');
      const finalInputText = isCustom ? `[CUSTOM:${mealType}] ${cleanName}` : cleanName;

      return {
        date: selectedDate,
        meal_type: dbMealType,
        raw_input: finalInputText,
        quantity: Number(f.quantity) || 1,
        base_calories: Math.round(Number(f.base_calories || 0)),
        base_protein: Math.round(Number(f.base_protein || 0)),
        base_carbs: Math.round(Number(f.base_carbs || 0)),
        base_fats: Math.round(Number(f.base_fats || 0)),
        calories: Math.round(Number(f.total_calories !== undefined ? f.total_calories : (f as any).calories || 0)),
        protein: Math.round(Number(f.total_protein !== undefined ? f.total_protein : (f as any).protein || 0)),
        carbs: Math.round(Number(f.total_carbs !== undefined ? f.total_carbs : (f as any).carbs || 0)),
        fats: Math.round(Number(f.total_fats !== undefined ? f.total_fats : (f as any).fats || 0))
      };
    });

    const newLogs = await api.addFoodLogs(user.id, logsToInsert as any);

    if (newLogs && newLogs.length > 0) {
      setLogs([...logs, ...newLogs]);
      closeInputModal();
    } else {
      setApiError("Error al guardar en la base de datos.");
      setIsProcessing(false);
    }
  };

  const closeInputModal = () => {
    setActiveCategoryInput(null);
    setIaResponse(null);
    setApiError(null);
    resetTranscript();
    setIsProcessing(false);
    if (isListening) stopListening();
  };

  // --- HANDLERS DE EDICIÓN ---
  const handleDeleteLog = (id: number) => {
    setLogToDelete(id);
  };

  const confirmDelete = async () => {
    if (logToDelete === null) return;
    const success = await api.deleteFoodLog(logToDelete);
    if (success) {
      setLogs(logs.filter(l => l.id !== logToDelete));
    }
    setLogToDelete(null);
  };

  const handleSaveEdit = async (id: number, updatedData: Partial<FoodLog>) => {
    const originalLog = logs.find(l => l.id === id);
    let newRawInput = updatedData.raw_input;
    if (originalLog?.raw_input.startsWith('[CUSTOM:')) {
      const endIdx = originalLog.raw_input.indexOf(']');
      if (endIdx > -1) {
        const prefix = originalLog.raw_input.substring(0, endIdx + 1);
        if (newRawInput && !newRawInput.startsWith(prefix)) {
          newRawInput = `${prefix} ${newRawInput}`;
        }
      }
    }
    
    const finalData = { ...updatedData, raw_input: newRawInput || '' };

    const success = await api.updateFoodLog(id, finalData);
    if (success) {
      if (updatedData.base_calories !== undefined && newRawInput && user?.id) {
        api.updateDictionaryFromEdit(newRawInput, {
          base_calories: updatedData.base_calories,
          base_protein: updatedData.base_protein || 0,
          base_carbs: updatedData.base_carbs || 0,
          base_fats: updatedData.base_fats || 0
        }, user.id);
      }
      setLogs(logs.map(l => l.id === id ? { ...l, ...finalData } : l));
      setEditingLog(null);
      setSuccessAlert("¡Alimento modificado con éxito!");
      setTimeout(() => setSuccessAlert(null), 2500);
    } else {
      setErrorAlert("Error al actualizar.");
    }
  };

  if (loading || !goals) {
    return (
      <MobileLayout>
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header Premium */}
      <header className="px-6 py-4 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0 border-b border-zinc-900">
        <Logo size="sm" showText={true} />
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setShowAccountModal(true)}
            className="flex items-center hover:opacity-80 transition-opacity mr-2"
            title="Tu Perfil"
          >
            <div className="w-8 h-8 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/20 overflow-hidden">
              <UserIcon className="w-4 h-4 text-primary-500" />
            </div>
          </button>
          <button onClick={signOut} className="p-2 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-900 rounded-full hover:bg-zinc-800" title="Cerrar Sesión">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-28 bg-transparent relative z-10">
        <div className="px-5 py-6 flex flex-col items-center">
          
          {/* Date Selector Centrado */}
          <div className="w-full max-w-[220px] flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-1 mb-3 shadow-sm">
            <button onClick={() => shiftDate(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-950 rounded-xl shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-bold text-base text-center">
              {getDisplayDate(selectedDate)}
            </span>
            <button 
              onClick={() => shiftDate(1)} 
              disabled={selectedDate === getLocalDateString()}
              className={`p-2 transition-colors rounded-xl shadow-sm ${selectedDate === getLocalDateString() ? 'text-zinc-800 bg-transparent cursor-not-allowed' : 'text-zinc-400 bg-zinc-950 hover:text-white'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Resumen de Objetivos Diarios */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center mb-6 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/40 rounded-[20px] py-1.5 px-3">
            <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-0.5">Objetivo Diario</span>
            <div className="flex items-center justify-center gap-2.5 text-[11px] font-bold text-zinc-300 w-full">
              <span className="text-emerald-400">{goals.target_calories} <span className="text-[9px] text-emerald-500/80">kcal</span></span>
              <span className="text-zinc-700">•</span>
              <span className="text-blue-400">{goals.target_protein}g <span className="text-[9px] text-blue-500/80">P</span></span>
              <span className="text-zinc-700">•</span>
              <span className="text-yellow-400">{goals.target_carbs}g <span className="text-[9px] text-yellow-500/80">C</span></span>
              <span className="text-zinc-700">•</span>
              <span className="text-purple-400">{goals.target_fats}g <span className="text-[9px] text-purple-500/80">G</span></span>
            </div>
          </div>
          
          <ProgressRing 
            segments={ringSegments}
            max={goals.target_calories}
            label="Consumidas"
            unit="KCAL"
          />

          <div className="mt-4 text-center">
             <span className="text-zinc-500 text-[10px] font-bold bg-zinc-900/40 px-3 py-1 rounded-full border border-zinc-800/40 uppercase tracking-wide">
               {Number(currentTotals.calories).toFixed(0)} kcal consumidas
             </span>
          </div>

          <div className="w-full bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-zinc-800/80 mt-8 space-y-6">
            <ProgressBar 
              label="Proteínas"
              current={Number(currentTotals.protein.toFixed(1))}
              max={goals.target_protein}
              colorClass="bg-blue-500"
            />
            <ProgressBar 
              label="Carbohidratos"
              current={Number(currentTotals.carbs.toFixed(1))}
              max={goals.target_carbs}
              colorClass="bg-yellow-500"
            />
            <ProgressBar 
              label="Grasas"
              current={Number(currentTotals.fats.toFixed(1))}
              max={goals.target_fats}
              colorClass="bg-purple-500"
            />
          </div>

          <div className="w-full mt-8">
            {(() => {
              const customCategories = new Set<string>();
              logs.forEach(log => {
                if (log.raw_input.startsWith('[CUSTOM:')) {
                  const endIdx = log.raw_input.indexOf(']');
                  if (endIdx > -1) {
                    customCategories.add(log.raw_input.substring(8, endIdx));
                  }
                }
              });
              const allCategories = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack', ...Array.from(customCategories)];

              return allCategories.map((meal) => {
                const isCustom = !['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'].includes(meal);
                const categoryLogs = logs.filter(l => {
                  if (isCustom) {
                    return l.raw_input.startsWith(`[CUSTOM:${meal}]`);
                  }
                  return l.meal_type === meal && !l.raw_input.startsWith('[CUSTOM:');
                }).map(l => {
                  if (isCustom && l.raw_input.startsWith(`[CUSTOM:${meal}]`)) {
                    return { ...l, raw_input: l.raw_input.substring(`[CUSTOM:${meal}]`.length).trim() };
                  }
                  return l;
                });

                return (
                  <MealAccordion 
                    key={meal}
                    meal={meal as MealType}
                    logs={categoryLogs}
                    onDeleteLog={handleDeleteLog}
                    onEditLog={setEditingLog}
                    onAddLog={(m) => setActiveCategoryInput(m)}
                  />
                );
              });
            })()}
            
            <button 
              onClick={() => setShowNewCategoryModal(true)}
              className="w-full py-4 mt-2 border-2 border-dashed border-zinc-800 text-zinc-500 font-bold rounded-3xl hover:bg-zinc-900/50 hover:text-white transition-colors"
            >
              + Añadir Comida Extra para Hoy
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeCategoryInput && (
        <CategoryInputModal 
          category={activeCategoryInput}
          isListening={isListening}
          transcript={transcript}
          isProcessing={isProcessing}
          iaResponse={iaResponse}
          error={speechError || apiError}
          onStartVoice={startListening}
          onStopVoice={stopListening}
          onCancel={closeInputModal}
          onProcessText={handleProcessText}
          onTextChange={manuallySetTranscript}
        />
      )}

      {editingLog && (
        <FoodEditModal 
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={handleSaveEdit}
        />
      )}

      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}

      {showNewCategoryModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNewCategoryModal(false)}></div>
          <div className="relative bg-zinc-900/95 backdrop-blur-xl w-[320px] rounded-[32px] p-6 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden m-auto">
            <div className="overflow-y-auto flex-1 hide-scrollbar">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Nueva Categoría</h3>
            <p className="text-sm text-zinc-400 mb-6 text-center">Ej. Pre-entreno, Batido Nocturno.</p>
            
            <input 
              id="new-category-input"
              type="text" 
              autoFocus
              placeholder="Nombre de la comida"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val && user) {
                    const nl = await api.addFoodLogs(user.id, [{ date: selectedDate, meal_type: 'Snack', raw_input: `[CUSTOM:${val}] __CATEGORY__`, quantity: 1, base_calories: 0, base_protein: 0, base_carbs: 0, base_fats: 0, calories: 0, protein: 0, carbs: 0, fats: 0 }]);
                    if (nl) setLogs([...logs, ...nl]);
                    setShowNewCategoryModal(false);
                  }
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-lg font-bold text-white text-center focus:ring-2 focus:ring-primary-500 outline-none mb-4"
            />
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={async () => {
                  const inputEl = document.getElementById('new-category-input') as HTMLInputElement;
                  const val = inputEl?.value.trim();
                  if (val && user) {
                    const nl = await api.addFoodLogs(user.id, [{ date: selectedDate, meal_type: 'Snack', raw_input: `[CUSTOM:${val}] __CATEGORY__`, quantity: 1, base_calories: 0, base_protein: 0, base_carbs: 0, base_fats: 0, calories: 0, protein: 0, carbs: 0, fats: 0 }]);
                    if (nl) setLogs([...logs, ...nl]);
                    setShowNewCategoryModal(false);
                  }
                }}
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-colors"
              >
                Añadir Categoría
              </button>
              <button 
                onClick={() => setShowNewCategoryModal(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-colors"
              >
                Cancelar
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmación de Borrado */}
      {logToDelete !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setLogToDelete(null)}></div>
          <div className="relative bg-zinc-900/95 backdrop-blur-xl w-[320px] rounded-[32px] p-6 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden m-auto">
            <div className="overflow-y-auto flex-1 hide-scrollbar">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-center">¿Eliminar Comida?</h3>
            <p className="text-sm text-zinc-400 mb-6 text-center">Esta acción no se puede deshacer.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-colors"
              >
                Sí, Eliminar
              </button>
              <button 
                onClick={() => setLogToDelete(null)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-colors"
              >
                Cancelar
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {errorAlert !== null && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setErrorAlert(null)}></div>
          <div className="relative bg-[#1A1A1A] w-full max-w-sm rounded-[32px] p-8 text-center border border-zinc-800/50 shadow-2xl animate-scale-up">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Atención!</h3>
              <p className="text-zinc-400 mb-8">{errorAlert}</p>
              <div className="space-y-3">
              <button onClick={() => setErrorAlert(null)} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors">Entendido</button>
              </div>
          </div>
        </div>,
        document.body
      )}

      {successAlert !== null && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSuccessAlert(null)}></div>
          <div className="relative bg-[#1A1A1A] w-full max-w-sm rounded-[32px] p-8 text-center border border-zinc-800/50 shadow-2xl animate-scale-up">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Excelente!</h3>
              <p className="text-zinc-400 mb-8">{successAlert}</p>
              <div className="space-y-3">
              <button onClick={() => setSuccessAlert(null)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-colors">Aceptar</button>
              </div>
          </div>
        </div>,
        document.body
      )}

    </MobileLayout>
  );
};
