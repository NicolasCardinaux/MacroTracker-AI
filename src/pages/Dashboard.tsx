import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { ProgressRing } from '../components/ui/ProgressRing';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MealAccordion } from '../components/ui/MealAccordion';
import { CategoryInputModal } from '../components/ui/CategoryInputModal';
import { FoodEditModal } from '../components/ui/FoodEditModal';
import { ProfileModal } from '../components/ui/ProfileModal';
import { Logo } from '../components/ui/Logo';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { User as UserIcon, X as XIcon, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // UI States
  const [activeCategoryInput, setActiveCategoryInput] = useState<MealType | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [iaResponse, setIaResponse] = useState<GeminiNutritionResponse | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user, selectedDate]);

  // Bloquear scroll cuando los modales inline están abiertos
  useEffect(() => {
    if (showNewCategoryModal || logToDelete !== null || showProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showNewCategoryModal, logToDelete, showProfile]);

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
    const today = new Date().toISOString().split('T')[0];
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
    if (isListening) stopListening();

    try {
      const result = await api.analyzeFoodWithGemini(text);
      // Auto-guardar directamente
      await handleConfirmSaveNew(activeCategoryInput, text, result);
    } catch (error: any) {
      alert(error.message || "Error al procesar con IA. Intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  const handleConfirmSaveNew = async (mealType: string, rawInput: string, aiData: GeminiNutritionResponse) => {
    if (!user) return;
    
    const isCustom = !['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'].includes(mealType);
    const dbMealType = isCustom ? 'Snack' : (mealType as MealType);

    const foods = aiData.foods?.length > 0 ? aiData.foods : [{ name: rawInput, amount: '', calories: 0, protein: 0, carbs: 0, fats: 0 }];
    
    const logsToInsert = foods.map(f => ({
      date: selectedDate,
      meal_type: dbMealType,
      raw_input: isCustom ? `[CUSTOM:${mealType}] ${f.amount} ${f.name}`.trim() : `${f.amount} ${f.name}`.trim(),
      calories: Math.round(Number(f.calories)),
      protein: Math.round(Number(f.protein)),
      carbs: Math.round(Number(f.carbs)),
      fats: Math.round(Number(f.fats))
    }));

    const newLogs = await api.addFoodLogs(user.id, logsToInsert);

    if (newLogs && newLogs.length > 0) {
      setLogs([...logs, ...newLogs]);
      closeInputModal();
    } else {
      alert("Error al guardar en la base de datos.");
      setIsProcessing(false);
    }
  };

  const closeInputModal = () => {
    setActiveCategoryInput(null);
    setIaResponse(null);
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
      setLogs(logs.map(l => l.id === id ? { ...l, ...finalData } : l));
      setEditingLog(null);
    } else {
      alert("Error al actualizar.");
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
            onClick={() => setShowProfile(true)}
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
          <div className="w-full max-w-[240px] flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-1 mb-8 shadow-sm">
            <button onClick={() => shiftDate(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-950 rounded-xl shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-bold text-base text-center">
              {getDisplayDate(selectedDate)}
            </span>
            <button 
              onClick={() => shiftDate(1)} 
              disabled={selectedDate === new Date().toISOString().split('T')[0]}
              className={`p-2 transition-colors rounded-xl shadow-sm ${selectedDate === new Date().toISOString().split('T')[0] ? 'text-zinc-800 bg-transparent cursor-not-allowed' : 'text-zinc-400 bg-zinc-950 hover:text-white'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <ProgressRing 
            segments={ringSegments}
            max={goals.target_calories}
            label="Consumidas"
            unit="KCAL"
          />

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
          error={speechError}
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

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

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
                    const nl = await api.addFoodLogs(user.id, [{ date: selectedDate, meal_type: 'Snack', raw_input: `[CUSTOM:${val}] __CATEGORY__`, calories: 0, protein: 0, carbs: 0, fats: 0 }]);
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
                    const nl = await api.addFoodLogs(user.id, [{ date: selectedDate, meal_type: 'Snack', raw_input: `[CUSTOM:${val}] __CATEGORY__`, calories: 0, protein: 0, carbs: 0, fats: 0 }]);
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
    </MobileLayout>
  );
};
