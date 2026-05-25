import React, { useState, useEffect } from 'react';
import { Mic, Check, Send, X } from 'lucide-react';
import type { GeminiNutritionResponse, MealType } from '../../types';

interface InputBottomSheetProps {
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
  iaResponse: GeminiNutritionResponse | null;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onCancel: () => void;
  onProcessText: (text: string) => void;
  onSave: (mealType: MealType) => void;
}

export const InputBottomSheet: React.FC<InputBottomSheetProps> = ({
  isListening,
  transcript,
  isProcessing,
  iaResponse,
  onStartVoice,
  onStopVoice,
  onCancel,
  onProcessText,
  onSave,
}) => {
  const [textInput, setTextInput] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Almuerzo');

  // Mantener el textInput sincronizado con el transcript de voz si el usuario usa voz
  useEffect(() => {
    if (transcript && isListening) {
      setTextInput(transcript);
    }
  }, [transcript, isListening]);

  // Removed early return null so the modal always renders when triggered by parent

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        
        {/* Header / Close button */}
        {!isProcessing && !isListening && (
          <button onClick={onCancel} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ESTADO 1: Grabando por voz o escribiendo texto */}
        {!iaResponse && !isProcessing && (
          <div className="flex flex-col items-center flex-1">
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 cursor-pointer transition-all ${
                isListening 
                  ? 'bg-red-500/20 text-red-500 animate-pulse' 
                  : 'bg-primary-500/20 text-primary-500 hover:bg-primary-500/30'
              }`}
              onClick={isListening ? onStopVoice : onStartVoice}
            >
              <Mic className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-100 mb-4">
              {isListening ? 'Escuchando...' : '¿Qué comiste?'}
            </h3>
            
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder-zinc-600"
              placeholder="Ej: Dos huevos revueltos con una tostada y palta..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isListening}
            />

            <button 
              onClick={() => onProcessText(textInput)}
              disabled={textInput.trim().length < 3}
              className="mt-6 w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Procesar Comida
            </button>
          </div>
        )}

        {/* ESTADO 2: Procesando con IA o Guardando DB */}
        {isProcessing && (
          <div className="flex flex-col items-center py-12">
            <div className="w-14 h-14 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-zinc-100">Analizando...</h3>
            <p className="text-sm text-zinc-400 mt-2 text-center">Gemini está calculando los macros exactos.</p>
          </div>
        )}

        {/* ESTADO 3: Confirmación de IA */}
        {iaResponse && !isProcessing && (
          <div className="flex flex-col items-center text-left w-full overflow-y-auto scrollbar-hide pb-2">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto shrink-0">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 text-center w-full mb-1">Resultados</h3>
            <p className="text-sm text-zinc-400 text-center w-full mb-6 italic">"{textInput}"</p>
            
            <div className="w-full bg-zinc-950 rounded-2xl p-5 mb-6 border border-zinc-800 shadow-inner">
              <p className="text-sm text-zinc-300 leading-relaxed mb-5">{iaResponse.summary_items}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 p-3 rounded-xl text-center shadow-sm">
                  <span className="block text-xs font-bold text-zinc-500 mb-1">Calorías</span>
                  <span className="text-lg font-bold text-zinc-100">{iaResponse.calories}</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl text-center shadow-sm border-b-2 border-blue-500">
                  <span className="block text-xs font-bold text-zinc-500 mb-1">Proteínas</span>
                  <span className="text-lg font-bold text-zinc-100">{iaResponse.protein}g</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl text-center shadow-sm border-b-2 border-yellow-500">
                  <span className="block text-xs font-bold text-zinc-500 mb-1">Carbos</span>
                  <span className="text-lg font-bold text-zinc-100">{iaResponse.carbs}g</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl text-center shadow-sm border-b-2 border-purple-500">
                  <span className="block text-xs font-bold text-zinc-500 mb-1">Grasas</span>
                  <span className="text-lg font-bold text-zinc-100">{iaResponse.fats}g</span>
                </div>
              </div>
            </div>

            <div className="w-full mb-6">
              <label className="block text-sm font-semibold text-zinc-400 mb-2">
                Asignar a la comida:
              </label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-medium rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3.5 appearance-none"
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value as MealType)}
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Merienda">Merienda</option>
                <option value="Cena">Cena</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <button 
              onClick={() => onSave(selectedMealType)}
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-900/20"
            >
              Guardar en el Diario
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
