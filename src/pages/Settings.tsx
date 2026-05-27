import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { ChevronLeft, Save, User as UserIcon, Activity, Target } from 'lucide-react';
import { getLocalDateString } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { calculateNutritionalNeeds } from '../utils/calculator';
import type { DailyGoals } from '../types';
import type { CalculatorData, CalculationResult } from '../utils/calculator';

export const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};

  const [goals, setGoals] = useState<DailyGoals | null>(null);
  
  // Physical Profile State
  const [age, setAge] = useState<number>(meta.age || 25);
  const [gender, setGender] = useState<'male' | 'female'>(meta.gender || 'male');
  const [height, setHeight] = useState<number>(meta.height || 170);
  const [weight, setWeight] = useState<number>(meta.weight || 70);
  const [activityLevel, setActivityLevel] = useState<CalculatorData['activityLevel']>(meta.activity_level || 'moderate');
  const [goal, setGoal] = useState<CalculatorData['goal']>(meta.goal || 'maintain');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    const data = await api.getDailyGoals(user.id);
    if (data) setGoals(data);
    setLoading(false);
  };

  // Autocalculate when physical profile changes
  useEffect(() => {
    if (height > 0 && weight > 0 && age > 0) {
      const result = calculateNutritionalNeeds({
        weight, height, age, gender, activityLevel, goal
      });
      setCalcResult(result);
      
      // Auto-update goals state if loaded
      if (goals) {
        setGoals({
          ...goals,
          target_calories: result.targetCalories,
          target_protein: result.macros.protein,
          target_carbs: result.macros.carbs,
          target_fats: result.macros.fats,
          physical_goal: goal
        });
      }
    }
  }, [weight, height, age, gender, activityLevel, goal]); // Removed goals from dependency to avoid infinite loop

  const handleSave = async () => {
    if (!user || !goals || !calcResult) return;
    setSaving(true);

    // 1. Update Auth metadata (Physical Profile + initial_weight)
    const metadataUpdate: any = {
      age, gender, height, weight, activity_level: activityLevel, goal
    };
    
    // Save initial_weight only if it doesn't exist
    if (!meta.initial_weight) {
      metadataUpdate.initial_weight = weight;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: metadataUpdate
    });

    if (authError) {
      alert("Error al guardar perfil: " + authError.message);
      setSaving(false);
      return;
    }

    // 2. Update Daily Goals
    await api.updateDailyGoals(user.id, {
      target_calories: Number(goals.target_calories),
      target_protein: Number(goals.target_protein),
      target_carbs: Number(goals.target_carbs),
      target_fats: Number(goals.target_fats),
      custom_meals: goals.custom_meals || [],
      physical_goal: goal
    });

    // 3. Update Body Metrics for today
    const today = getLocalDateString();
    const metrics = await api.getBodyMetrics(user.id);
    const todayMetric = metrics.find(m => m.date === today);
    if (todayMetric) {
      await supabase.from('body_metrics').update({ weight }).eq('id', todayMetric.id);
    } else {
      await api.addBodyMetric(user.id, { date: today, weight });
    }

    setSaving(false);
    onBack();
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

  const getBmiColor = (category: string) => {
    if (category === 'Bajo peso') return 'text-blue-400';
    if (category === 'Normal') return 'text-emerald-400';
    if (category === 'Sobrepeso') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <MobileLayout>
      <header className="px-6 py-5 bg-zinc-950/80 backdrop-blur-md flex items-center z-10 sticky top-0 border-b border-zinc-900">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-full mr-3">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Ajustes Físicos</h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 space-y-8 pb-[200px]">
        
        {/* IMC and BMR Summary */}
        {calcResult && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800/80 shadow-lg">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-zinc-400 text-sm font-medium mb-1">Tu IMC</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">{calcResult.bmi}</span>
                  <span className={`text-sm font-bold ${getBmiColor(calcResult.bmiCategory)}`}>
                    {calcResult.bmiCategory}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-sm font-medium mb-1">Calorías Base</p>
                <p className="text-xl font-bold text-zinc-200">{calcResult.bmr} <span className="text-xs text-zinc-500 font-normal">kcal/día</span></p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-800/50">
              <p className="text-xs text-zinc-400 text-center">Tus macros sugeridos se auto-calculan abajo basados en tu perfil.</p>
            </div>
          </div>
        )}

        {/* Physical Profile Details */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary-500" /> Mi Cuerpo
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Gender Selection */}
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sexo Biológico</label>
              <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${gender === 'male' ? 'bg-primary-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  Hombre
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${gender === 'female' ? 'bg-primary-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  Mujer
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Edad</label>
              <div className="relative">
                <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">años</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Altura</label>
              <div className="relative">
                <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">cm</span>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Peso Actual</label>
              <div className="relative">
                <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Level */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" /> Nivel de Actividad
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'sedentary', label: 'Sedentario', desc: 'Poco o ningún ejercicio' },
              { id: 'light', label: 'Ligero', desc: 'Ejercicio ligero 1-3 días/semana' },
              { id: 'moderate', label: 'Moderado', desc: 'Ejercicio moderado 3-5 días/semana' },
              { id: 'active', label: 'Activo', desc: 'Ejercicio fuerte 6-7 días/semana' },
              { id: 'very_active', label: 'Muy Activo', desc: 'Deporte profesional o trabajo físico' }
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setActivityLevel(lvl.id as any)}
                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${activityLevel === lvl.id ? 'bg-primary-500/10 border-primary-500/50 shadow-sm' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900'}`}
              >
                <span className={`font-bold text-sm ${activityLevel === lvl.id ? 'text-primary-400' : 'text-zinc-200'}`}>{lvl.label}</span>
                <span className="text-xs text-zinc-500 mt-1">{lvl.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" /> Objetivo Físico
          </h3>
          <div className="flex flex-col bg-zinc-900 p-1.5 rounded-[1.25rem] border border-zinc-800 gap-1.5">
            {[
              { id: 'deficit', label: 'Perder Grasa' },
              { id: 'maintain', label: 'Mantener Peso' },
              { id: 'surplus', label: 'Ganar Masa Muscular' }
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id as any)}
                className={`py-3.5 text-sm font-bold rounded-xl transition-all ${goal === g.id ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 space-y-6">
          <h3 className="font-bold text-lg text-zinc-100 border-b border-zinc-800 pb-2">Distribución de Macros (Auto)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Calorías Objetivo</label>
              <input type="number" value={goals.target_calories} onChange={(e) => setGoals({...goals, target_calories: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 font-bold focus:ring-1 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Proteínas (g)</label>
              <input type="number" value={goals.target_protein} onChange={(e) => setGoals({...goals, target_protein: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 font-bold focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">Carbohidratos (g)</label>
              <input type="number" value={goals.target_carbs} onChange={(e) => setGoals({...goals, target_carbs: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 font-bold focus:ring-1 focus:ring-yellow-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Grasas (g)</label>
              <input type="number" value={goals.target_fats} onChange={(e) => setGoals({...goals, target_fats: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 font-bold focus:ring-1 focus:ring-purple-500 outline-none" />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-20 left-0 right-0 w-full flex justify-center pointer-events-none z-20">
        <div className="w-full max-w-md p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 disabled:opacity-50 pointer-events-auto"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Todo
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};
