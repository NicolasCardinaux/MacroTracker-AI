import React, { useEffect, useRef } from 'react';
import { Mic, Send, X, Square } from 'lucide-react';
import type { GeminiNutritionResponse, MealType } from '../../types';

interface CategoryInputModalProps {
  category: MealType;
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
  iaResponse: GeminiNutritionResponse | null;
  error?: string | null;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onCancel: () => void;
  onProcessText: (text: string) => void;
  onTextChange: (text: string) => void;
  onSave: (mealType: MealType) => void;
}

export const CategoryInputModal: React.FC<CategoryInputModalProps> = ({
  category,
  isListening,
  transcript,
  isProcessing,
  iaResponse,
  error,
  onStartVoice,
  onStopVoice,
  onCancel,
  onProcessText,
  onTextChange,
  onSave,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al final cuando entra texto por voz
  useEffect(() => {
    if (textareaRef.current && isListening) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [transcript, isListening]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-zinc-900 w-full max-w-md rounded-[32px] p-8 border border-zinc-800 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              Añadir a {category}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">Dicta o escribe tus alimentos</p>
          </div>
          {!isProcessing && (
            <button onClick={onCancel} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center animate-in slide-in-from-top-2">
            <p className="text-sm text-red-400 font-medium text-center">{error}</p>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        {!iaResponse && !isProcessing && (
          <div className="flex flex-col flex-1">
            <div className="relative mb-6">
              <textarea
                ref={textareaRef}
                className={`w-full bg-zinc-900 border ${isListening ? 'border-primary-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-zinc-800'} text-zinc-100 rounded-2xl p-4 min-h-[160px] focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none placeholder-zinc-600 transition-all text-lg`}
                placeholder="Ej: Dos huevos revueltos con una tostada y media palta..."
                value={transcript}
                onChange={(e) => onTextChange(e.target.value)}
              />
              
              {/* Mic Button Floating inside textarea */}
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                {isListening && (
                  <div className="flex items-center gap-1 h-6 mr-2">
                    <div className="w-1 bg-primary-500 rounded-full animate-[soundwave_1s_ease-in-out_infinite] h-2"></div>
                    <div className="w-1 bg-primary-500 rounded-full animate-[soundwave_1s_ease-in-out_infinite_0.2s] h-4"></div>
                    <div className="w-1 bg-primary-500 rounded-full animate-[soundwave_1s_ease-in-out_infinite_0.4s] h-6"></div>
                    <div className="w-1 bg-primary-500 rounded-full animate-[soundwave_1s_ease-in-out_infinite_0.6s] h-3"></div>
                  </div>
                )}
                <button 
                  onClick={isListening ? onStopVoice : onStartVoice}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                      : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <style>{`
              @keyframes soundwave {
                0%, 100% { transform: scaleY(0.5); }
                50% { transform: scaleY(1.5); }
              }
            `}</style>

            <button 
              onClick={() => onProcessText(transcript)}
              disabled={transcript.trim().length < 3}
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Procesar Comida
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isProcessing && (
          <div className="flex flex-col items-center py-16">
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-16 h-16 border-4 border-zinc-800 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Analizando...</h3>
            <p className="text-sm text-zinc-400 mt-2 text-center max-w-[250px]">Gemini está calculando calorías y macronutrientes exactos.</p>
          </div>
        )}
      </div>
    </div>
  );
};
