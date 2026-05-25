import React from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceFABProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const VoiceFAB: React.FC<VoiceFABProps> = ({ isListening, onStart, onStop }) => {
  return (
    <button
      onClick={isListening ? onStop : onStart}
      className={`absolute bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse'
          : 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-400'
      }`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? (
        <Square className="w-8 h-8 text-white fill-current" />
      ) : (
        <Mic className="w-8 h-8 text-white" />
      )}
    </button>
  );
};
