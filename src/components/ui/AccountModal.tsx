import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User as UserIcon, Mail, Lock, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface AccountModalProps {
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};

  const [displayName, setDisplayName] = useState(meta.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setErrorMsg('');
    
    // 1. Guardar metadatos estáticos en Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (authError) {
      setErrorMsg("Error al actualizar nombre: " + authError.message);
      setSaving(false);
      return;
    }

    // 2. Actualizar Email si cambió
    if (email !== user.email && email.trim() !== '') {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setErrorMsg("Error al cambiar email: " + emailError.message);
        setSaving(false);
        return;
      }
    }

    // 3. Actualizar Password si ingresó algo
    if (password.trim() !== '') {
      const { error: pwdError } = await supabase.auth.updateUser({ password });
      if (pwdError) {
        setErrorMsg("Error al cambiar contraseña: " + pwdError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      onClose();
      if (email !== user.email) {
         alert("Revisa tu correo para confirmar el cambio de dirección.");
      }
      window.location.reload(); 
    }, 1500);
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
            <h2 className="text-xl font-bold text-white">Mi Cuenta</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="overflow-y-auto flex-1 hide-scrollbar p-6 space-y-6">
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-400">¿Cómo te llamamos?</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="w-5 h-5 text-zinc-500" />
              </div>
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-5 py-4 text-lg font-medium text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                placeholder="Tu nombre..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-400">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-zinc-500" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-5 py-4 text-lg font-medium text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                placeholder="tu@email.com"
              />
            </div>
            <p className="text-xs text-zinc-500">Si cambias el correo, te enviaremos un link de confirmación a ambas direcciones.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-400">Nueva Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-zinc-500" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-5 py-4 text-lg font-medium text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                placeholder="Dejar en blanco para no cambiar..."
              />
            </div>
          </div>

        </div>

        {/* Footer Fixed */}
        <div className="p-6 border-t border-zinc-800/50 bg-zinc-950">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
          >
            {saving ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-6 h-6" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </div>
      </div>
    </div>
  , document.body);
};
