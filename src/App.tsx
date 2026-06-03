import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { useSpeechRecognition } from './useSpeechRecognition';
import { Mic, ArrowRight, Loader2, Copy, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Dictation } from './types';

export default function App() {
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition();
  
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedResult, setPolishedResult] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [stats, setStats] = useState({
    wpm: 0,
    wordsDictated: 0,
    timeSavedMinutes: 0
  });

  // Calculate some mock stats based on transcript
  useEffect(() => {
    if (transcript) {
      const words = transcript.split(' ').filter(Boolean).length;
      setStats(s => ({ ...s, wordsDictated: words, wpm: isListening ? 150 : 0 }));
    }
  }, [transcript, isListening]);

  const handleMicToggle = async () => {
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

  const polishText = async (text: string) => {
    setIsPolishing(true);
    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.polished) {
        setPolishedResult(data.polished);
        setStats(s => ({ ...s, timeSavedMinutes: s.timeSavedMinutes + 1 }));
      }
    } catch (error) {
      console.error("Error polishing:", error);
    } finally {
      setIsPolishing(false);
    }
  };

  const copyToClipboard = () => {
    if (polishedResult) {
      navigator.clipboard.writeText(polishedResult);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
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
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl text-slate-800 font-display">
            Habla naturalmente, escribe perfectamente <span className="text-slate-400">— en cualquier web</span>
          </h1>
          <button className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-full font-medium shadow-sm hover:bg-slate-50 transition">
            Casos de uso populares
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-1">
            <h3 className="text-sm font-medium text-slate-500 mb-4 flex justify-between items-center">
              Personalización general
              <span className="text-slate-400">0%</span>
            </h3>
            <div className="flex items-center justify-between">
              <button className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition">
                Ver informe
              </button>
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
               Tus datos permanecen privados.
            </p>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-slate-500 mb-1">Tiempo total de dictado</p>
              <p className="text-2xl font-bold text-slate-900 font-display">46 <span className="text-sm font-medium text-slate-500">min</span></p>
              
              <div className="mt-4 pt-4 border-t border-slate-50">
                 <p className="text-sm font-medium text-slate-500 mb-1">Tiempo ahorrado</p>
                 <p className="text-2xl font-bold text-slate-900 font-display">{stats.timeSavedMinutes} <span className="text-sm font-medium text-slate-500">min</span></p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-slate-500 mb-1">Palabras dictadas</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{stats.wordsDictated}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-50">
                 <p className="text-sm font-medium text-slate-500 mb-1">Velocidad promedio</p>
                 <p className="text-2xl font-bold text-slate-900 font-display">{stats.wpm} <span className="text-sm font-medium text-slate-500">PPM</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Area */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="text-sm font-medium text-slate-700">Última transcripción</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col relative">
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
                    Resultado Final (Editado y Pulido)
                  </h4>
                  <div className="p-6 bg-[#F6F8FA] rounded-xl border border-slate-200 relative group">
                    <p className="text-xl text-slate-900 leading-relaxed selection:bg-blue-100">
                      {polishedResult}
                    </p>
                    <button 
                      onClick={copyToClipboard}
                      className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition opacity-0 group-hover:opacity-100"
                      title="Copiar al portapapeles"
                    >
                      {hasCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!transcript && !polishedResult && !isPolishing && (
               <div className="flex-1 flex flex-col items-center justify-center opacity-50 select-none">
                 <Mic className="w-12 h-12 text-slate-300 mb-4" />
                 <p className="text-lg text-slate-400 font-medium">Haz clic en el micrófono para empezar a dictar</p>
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

      </main>
    </div>
  );
}
