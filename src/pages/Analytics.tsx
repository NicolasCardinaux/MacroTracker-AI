import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { createPortal } from 'react-dom';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChevronLeft, Calendar, Bot, Sparkles, Maximize2, X, Save, History, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import type { DailyGoals, AIConsultation } from '../types';

export const Analytics: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [expandedChart, setExpandedChart] = useState<'calories' | 'protein' | null>(null);

  const [aiHistory, setAiHistory] = useState<AIConsultation[]>([]);
  const [isAiMinimized, setIsAiMinimized] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const getAnalysisCount = () => {
    try {
      const datesStr = localStorage.getItem('analysis_dates');
      let dates: number[] = datesStr ? JSON.parse(datesStr) : [];
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      dates = dates.filter(d => d > oneWeekAgo);
      localStorage.setItem('analysis_dates', JSON.stringify(dates));
      return dates.length;
    } catch {
      return 0;
    }
  };

  const addAnalysisDate = () => {
    try {
      const datesStr = localStorage.getItem('analysis_dates');
      let dates: number[] = datesStr ? JSON.parse(datesStr) : [];
      dates.push(Date.now());
      localStorage.setItem('analysis_dates', JSON.stringify(dates));
      setAnalysisCount(dates.length);
    } catch {}
  };

  const [analysisCount, setAnalysisCount] = useState(getAnalysisCount());
  // Removed limit for testing
  const maxAnalysisPerWeek = 999;

  useEffect(() => {
    if (user) {
      loadAnalytics();
      loadAiHistory();
    }
  }, [user]);

  const loadAiHistory = async () => {
    if (!user) return;
    const history = await api.getAiConsultations(user.id);
    setAiHistory(history);
  };

  const handleSaveConsultation = async () => {
    if (!user || !aiRecommendation) return;
    setIsSavingAi(true);
    const success = await api.saveAiConsultation(user.id, aiRecommendation);
    if (success) {
      await loadAiHistory();
      setAiRecommendation(null);
      setIsAiMinimized(false);
      setShowHistory(true);
    }
    setIsSavingAi(false);
  };

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
        
        {/* IA CONSULTANT CARD */}
        <div className="bg-gradient-to-br from-primary-900/40 to-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-primary-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bot className="w-24 h-24 text-primary-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-500/20 p-2.5 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-lg">Consultor IA</h3>
                  <p className="text-xs text-primary-400 font-medium">Análisis semanal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-xl transition-colors ${showHistory ? 'bg-primary-500/20 text-primary-400' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
                  title="Historial de consultas"
                >
                  <History className="w-5 h-5" />
                </button>
              </div>
            </div>

            {aiRecommendation ? (
              <div className="space-y-3">
                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tu análisis actual</span>
                    <button onClick={() => setIsAiMinimized(!isAiMinimized)} className="text-zinc-400 hover:text-zinc-200 p-1">
                      {isAiMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                  {!isAiMinimized && (
                    <p className="text-sm text-zinc-300 leading-relaxed mt-2">{aiRecommendation}</p>
                  )}
                </div>
                {!isAiMinimized && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAiRecommendation(null)}
                      className="flex-1 py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm font-bold rounded-xl transition-colors"
                    >
                      Cerrar consulta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (analysisCount >= maxAnalysisPerWeek) return;
                  setLoadingAi(true);
                  setIsAiMinimized(false);
                  const result = await api.getWeeklyAnalysis(weeklyData, goals);
                  setAiRecommendation(result || "Hubo un error al generar tu recomendación. Intenta de nuevo.");
                  if (result) {
                    addAnalysisDate();
                    if (user?.id) {
                      await api.saveAiConsultation(user.id, result);
                      await loadAiHistory();
                    }
                  }
                  setLoadingAi(false);
                }}
                disabled={loadingAi || weeklyData.length === 0 || analysisCount >= maxAnalysisPerWeek}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-primary-500/20 flex flex-col justify-center items-center gap-1"
              >
                <div className="flex items-center gap-2">
                  {loadingAi && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{loadingAi ? 'Analizando tu semana...' : '¿Cómo va mi alimentación?'}</span>
                </div>
                {analysisCount >= maxAnalysisPerWeek ? (
                  <span className="text-[10px] text-white/70 font-normal">Límite semanal alcanzado ({maxAnalysisPerWeek}/{maxAnalysisPerWeek})</span>
                ) : (
                  <span className="text-[10px] text-white/70 font-normal">Quedan {maxAnalysisPerWeek - analysisCount} análisis esta semana</span>
                )}
              </button>
            )}

            {showHistory && (
              <div className="mt-6 pt-6 border-t border-zinc-800/50">
                <h4 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-zinc-400" /> Historial de consultas
                </h4>
                {aiHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800/50">
                    No tenés consultas guardadas aún.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {aiHistory.map((item) => (
                      <div key={item.id} className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40 hover:border-zinc-700/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-zinc-500">
                            {new Date(item.created_at).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">{item.consultation_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-zinc-100 flex items-center gap-2">Calorías Semanales <Calendar className="w-4 h-4 text-primary-500" /></h3>
              <p className="text-xs text-zinc-400">Últimos 7 días</p>
            </div>
            <button onClick={() => setExpandedChart('calories')} className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-zinc-400 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', color: '#f4f4f5' }} />
                <ReferenceLine y={goals.target_calories} stroke="#ef4444" strokeDasharray="5 5" />
                <Bar dataKey="calories" fill="url(#colorCalories)" radius={[6, 6, 0, 0]} barSize={28} />
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
            <button onClick={() => setExpandedChart('protein')} className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-zinc-400 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', color: '#f4f4f5' }} />
                <ReferenceLine y={goals.target_protein} stroke="#3b82f6" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProtein)" activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expanded Chart Modal */}
        {expandedChart && createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-950">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {expandedChart === 'calories' ? 'Calorías Semanales' : 'Tendencia de Proteínas'}
                </h2>
                <p className="text-sm text-zinc-400">Vista Expandida</p>
              </div>
              <button onClick={() => setExpandedChart(null)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 w-full p-6 pt-12 flex items-center justify-center">
              <div className="w-full h-full max-h-[60vh]">
                <ResponsiveContainer width="100%" height="100%">
                  {expandedChart === 'calories' ? (
                    <BarChart data={weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorCaloriesExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                      <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ borderRadius: '16px', border: '1px solid #27272a', backgroundColor: '#18181b', color: '#f4f4f5', padding: '12px' }} />
                      <ReferenceLine y={goals.target_calories} stroke="#ef4444" strokeDasharray="5 5" />
                      <Bar dataKey="calories" fill="url(#colorCaloriesExp)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  ) : (
                    <AreaChart data={weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorProteinExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #27272a', backgroundColor: '#18181b', color: '#f4f4f5', padding: '12px' }} />
                      <ReferenceLine y={goals.target_protein} stroke="#3b82f6" strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorProteinExp)" activeDot={{ r: 8 }} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>,
          document.body
        )}

      </main>
    </MobileLayout>
  );
};
