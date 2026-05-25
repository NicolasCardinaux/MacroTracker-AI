import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';



export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isListeningRef = useRef(false);
  
  // Guardamos el texto base antes de iniciar una sesión de grabación
  const baseTranscriptRef = useRef('');
  
  // Variables para la grabación Web con Gemini
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
          const newText = (baseTranscriptRef.current + ' ' + data.matches[0]).trim();
          setTranscript(newText);
        }
      }).then(handle => {
        listenerHandle = handle;
      });

      return () => {
        if (listenerHandle) listenerHandle.remove();
      };
    }

    // WEB: Limpieza si se desmonta
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    // Evitar iniciar si ya estamos escuchando
    if (isListeningRef.current) return;

    setError(null);
    isListeningRef.current = true;
    setIsListening(true);
    
    // Guardar el texto actual como base usando el estado más reciente
    setTranscript(prev => {
      baseTranscriptRef.current = prev.trim();
      return prev;
    });

    if (Capacitor.isNativePlatform()) {
      try {
        const { available } = await SpeechRecognition.available();
        if (!available) {
          setError("El reconocimiento de voz no está disponible en este dispositivo.");
          setIsListening(false);
          isListeningRef.current = false;
          return;
        }

        // await SpeechRecognition.start() ya se llama más abajo

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
      // WEB (Grabar audio puro y usar Gemini)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error("Failed to start MediaRecorder", err);
        setError("Error al acceder al micrófono de tu PC.");
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  }, []);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (Capacitor.isNativePlatform()) {
      try {
        await SpeechRecognition.stop();
        setTranscript(prev => {
          baseTranscriptRef.current = prev.trim();
          return prev;
        });
      } catch (err) {
        console.error("Failed to stop Native recognition", err);
      }
    } else {
      // WEB (Detener grabación y enviar a la IA)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          
          setTranscript(prev => (prev + " (Procesando audio...)").trim());
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const [header, data] = base64data.split(',');
            const mimeType = header.split(':')[1].split(';')[0];
            
            try {
              const { api } = await import('../services/api');
              const text = await api.transcribeAudioWithGemini(data, mimeType);
              
              const newText = (baseTranscriptRef.current + ' ' + text).trim();
              setTranscript(newText);
              baseTranscriptRef.current = newText;
            } catch (e) {
               console.error("Error AI transcription:", e);
               setError('Fallo al transcribir por IA.');
               setTranscript(baseTranscriptRef.current);
            }
          };
        };
        
        mediaRecorderRef.current.stop();
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    baseTranscriptRef.current = '';
    setTranscript('');
  }, []);

  // Para permitir edición manual bidireccional desde el componente padre
  const manuallySetTranscript = useCallback((text: string) => {
    baseTranscriptRef.current = text;
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
