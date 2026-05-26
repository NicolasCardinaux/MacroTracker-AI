import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Activity, Target, Flame, Scale, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { calculateNutritionalNeeds } from '../../utils/calculator';
import type { CalculatorData, CalculationResult } from '../../utils/calculator';
import { api } from '../../services/api';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};

  const [displayName, setDisplayName] = useState(meta.display_name || '');
  const [age, setAge] = useState<number>(meta.age || 25);
  const [gender, setGender] = useState<'male' | 'female'>(meta.gender || 'male');
  const [height, setHeight] = useState<number>(meta.height || 170);
  const [weight, setWeight] = useState<number>(meta.weight || 70);
  const [activityLevel, setActivityLevel] = useState<CalculatorData['activityLevel']>(meta.activity_level || 'moderate');
  const [goal, setGoal] = useState<CalculatorData['goal']>(meta.goal || 'maintain');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);

  // Calcular en tiempo real
  useEffect(() => {
    if (height > 0 && weight > 0 && age > 0) {
      const result = calculateNutritionalNeeds({
        weight, height, age, gender, activityLevel, goal
      });
      setCalcResult(result);
    }
  }, [weight, height, age, gender, activityLevel, goal]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!user || !calcResult) return;
    setSaving(true);
    
    // 1. Guardar metadatos estáticos en Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        display_name: displayName,
        age,
        gender,
        height,
        weight,
        activity_level: activityLevel,
        goal
      }
    });

    if (authError) {
      alert("Error al actualizar perfil");
      setSaving(false);
      return;
    }

    // 2. Actualizar metas diarias
    await api.updateDailyGoals(user.id, {
      target_calories: calcResult.targetCalories,
      target_protein: calcResult.macros.protein,
      target_carbs: calcResult.macros.carbs,
      target_fats: calcResult.macros.fats,
      physical_goal: goal
    });

    // 3. Registrar el peso en BodyMetrics
    const today = new Date().toISOString().split('T')[0];
    const metrics = await api.getBodyMetrics(user.id);
    const todayMetric = metrics.find(m => m.date === today);
    if (todayMetric) {
      // Actualizar si ya existe hoy
      await supabase.from('body_metrics').update({ weight }).eq('id', todayMetric.id);
    } else {
      await api.addBodyMetric(user.id, { date: today, weight });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      onClose();
      window.location.reload(); 
    }, 1200);
  };

  const getBmiColor = (category: string) => {
    if (category === 'Bajo peso') return 'text-blue-400';
    if (category === 'Normal') return 'text-emerald-400';
    if (category === 'Sobrepeso') return 'text-yellow-400';
    return 'text-red-400';
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-950/95 backdrop-blur-2xl w-full max-w-md rounded-[32px] border border-zinc-800/50 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh] overflow-hidden m-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-xl">
              <UserIcon className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Mi Perfil Físico</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="overflow-y-auto flex-1 hide-scrollbar p-6 space-y-8">
          
          {/* Nombre */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-400">¿Cómo te llamamos?</label>
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-lg font-medium text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
              placeholder="Tu nombre..."
            />
          </div>

          {/* Grid Físico */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sexo</label>
              <select 
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none"
              >
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Edad</label>
              <input 
                type="number" value={age} onChange={e => setAge(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Peso (kg)</label>
              <input 
                type="number" value={weight} onChange={e => setWeight(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Altura (cm)</label>
              <input 
                type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>
          </div>

          {/* Actividad y Objetivo */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4"/> Actividad Física</label>
              <select 
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none"
              >
                <option value="sedentary">Sedentario (Poco o nada)</option>
                <option value="light">Ligero (1-3 días/sem)</option>
                <option value="moderate">Moderado (3-5 días/sem)</option>
                <option value="active">Activo (6-7 días/sem)</option>
                <option value="very_active">Muy Activo (Doble turno)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Target className="w-4 h-4"/> Objetivo</label>
              <div className="grid grid-cols-3 gap-2">
                {(['deficit', 'maintain', 'surplus'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      goal === g 
                        ? 'bg-primary-500 text-zinc-950 shadow-lg shadow-primary-500/20' 
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {g === 'deficit' ? 'Perder' : g === 'maintain' ? 'Mantener' : 'Subir'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados de la Calculadora */}
          {calcResult && (
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-primary-500/10">
              <h3 className="text-sm font-semibold text-primary-400 mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Resultados de tu Metabolismo
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Índice de Masa Corporal (IMC)</span>
                  <div className="text-right">
                    <span className="text-white font-bold">{calcResult.bmi}</span>
                    <span className={`text-xs ml-2 font-medium ${getBmiColor(calcResult.bmiCategory)}`}>
                      ({calcResult.bmiCategory})
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Gasto Diario (TDEE)</span>
                  <span className="text-white font-bold">{calcResult.tdee} kcal</span>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-800/50">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-zinc-300 font-medium">Recomendación Diaria</span>
                    <span className="text-2xl font-black text-primary-400">{calcResult.targetCalories} kcal</span>
                  </div>
                  <div className="flex gap-2 text-xs font-semibold text-zinc-500 justify-between">
                    <span className="bg-zinc-800 px-2 py-1 rounded">P: {calcResult.macros.protein}g</span>
                    <span className="bg-zinc-800 px-2 py-1 rounded">C: {calcResult.macros.carbs}g</span>
                    <span className="bg-zinc-800 px-2 py-1 rounded">G: {calcResult.macros.fats}g</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800/50 bg-zinc-950/50">
          <button 
            onClick={handleSave}
            disabled={saving || !displayName || saved}
            className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${
              saved 
                ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
            } disabled:opacity-50`}
          >
            {saved ? (
              <><Check className="w-5 h-5" /> Perfil Actualizado</>
            ) : saving ? (
              'Calculando y Guardando...'
            ) : (
              'Guardar Perfil'
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
