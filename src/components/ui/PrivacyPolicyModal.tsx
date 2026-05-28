import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const PrivacyPolicyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md sticky top-0">
        <div>
          <h2 className="text-xl font-bold text-white">Política de Privacidad</h2>
          <p className="text-sm text-zinc-400">Última actualización: Mayo 2026</p>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto space-y-6 text-zinc-300 text-sm leading-relaxed pb-20">
          <section>
            <h3 className="text-lg font-bold text-white mb-3">1. Introducción</h3>
            <p>Bienvenido a MacroTracker AI. Nos tomamos muy en serio tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información cuando utilizas nuestra aplicación móvil y servicios web. Al registrarte o utilizar nuestros servicios, aceptas las prácticas descritas en esta política.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">2. Información que Recopilamos</h3>
            <p className="mb-2">Recopilamos información para proporcionar, analizar y mejorar nuestros servicios:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-300">Información de Cuenta:</strong> Dirección de correo electrónico y credenciales de acceso.</li>
              <li><strong className="text-zinc-300">Datos Físicos y de Salud:</strong> Peso, porcentaje de grasa corporal, edad, altura, sexo biológico (si decides proporcionarlo), nivel de actividad física y objetivos calóricos.</li>
              <li><strong className="text-zinc-300">Registros Nutricionales:</strong> Alimentos consumidos, fotos de tablas nutricionales enviadas para análisis, consultas hechas al "Consultor IA" y descripciones en texto/audio de tus comidas.</li>
              <li><strong className="text-zinc-300">Datos de Uso del Dispositivo:</strong> Información técnica como permisos de cámara y micrófono (cuando los otorgas explícitamente), uso de almacenamiento local para caché y logs de errores para mejorar el servicio.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">3. Cómo Usamos tu Información</h3>
            <p className="mb-2">Tus datos se utilizan de las siguientes maneras:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Para crear y mantener tu cuenta de usuario segura.</li>
              <li>Para calcular de forma estimada tus requerimientos calóricos y de macronutrientes.</li>
              <li>Para procesar tus entradas de voz y texto mediante Inteligencia Artificial (Gemini API) y convertirlas en datos nutricionales.</li>
              <li>Para aportar a la base de datos "Global": Si escaneas un producto nuevo con código de barras y proporcionas su tabla nutricional, esta información general (sin asociar a tu identidad) pasa a ser pública para la comunidad de MacroTracker AI.</li>
              <li>Para brindarte recomendaciones automatizadas genéricas sobre tu progreso alimenticio.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">4. Procesamiento mediante Inteligencia Artificial de Terceros</h3>
            <p>MacroTracker AI utiliza servicios de Inteligencia Artificial proporcionados por terceros (como Google Gemini, Groq, o similares) para el reconocimiento de voz, procesamiento de texto e interpretación de imágenes de tablas nutricionales. 
            Al utilizar las funciones de dictado por voz, escaneo o consultas IA, aceptas que fragmentos de texto, audio e imágenes sean enviados a estos proveedores externos temporalmente para su procesamiento. Exigimos a estos proveedores el cumplimiento de normativas de privacidad estrictas y no utilizamos tus datos de salud para entrenar modelos públicos.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">5. Exención de Responsabilidad Médica (IMPORTANTE)</h3>
            <div className="bg-primary-900/20 border border-primary-500/30 p-4 rounded-xl text-primary-200">
              <p>La información, cálculos y análisis proporcionados por MacroTracker AI, incluyendo los del "Consultor IA", se generan mediante algoritmos estadísticos e Inteligencia Artificial.</p>
              <p className="mt-2 font-bold text-white">Nosotros NO SOMOS médicos, nutricionistas, dietistas registrados ni profesionales de la salud.</p>
              <p className="mt-2">Esta aplicación tiene un propósito estrictamente orientativo y de entretenimiento personal. Nunca debe ser utilizada como sustituto del diagnóstico, tratamiento o consejo médico profesional. Siempre debes consultar a tu médico o a un profesional de la salud calificado antes de iniciar cualquier dieta, cambio en tu nutrición o programa de ejercicios.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">6. Almacenamiento y Seguridad de Datos</h3>
            <p>Los datos son almacenados en infraestructura segura en la nube (Supabase). Implementamos medidas de seguridad técnicas (como encriptación SSL/TLS, políticas de seguridad a nivel de filas o RLS, y control de acceso) diseñadas para salvaguardar tu información. Sin embargo, ningún método de transmisión por Internet es 100% seguro y no podemos garantizar la seguridad absoluta.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">7. Tus Derechos</h3>
            <p>Tienes derecho a acceder a los datos que almacenamos sobre ti, rectificarlos si son inexactos y solicitar su eliminación. Puedes eliminar tus registros diarios desde la aplicación. Para eliminar tu cuenta de forma permanente, por favor contáctanos.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">8. Contacto</h3>
            <p>Si tienes alguna pregunta sobre esta Política de Privacidad o el tratamiento de tus datos, puedes contactarnos en soporte@macrotracker-ai.com.</p>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};
