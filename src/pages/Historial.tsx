import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { ChevronLeft, CalendarDays, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { getLocalDateString } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { FoodLog } from '../types';

export const Historial: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const data = await api.getAllFoodLogs(user.id);
    setLogs(data);
    setLoading(false);
  };

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = { items: [], calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    // Only count visible items (not the empty categories)
    if (log.raw_input !== '__CATEGORY__') {
      acc[log.date].items.push(log);
      acc[log.date].calories += Number(log.calories);
      acc[log.date].protein += Number(log.protein);
      acc[log.date].carbs += Number(log.carbs);
      acc[log.date].fats += Number(log.fats);
    }
    return acc;
  }, {} as Record<string, { items: FoodLog[], calories: number, protein: number, carbs: number, fats: number }>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = getLocalDateString();
    if (dateStr === today) return "Hoy";
    
    const formatted = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <MobileLayout>
      <header className="px-6 py-5 bg-zinc-950/80 backdrop-blur-md flex items-center gap-3 z-10 sticky top-0 border-b border-zinc-900">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-500" />
          Historial Nutricional
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 pb-28 relative z-10">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 border border-zinc-800/50 border-dashed rounded-3xl bg-zinc-950/50">
            <CalendarDays className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center font-medium">No hay registros pasados.<br/>¡Comienza a registrar hoy!</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[28px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
            {sortedDates.map((date) => {
              const dayData = groupedLogs[date];
              if (dayData.items.length === 0) return null; // Skip empty days

              return (
                <div key={date} className="relative flex items-start gap-6 group">
                  <div className="absolute left-0 mt-2 ml-[22px] w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="ml-12 w-full bg-zinc-900/50 backdrop-blur-md rounded-3xl p-5 border border-zinc-800 shadow-sm transition-all hover:bg-zinc-800/40">
                    <h3 className="font-bold text-white text-lg mb-4">{getDisplayDate(date)}</h3>
                    
                    <div className="flex items-center gap-4 mb-4 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50">
                      <div className="flex flex-col items-center flex-1 border-r border-zinc-800/50">
                        <Flame className="w-4 h-4 text-primary-500 mb-1" />
                        <span className="text-sm font-extrabold text-white">{dayData.calories.toFixed(0)}</span>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">kcal</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 border-r border-zinc-800/50">
                        <Beef className="w-4 h-4 text-blue-500 mb-1" />
                        <span className="text-sm font-extrabold text-white">{dayData.protein.toFixed(1)}g</span>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">PRO</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 border-r border-zinc-800/50">
                        <Wheat className="w-4 h-4 text-yellow-500 mb-1" />
                        <span className="text-sm font-extrabold text-white">{dayData.carbs.toFixed(1)}g</span>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">CARB</span>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <Droplet className="w-4 h-4 text-purple-500 mb-1" />
                        <span className="text-sm font-extrabold text-white">{dayData.fats.toFixed(1)}g</span>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">GRA</span>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-zinc-400">
                      {dayData.items.length} {dayData.items.length === 1 ? 'alimento registrado' : 'alimentos registrados'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </MobileLayout>
  );
};
