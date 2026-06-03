import React, { useState, useEffect } from 'react';
import { Sidebar, Tab } from './components/Sidebar';
import { ToneSelector } from './components/ToneSelector';
import { useSpeechRecognition } from './useSpeechRecognition';
import { Mic, ArrowRight, Loader2, Copy, CheckCircle2, ChevronDown, Check, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Dictation, Tone, DictionaryItem } from './types';

export default function App() {
  const { isListening, transcript, isSupported, errorMsg, startListening, stopListening } = useSpeechRecognition();
  
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeTone, setActiveTone] = useState<Tone>('natural');
  const [dictionary, setDictionary] = useState<DictionaryItem[]>([]);
  const [history, setHistory] = useState<Dictation[]>([]);

  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedResult, setPolishedResult] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [apiError, setApiError] = useState<string>('');

  const [stats, setStats] = useState({
    wpm: 0,
    wordsDictated: 0,
    timeSavedMinutes: 0
  });

  useEffect(() => {
    // Load persisted state
    try {
      const hist = localStorage.getItem('vt_history');
      if (hist) setHistory(JSON.parse(hist));
      const dict = localStorage.getItem('vt_dict');
      if (dict) setDictionary(JSON.parse(dict));
      const tone = localStorage.getItem('vt_tone');
      if (tone) setActiveTone(tone as Tone);
    } catch(e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('vt_tone', activeTone);
  }, [activeTone]);

  useEffect(() => {
    localStorage.setItem('vt_history', JSON.stringify(history));
  }, [history]);

  // Calculate some mock stats based on transcript
  useEffect(() => {
    if (transcript) {
      const words = transcript.split(' ').filter(Boolean).length;
      setStats(s => ({ ...s, wordsDictated: words, wpm: isListening ? 150 : 0 }));
    }
  }, [transcript, isListening]);

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert("La aplicación ya está instalada o tu navegador no soporta esta función. Puedes instalarla manualmente desde el menú del navegador.");
    }
  };

  const handleMicToggle = async () => {
    setApiError('');
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        await polishText(transcript);
      }
    } else {
      setPolishedResult('');
      startListening();
    }
  };

  const polishText = async (text: string, commandOverride?: string) => {
    setIsPolishing(true);
    setApiError('');
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text, 
          tone: activeTone, 
          dictionary,
          command: commandOverride
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con la IA');
      }

      if (data.polished) {
        setPolishedResult(data.polished);
        setStats(s => ({ ...s, timeSavedMinutes: s.timeSavedMinutes + 1 }));
        
        // Save to history
        const newDoc: Dictation = {
          id: Date.now().toString(),
          rawText: text,
          polishedText: data.polished,
          timestamp: Date.now(),
          wordCount: data.polished.split(' ').length
        };
        setHistory(prev => [newDoc, ...prev]);

        // Auto copy behavior
        navigator.clipboard.writeText(data.polished);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      }
    } catch (error: any) {
      console.error("Error polishing:", error);
      setApiError(error.message || 'Error desconocido');
    } finally {
      setIsPolishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 4000);
    }
  };

  const renderContent = () => {
    if (activeTab === 'download') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 font-display mb-4">Apps Nativas (Próximamente)</h2>
          <p className="text-slate-600 mb-8 max-w-2xl leading-relaxed">
            La versión web gratuita de VoiceType cuenta con <span className="font-semibold text-slate-800">Copiado Automático</span> (solo presiona Ctrl+V tras dictar).
            Para obtener  inyección automática directa sin usar el teclado en tus apps (Word, Chrome, WhatsApp), 
            estamos preparando las arquitecturas nativas.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden">
               <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                 🖥️ Escritorio (Mac & Windows)
               </h3>
               <ul className="space-y-3 text-sm text-slate-600 mb-6">
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                   <span>Aplicación ligera basada en <strong>Electron</strong>.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                   <span><strong>Atajo de teclado global</strong> (ej. Cmd+E o Alt+Space) para dictar en cualquier momento.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                   <span>Inyección de texto simulando pegado del sistema con <strong>permisos de Accesibilidad</strong>.</span>
                 </li>
               </ul>
               <button disabled className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-lg font-medium cursor-not-allowed">
                 Arquitectura en desarrollo
               </button>
            </div>

            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden">
               <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                 📱 Android (Móvil)
               </h3>
               <ul className="space-y-3 text-sm text-slate-600 mb-6">
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                   <span>App nativa usando <strong>Accessibility Services</strong> nativos de Android.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                   <span>Detecta automáticamente qué campo de texto está activo y pega ahí mismo el texto corregido.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                   <span>Integración opcional como teclado (IME) de Android.</span>
                 </li>
               </ul>
               <button disabled className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-lg font-medium cursor-not-allowed">
                 Arquitectura en desarrollo
               </button>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
               <h4 className="font-semibold text-slate-800">Usar Modo PWA (Web)</h4>
               <p className="text-sm text-slate-500">Usa VoiceType ahora mismo como aplicación web instalable.</p>
            </div>
            <button 
              onClick={handleInstallClick} 
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
            >
              Instalar Web App (PWA)
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'home') {
      return (
        <>
          <div className="mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Configuración Rápida</h2>
            <ToneSelector activeTone={activeTone} onToneChange={setActiveTone} />
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 cursor-pointer group">
                <span className="text-sm font-medium text-slate-700">Dictado Activo</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide">(Se copiará automáticamente al portapapeles)</p>
            </div>

            <div className="p-8 flex-1 flex flex-col relative">
              {errorMsg && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center justify-between">
                  <span>{errorMsg}</span>
                </div>
              )}
              {apiError && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center justify-between">
                  <span>{apiError}</span>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {transcript && !polishedResult && !isPolishing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-8"
                  >
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">Transcripción (en vivo)</h4>
                    <p className="text-lg text-slate-500 leading-relaxed font-light">
                      {transcript}
                    </p>
                  </motion.div>
                )}

                {isPolishing && (
                   <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center flex-1 py-12"
                   >
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-slate-500 font-medium">Pulido mágico en progreso...</p>
                   </motion.div>
                )}

                {polishedResult && !isPolishing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <h4 className="text-xs font-bold text-blue-500 tracking-wider uppercase mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 
                      Resultado Final (Copiado ✔)
                    </h4>
                    <div className="p-6 bg-[#F6F8FA] rounded-xl border border-slate-200 relative group mb-4">
                      <p className="text-xl text-slate-900 leading-relaxed selection:bg-blue-100">
                        {polishedResult}
                      </p>
                      <button 
                        onClick={() => copyToClipboard(polishedResult)}
                        className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition opacity-0 group-hover:opacity-100"
                        title="Copiar al portapapeles"
                      >
                        {hasCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={() => polishText(transcript, "haz un resumen conciso de esto")} className="text-xs px-3 py-1.5 border border-slate-200 rounded-full font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                          <Wand2 className="w-3 h-3"/> Resumir
                       </button>
                       <button onClick={() => polishText(transcript, "traduce esto al inglés con tono nativo")} className="text-xs px-3 py-1.5 border border-slate-200 rounded-full font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                          <Wand2 className="w-3 h-3"/> Traducir a Inglés
                       </button>
                       <button onClick={() => polishText(transcript, "formatea esto como una lista de viñetas claras")} className="text-xs px-3 py-1.5 border border-slate-200 rounded-full font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                          <Wand2 className="w-3 h-3"/> Lista
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!transcript && !polishedResult && !isPolishing && (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-50 select-none">
                   <Mic className="w-12 h-12 text-slate-300 mb-4" />
                   <p className="text-lg text-slate-400 font-medium">Haz clic en el micrófono para empezar a dictar</p>
                   <p className="text-xs text-slate-400 mt-2">El texto se pulirá y copiará al instante.</p>
                 </div>
              )}
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center mt-8">
                <button
                  onClick={handleMicToggle}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_0_8px_rgba(239,68,68,0.2)] animate-pulse' 
                    : 'bg-slate-900 hover:bg-slate-800 shadow-md'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-sm ${isListening ? 'bg-white' : 'hidden'}`} />
                  <Mic className={`w-8 h-8 text-white ${isListening ? 'hidden' : 'block'}`} />
                </button>
              </div>
            </div>
          </section>
        </>
      );
    }
    
    if (activeTab === 'history') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Historial Reciente</h2>
          {history.length === 0 ? (
            <p className="text-slate-500">No hay dictados recientes.</p>
          ) : (
            <div className="space-y-4">
              {history.map(h => (
                <div key={h.id} className="p-4 rounded-xl bg-[#F9FAFB] border border-slate-100 group">
                  <p className="text-slate-800 mb-2">{h.polishedText}</p>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                    <button 
                      onClick={() => copyToClipboard(h.polishedText)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'dictionary') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
           <h2 className="text-xl font-bold text-slate-900 mb-2">Diccionario Inteligente</h2>
           <p className="text-sm text-slate-500 mb-6">Enseña a la IA el nombre de tu empresa, acrónimos o vocabulario técnico.</p>
           {/* Simple placeholder for dictionary UI */}
           <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-700 text-sm mb-4">
              Ejemplo: Si dices "el si are em", puedes hacer que se escriba "CRM" automáticamente.
           </div>
           
           <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition">
             + Añadir Entrada
           </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center py-20 text-center">
         <h2 className="text-xl font-bold text-slate-900 mb-2">Más Configuración Próximamente</h2>
         <p className="text-slate-500">Aquí podrás configurar atajos de teclado globales y conectores de API.</p>
      </div>
    );
  };

  if (!isSupported) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Browser Not Supported</h2>
          <p className="text-slate-600">Your browser does not support the Web Speech API. Please try Google Chrome or Microsoft Edge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onInstallAction={handleInstallClick} />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {hasCopied && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 ml-32 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full font-medium shadow-xl shadow-slate-900/10 flex items-center gap-3 border border-slate-800"
          >
            <div className="bg-green-500 rounded-full p-1">
              <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
            </div>
            ¡Texto listo! Ahora pégalo con Ctrl+V donde quieras
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 ml-64 p-8 pt-20">
        <header className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-2xl text-slate-800 font-display">
               Habla naturalmente, <span className="text-slate-800 font-bold">escribe perfectamente</span>
             </h1>
             <p className="text-slate-500 text-sm mt-1">El texto se copia automáticamente al soltar el micrófono.</p>
          </div>
          <button className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-full font-medium shadow-sm hover:bg-slate-50 transition">
            Instrucciones de Uso
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </header>

        {renderContent()}

      </main>
    </div>
  );
}
