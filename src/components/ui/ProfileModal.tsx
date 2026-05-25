import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User as UserIcon, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || 'Nicolás');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Bloquear scroll del body
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Hard refresh to show new name immediately across all context
      }, 1000);
    } else {
      alert("Error al actualizar el nombre");
    }
  };

  const currentDate = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Invisible backdrop to close when clicking outside */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Popover Menu / Modal Centrado */}
      <div className="relative bg-zinc-900/95 backdrop-blur-xl w-[320px] rounded-[32px] p-6 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden m-auto">
        <div className="overflow-y-auto flex-1 hide-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/20 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
            <UserIcon className="w-8 h-8 text-primary-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
          </div>
          <h3 className="text-xl font-bold text-white">Tu Perfil</h3>
          <p className="text-sm text-zinc-400 font-medium">{user?.email}</p>
          <p className="text-xs text-zinc-500 mt-1 font-bold tracking-wider">FECHA: {currentDate}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2 ml-1">Nombre para Mostrar</label>
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-lg font-medium text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
              placeholder="¿Cómo te llamamos?"
            />
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving || !displayName || saved}
            className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${
              saved 
                ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
            } disabled:opacity-50`}
          >
            {saved ? (
              <><Check className="w-5 h-5" /> Guardado</>
            ) : saving ? (
              'Guardando...'
            ) : (
              'Actualizar Perfil'
            )}
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
