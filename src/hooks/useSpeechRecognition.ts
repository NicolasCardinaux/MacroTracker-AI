import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: any;
  resultIndex: number;
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  
  // Guardamos el texto final confirmado de las frases anteriores
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; // Fundamental para real-time typing
      rec.lang = 'es-AR';

      rec.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let newFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            newFinalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (newFinalTranscript) {
          finalTranscriptRef.current += newFinalTranscript;
        }

        // El texto visible es lo final consolidado + lo que se está diciendo ahora
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No se detectó audio. Habla un poco más cerca del micrófono.');
        } else if (event.error === 'network') {
          setError('Error de conexión. Verifica tu internet.');
          isListeningRef.current = false;
          setIsListening(false);
        } else if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado.');
          isListeningRef.current = false;
          setIsListening(false);
        } else {
          setError('No pudimos entenderte, intenta nuevamente.');
        }
      };

      rec.onend = () => {
        // Si el usuario NO clickeó explícitamente "detener", significa que el navegador
        // lo cortó por inactividad. Lo reiniciamos para mantener el micrófono abierto.
        if (isListeningRef.current) {
          try {
            rec.start();
          } catch (e) {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
    } else if (!SpeechRecognition) {
      setError('Tu navegador no soporta reconocimiento de voz nativo.');
    }

    return () => {
      if (recognitionRef.current) {
        isListeningRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      setError(null);
      isListeningRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start recognition", err);
        isListeningRef.current = false;
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Failed to stop recognition", err);
      }
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  // Para permitir edición manual bidireccional desde el componente padre
  const manuallySetTranscript = useCallback((text: string) => {
    finalTranscriptRef.current = text;
    setTranscript(text);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    manuallySetTranscript
  };
};
