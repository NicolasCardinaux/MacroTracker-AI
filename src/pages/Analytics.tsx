import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import type { DailyGoals } from '../types';

export const Analytics: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    
    const fetchedGoals = await api.getDailyGoals(user.id);
    setGoals(fetchedGoals);

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const { data: logs } = await supabase
      .from('food_logs')
      .select('date, calories, protein, carbs, fats')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0]);

    if (logs) {
      const grouped = logs.reduce((acc: any, log) => {
        if (!acc[log.date]) {
          acc[log.date] = { date: log.date, calories: 0, protein: 0 };
        }
        acc[log.date].calories += log.calories;
        acc[log.date].protein += Number(log.protein);
        return acc;
      }, {});

      const finalData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayStr = d.toLocaleDateString('es-AR', { weekday: 'short' });
        
        finalData.push({
          day: dayStr.charAt(0).toUpperCase() + dayStr.slice(1),
          calories: grouped[dateStr]?.calories || 0,
          protein: grouped[dateStr]?.protein || 0
        });
      }
      setWeeklyData(finalData);
    }
    
    setLoading(false);
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

  const rawName = user?.user_metadata?.display_name || user?.user_metadata?.name || user?.user_metadata?.full_name;
  const firstName = rawName ? rawName.split(' ')[0] : '';
  const displayName = firstName ? `, ${firstName}` : '';

  const rawToday = new Date().toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
  const capitalizedDate = rawToday.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const dateSuffix = ` — ${capitalizedDate}`;

  return (
    <MobileLayout>
      <header className="px-6 py-5 bg-zinc-950/80 backdrop-blur-md flex items-center z-10 sticky top-0 border-b border-zinc-900">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-full mr-3">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          Analíticas{displayName}<span className="text-zinc-500 font-medium">{dateSuffix}</span>
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-transparent p-6 space-y-8 pb-28 relative z-10">
        
        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-zinc-100">Calorías Semanales</h3>
              <p className="text-xs text-zinc-400">Últimos 7 días</p>
            </div>
            <div className="bg-primary-500/10 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-primary-500" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', color: '#f4f4f5' }} />
                <ReferenceLine y={goals.target_calories} stroke="#ef4444" strokeDasharray="5 5" />
                <Bar dataKey="calories" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-zinc-100">Tendencia de Proteínas</h3>
              <p className="text-xs text-zinc-400">Objetivo: {goals.target_protein}g</p>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', color: '#f4f4f5' }} />
                <ReferenceLine y={goals.target_protein} stroke="#3b82f6" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#18181b' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </MobileLayout>
  );
};
