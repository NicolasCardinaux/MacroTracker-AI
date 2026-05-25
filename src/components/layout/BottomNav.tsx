import React from 'react';
import { Home, BarChart2, Scale, Settings, CalendarDays } from 'lucide-react';

interface BottomNavProps {
  currentView: 'dashboard' | 'analytics' | 'settings' | 'avances' | 'historial';
  onChangeView: (view: 'dashboard' | 'analytics' | 'settings' | 'avances' | 'historial') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Inicio' },
    { id: 'analytics', icon: BarChart2, label: 'Analíticas' },
    { id: 'avances', icon: Scale, label: 'Avances' },
    { id: 'historial', icon: CalendarDays, label: 'Historial' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center z-50">
      <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 px-6 py-3 pb-safe">
        <div className="flex justify-between items-center">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeView(tab.id as any)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? 'text-primary-500 scale-110' : 'text-zinc-500 hover:text-zinc-400 scale-100'
                }`}
              >
                <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-primary-500/10' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-primary-500/20' : ''}`} />
                </div>
                <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
