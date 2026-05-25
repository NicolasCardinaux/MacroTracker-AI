import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

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
  const lastProcessedRef = useRef('');

  useEffect(() => {
    // Si estamos en un dispositivo nativo (Android/iOS), preparamos el plugin de Capacitor
    let listenerHandle: any = null;

    if (Capacitor.isNativePlatform()) {
      SpeechRecognition.requestPermissions().then(result => {
        if (result.speechRecognition !== 'granted') {
          setError('Permiso de micrófono denegado en la app.');
        }
      });

      // Registrar el listener una sola vez
      SpeechRecognition.addListener('partialResults', (data: any) => {
        if (data.matches && data.matches.length > 0) {
          // El plugin devuelve la frase entera que está escuchando en matches[0]
          setTranscript(finalTranscriptRef.current + ' ' + data.matches[0]);
        }
      }).then(handle => {
        listenerHandle = handle;
      });

      return () => {
        if (listenerHandle) listenerHandle.remove();
      };
    }

    // --- LÓGICA WEB ORIGINAL (Solo se ejecuta en el navegador de la PC) ---
    const WebSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (WebSpeechRecognition && !recognitionRef.current) {
      const rec = new WebSpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; 
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
          const text = result[0].transcript;
          if (result.isFinal) {
            if (text.trim() !== lastProcessedRef.current.trim()) {
              newFinalTranscript += text + ' ';
              lastProcessedRef.current = text;
            }
          } else {
            interimTranscript += text;
          }
        }

        if (newFinalTranscript) {
          finalTranscriptRef.current += newFinalTranscript;
        }

        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No se detectó audio.');
        } else if (event.error === 'network') {
          setError('Error de red. (Si estás en Brave o Chromium en PC, la voz no funciona ahí).');
          isListeningRef.current = false;
          setIsListening(false);
        } else if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado.');
          isListeningRef.current = false;
          setIsListening(false);
        } else {
          setError('Error al reconocer voz.');
        }
      };

      rec.onend = () => {
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
    } else if (!WebSpeechRecognition) {
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

  const startListening = useCallback(async () => {
    // Evitar iniciar si ya estamos escuchando
    if (isListeningRef.current) return;

    setError(null);
    isListeningRef.current = true;
    setIsListening(true);

    if (Capacitor.isNativePlatform()) {
      try {
        const { available } = await SpeechRecognition.available();
        if (!available) {
          setError("El reconocimiento de voz no está disponible en este dispositivo.");
          setIsListening(false);
          isListeningRef.current = false;
          return;
        }

        // Si ya había texto, lo guardamos como final
        if (transcript.trim()) {
          finalTranscriptRef.current = transcript.trim();
        }

        await SpeechRecognition.start({
          language: 'es-AR',
          maxResults: 1,
          prompt: 'Te escucho...',
          partialResults: true,
          popup: false, // Fundamental: false para que no bloquee tu UI
        });

      } catch (err) {
        console.error("Native Speech Error:", err);
        setError("Error al iniciar el micrófono.");
        setIsListening(false);
        isListeningRef.current = false;
      }
    } else {
      // WEB
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Failed to start Web recognition", err);
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    }
  }, []);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (Capacitor.isNativePlatform()) {
      try {
        await SpeechRecognition.stop();
        // Guardamos lo que haya quedado
        finalTranscriptRef.current = transcript.trim();
      } catch (err) {
        console.error("Failed to stop Native recognition", err);
      }
    } else {
      // WEB
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Failed to stop Web recognition", err);
        }
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  // Para permitir edición manual bidireccional desde el componente padre
  const manuallySetTranscript = useCallback((text: string) => {
    finalTranscriptRef.current = text;
    lastProcessedRef.current = '';
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
