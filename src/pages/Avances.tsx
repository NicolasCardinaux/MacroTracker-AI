import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { createPortal } from 'react-dom';
import { ChevronLeft, Plus, Scale, TrendingDown, Target, Maximize2, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { getLocalDateString } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import type { BodyMetric } from '../types';

export const Avances: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [goals, setGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newTargetWeight, setNewTargetWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [goalType, setGoalType] = useState<'deficit' | 'maintain' | 'surplus'>('maintain');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      loadMetrics();
      if (user.user_metadata?.target_weight) {
        setTargetWeight(user.user_metadata.target_weight);
      }
    }
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;
    const [data, userGoals] = await Promise.all([
      api.getBodyMetrics(user.id),
      api.getDailyGoals(user.id)
    ]);
    setMetrics(data);
    if (userGoals) {
      setGoals(userGoals);
      setGoalType(userGoals.physical_goal || 'maintain');
    }
    setLoading(false);
  };

  const updateGoalType = async (type: 'deficit' | 'maintain' | 'surplus') => {
    if (!user || !goals) return;
    setGoalType(type);
    await api.updateDailyGoals(user.id, { ...goals, physical_goal: type });
  };

  const handleAddMetric = async () => {
    if (!user || !newWeight) return;
    const weight = Number(newWeight);
    if (isNaN(weight)) return;

    if (newTargetWeight && !isNaN(Number(newTargetWeight))) {
      const tW = Number(newTargetWeight);
      setTargetWeight(tW);
      await supabase.auth.updateUser({ data: { target_weight: tW } });
    }

    const metric = await api.addBodyMetric(user.id, {
      date: getLocalDateString(),
      weight
    });

    if (metric) {
      setMetrics([...metrics, metric]);
      setIsAdding(false);
      setNewWeight('');
      setNewTargetWeight('');
    }
  };

  // Deduplicate metrics (keep only the latest entry per day)
  const deduplicatedMetrics = metrics.reduce((acc, m) => {
    // Since metrics are ordered by date ascending, overwriting with the same date keeps the latest one
    acc[m.date] = m;
    return acc;
  }, {} as Record<string, BodyMetric>);
  
  const finalMetrics = Object.values(deduplicatedMetrics);

  const chartData = finalMetrics.map(m => {
    const rawDate = new Date(m.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
    return {
      date: rawDate.charAt(0).toUpperCase() + rawDate.slice(1),
      peso: Number(m.weight)
    };
  });

  const currentWeight = finalMetrics.length > 0 ? Number(finalMetrics[finalMetrics.length - 1].weight) : 0;
  const startWeight = user?.user_metadata?.initial_weight || (finalMetrics.length > 0 ? Number(finalMetrics[0].weight) : 0);

  // Calculo de proyección
  const getExpectedChange = () => {
    if (goalType === 'deficit') return -0.5; // pierde 0.5kg por semana
    if (goalType === 'surplus') return 0.25; // gana 0.25kg por semana
    return 0;
  };



  const getProjectionRate = () => {
    return Math.abs(getExpectedChange() / 7); // base daily rate
  };

  const projectionType = goalType;

  const rawName = user?.user_metadata?.display_name || user?.user_metadata?.name || user?.user_metadata?.full_name;
  const firstName = rawName ? rawName.split(' ')[0] : '';
  const displayName = firstName ? `, ${firstName}` : '';

  const rawToday = new Date().toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
  const capitalizedDate = rawToday.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const dateSuffix = ` — ${capitalizedDate}`;

  return (
    <MobileLayout>
      {/* Header */}
      <header className="px-6 py-5 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            Tus Avances{displayName}<span className="text-zinc-500 font-medium">{dateSuffix}</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white rounded-full transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 pb-28 relative z-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-center items-center backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Scale className="w-5 h-5 text-primary-500 mb-1" />
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Actual</p>
            <p className="text-xl font-extrabold text-white">{currentWeight ? currentWeight.toFixed(1) : '--'}<span className="text-xs text-zinc-500 ml-1">kg</span></p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-center items-center backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Target className="w-5 h-5 text-emerald-500 mb-1" />
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Inicial</p>
            <p className="text-xl font-extrabold text-white">{startWeight ? startWeight.toFixed(1) : '--'}<span className="text-xs text-zinc-500 ml-1">kg</span></p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-center items-center backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Target className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Deseado</p>
            <p className="text-xl font-extrabold text-white">{targetWeight ? targetWeight.toFixed(1) : '--'}<span className="text-xs text-zinc-500 ml-1">kg</span></p>
          </div>
        </div>

        {/* Goal Selector */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl">
          <h3 className="font-bold text-zinc-100 text-lg mb-4">Meta Corporal</h3>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button 
              onClick={() => updateGoalType('deficit')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition-colors ${goalType === 'deficit' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'}`}
            >
              Déficit
            </button>
            <button 
              onClick={() => updateGoalType('maintain')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition-colors ${goalType === 'maintain' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'}`}
            >
              Mantener
            </button>
            <button 
              onClick={() => updateGoalType('surplus')}
              className={`py-3 px-2 rounded-xl text-xs font-bold transition-colors ${goalType === 'surplus' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'}`}
            >
              Superávit
            </button>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">PROYECCIÓN</p>
                  <p className="text-zinc-100 font-bold text-sm">
                    {projectionType === 'deficit' ? 'Perder' : projectionType === 'surplus' ? 'Ganar' : 'Mantener'} 
                    {projectionType !== 'maintain' && ` ${(getProjectionRate() * (frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30)).toFixed(2)} kg por ${
                      frequency === 'daily' ? 'día' : frequency === 'weekly' ? 'semana' : 'mes'
                    }`}
                  </p>
                </div>
                
                <div className="relative">
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="appearance-none bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 text-sm font-medium rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer shadow-inner hover:bg-zinc-700/80 transition-colors"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-zinc-100 text-lg flex items-center gap-2">
              Evolución de Peso <TrendingDown className="w-5 h-5 text-zinc-500" />
            </h3>
            <button onClick={() => setIsExpanded(true)} className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-zinc-400 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 border border-zinc-800/50 border-dashed rounded-2xl bg-zinc-950/50">
              <Scale className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No hay registros de peso.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={1}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#f4f4f5' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1}
                    fill="url(#colorPeso)"
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 4, fill: '#18181b' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Modal Gráfico Expandido */}
        {isExpanded && createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-950">
              <div>
                <h2 className="text-xl font-bold text-white">Evolución de Peso</h2>
                <p className="text-sm text-zinc-400">Análisis detallado</p>
              </div>
              <button onClick={() => setIsExpanded(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 w-full p-6 pt-12 flex items-center justify-center">
              <div className="w-full h-full max-h-[60vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorPesoExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#a1a1aa' }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#a1a1aa' }} domain={['auto', 'auto']} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', color: '#f4f4f5', padding: '12px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="#10b981" 
                      strokeWidth={5} 
                      fillOpacity={1}
                      fill="url(#colorPesoExp)"
                      dot={{ fill: '#18181b', stroke: '#10b981', strokeWidth: 3, r: 6 }}
                      activeDot={{ r: 10, stroke: '#10b981', strokeWidth: 5, fill: '#18181b' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* List of Entries */}
        <div className="space-y-3">
          <h3 className="font-bold text-zinc-100 text-lg ml-2 mb-4">Historial</h3>
          {[...finalMetrics].reverse().map(m => (
            <div key={m.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-zinc-400 font-medium">{new Date(m.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <span className="text-lg font-bold text-white">{Number(m.weight).toFixed(1)} <span className="text-sm text-zinc-500">kg</span></span>
            </div>
          ))}
        </div>
      </main>

      {/* Add Modal */}
      {isAdding && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="relative bg-zinc-900/95 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-6 border border-zinc-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Registrar Avance</h3>
            
            <label className="block text-sm font-bold text-zinc-400 mb-2">Peso Actual (kg)</label>
            <input 
              type="number" 
              step="0.1"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="Ej. 75.5"
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-2xl font-bold text-white text-center focus:ring-2 focus:ring-primary-500 outline-none mb-4"
            />

            <label className="block text-sm font-bold text-zinc-400 mb-2 mt-4">Peso Deseado / Meta <span className="text-zinc-600 font-normal">(Opcional)</span></label>
            <input 
              type="number" 
              step="0.1"
              value={newTargetWeight}
              onChange={e => setNewTargetWeight(e.target.value)}
              placeholder="Ej. 70.0 (vacío = mantener)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-2xl font-bold text-white text-center focus:ring-2 focus:ring-blue-500 outline-none mb-6"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddMetric}
                disabled={!newWeight}
                className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-colors disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};
