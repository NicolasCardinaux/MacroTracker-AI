import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Avances } from './pages/Avances';
import { Historial } from './pages/Historial';
import { BottomNav } from './components/layout/BottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'settings' | 'avances' | 'historial'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'analytics': return <Analytics onBack={() => setCurrentView('dashboard')} />;
      case 'settings': return <Settings onBack={() => setCurrentView('dashboard')} />;
      case 'avances': return <Avances onBack={() => setCurrentView('dashboard')} />;
      case 'historial': return <Historial onBack={() => setCurrentView('dashboard')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      {renderView()}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
