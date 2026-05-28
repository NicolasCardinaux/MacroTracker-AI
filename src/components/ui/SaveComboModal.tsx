import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, BookmarkPlus, Loader2 } from 'lucide-react';
import type { FoodLog } from '../../types';

interface SaveComboModalProps {
  logs: FoodLog[];
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export const SaveComboModal: React.FC<SaveComboModalProps> = ({ logs, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(name.trim());
      onClose();
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-300"
      >
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
              <BookmarkPlus className="w-5 h-5 text-primary-500" />
            </div>
            <h3 className="font-bold text-xl text-zinc-100">Guardar Combo</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Vas a guardar un combo con <strong className="text-zinc-200">{logs.length} alimentos</strong>. Podrás cargarlo rápidamente en el futuro.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Nombre del Combo
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ej: Desayuno Volumen..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-zinc-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium placeholder:text-zinc-700"
              />
            </div>
            
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 max-h-[150px] overflow-y-auto">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Alimentos Incluidos</h4>
              <ul className="space-y-2">
                {logs.map(log => (
                  <li key={log.id} className="text-sm text-zinc-300 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500/50" />
                    <span className="truncate">{log.raw_input}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Combo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
