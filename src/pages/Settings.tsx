import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { ChevronLeft, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { DailyGoals } from '../types';

export const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMeal, setNewMeal] = useState('');

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    const data = await api.getDailyGoals(user.id);
    if (data) setGoals(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !goals) return;
    setSaving(true);
    await api.updateDailyGoals(user.id, {
      target_calories: Number(goals.target_calories),
      target_protein: Number(goals.target_protein),
      target_carbs: Number(goals.target_carbs),
      target_fats: Number(goals.target_fats),
      custom_meals: goals.custom_meals || [],
    });
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

  return (
    <MobileLayout>
      <header className="px-6 py-5 bg-zinc-950 flex items-center z-10 border-b border-zinc-900">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-full mr-3">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Configuración</h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 pb-28">
        <div className="bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-800 space-y-6">
          <h3 className="font-bold text-zinc-100 border-b border-zinc-800 pb-2">Metas Diarias</h3>
          
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">Calorías Totales (kcal)</label>
            <input 
              type="number" 
              value={goals.target_calories}
              onChange={(e) => setGoals({...goals, target_calories: Number(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-400 mb-2">Proteínas (g)</label>
            <input 
              type="number" 
              value={goals.target_protein}
              onChange={(e) => setGoals({...goals, target_protein: Number(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-yellow-400 mb-2">Carbohidratos (g)</label>
            <input 
              type="number" 
              value={goals.target_carbs}
              onChange={(e) => setGoals({...goals, target_carbs: Number(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-400 mb-2">Grasas (g)</label>
            <input 
              type="number" 
              value={goals.target_fats}
              onChange={(e) => setGoals({...goals, target_fats: Number(e.target.value)})}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </main>
    </MobileLayout>
  );
};
