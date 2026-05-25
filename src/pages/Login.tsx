import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/ui/Logo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-zinc-950 ring-1 ring-zinc-800/50 rounded-2xl p-4 shadow-2xl">
            <Logo size="lg" showText={false} />
          </div>
        </div>
        
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 drop-shadow-sm">
          MacroTracker AI
        </h1>
        <p className="mt-3 text-center text-sm font-semibold text-primary-500 tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
          Evolución & Precisión Calórica
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both">
        <div className="bg-zinc-900/60 backdrop-blur-2xl py-10 px-6 sm:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] sm:rounded-[2rem] border border-zinc-800/60 relative overflow-hidden">
          
          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

          <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-center animate-in slide-in-from-top-2">
                <p className="text-sm font-medium text-red-400 text-center">{error}</p>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-400 ml-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative appearance-none block w-full px-5 py-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl shadow-inner text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm font-medium"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-400 ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative appearance-none block w-full px-5 py-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl shadow-inner text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm font-medium tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-primary-500/10 text-sm font-bold text-zinc-950 bg-primary-500 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando credenciales...' : 'Ingresar al Panel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
