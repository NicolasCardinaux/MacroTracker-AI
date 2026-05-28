import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const TermsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
          <h2 className="text-xl font-bold text-white">Términos y Condiciones</h2>
          <p className="text-sm text-zinc-400">Última actualización: Mayo 2026</p>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto space-y-6 text-zinc-300 text-sm leading-relaxed pb-20">
          <section>
            <h3 className="text-lg font-bold text-white mb-3">1. Aceptación de los Términos</h3>
            <p>Al acceder, registrarte o utilizar la aplicación MacroTracker AI (en adelante, "la Aplicación"), aceptas estar legalmente sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de los términos, te rogamos que no utilices la Aplicación.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">2. Descripción del Servicio</h3>
            <p>MacroTracker AI es una herramienta de registro y cálculo orientativo de calorías y macronutrientes. Utiliza Inteligencia Artificial y bases de datos públicas o colectivas para estimar los valores nutricionales de los alimentos reportados por el usuario mediante texto, voz o lectura de códigos de barras.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">3. Descargo de Responsabilidad Médica y de Salud</h3>
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-red-200">
              <h4 className="font-bold text-red-100 mb-2">ADVERTENCIA IMPORTANTE</h4>
              <p className="mb-2"><strong>La Aplicación no provee asesoramiento médico ni nutricional profesional.</strong></p>
              <p className="mb-2">Toda la información contenida en la Aplicación, incluyendo textos, gráficos, imágenes, recomendaciones del "Consultor IA" y estimaciones calóricas, tiene un propósito puramente informativo y educativo. Los datos pueden contener imprecisiones, alucinaciones inherentes a los modelos de lenguaje (IA) o márgenes de error.</p>
              <p>MacroTracker AI no se responsabiliza por las decisiones relacionadas con la salud, dieta, manejo de enfermedades o peso que el usuario tome basándose en la información proporcionada. Recomendamos enfáticamente consultar a un médico, dietista matriculado o profesional de la salud antes de comenzar cualquier dieta o programa alimentario.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">4. Exactitud de la Información</h3>
            <p>Si bien nos esforzamos por ofrecer datos precisos utilizando inteligencia artificial avanzada y la base de datos Open Food Facts, <strong>no garantizamos la exactitud, exhaustividad o fiabilidad</strong> de los valores nutricionales mostrados. El usuario reconoce que las estimaciones de porciones y calorías pueden variar significativamente de la realidad.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">5. Uso Aceptable y Cuenta de Usuario</h3>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Te comprometes a no utilizar la Aplicación para fines ilícitos o no autorizados.</li>
              <li>Si contribuyes a la base de datos global (por ejemplo, subiendo una tabla nutricional), declaras que la información ingresada es de buena fe y corresponde al producto real.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">6. Modificaciones al Servicio</h3>
            <p>Nos reservamos el derecho de modificar, suspender o discontinuar la Aplicación (o cualquier parte o contenido de la misma) en cualquier momento, sin previo aviso. No seremos responsables ante ti ni ante terceros por ninguna modificación, cambio de precio, suspensión o interrupción del servicio.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3">7. Limitación de Responsabilidad</h3>
            <p>En la medida máxima permitida por la ley aplicable, en ningún caso MacroTracker AI, sus creadores, desarrolladores o afiliados serán responsables por daños directos, indirectos, incidentales, punitivos o consecuenciales (incluyendo pérdida de datos o problemas de salud) derivados del uso o la incapacidad de usar el servicio.</p>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};
