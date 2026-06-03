import React from 'react';
import { Home, History, BookA, Download, LogOut, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-[#F9FAFB] flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-slate-900">
          <BookA className="w-6 h-6 text-black" />
          VoiceType
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <a href="#" className="flex items-center gap-3 px-3 py-2 bg-slate-200/50 text-black font-medium rounded-lg">
          <Home className="w-5 h-5 text-slate-600" />
          Inicio
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors">
          <History className="w-5 h-5" />
          Historial
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors">
          <BookA className="w-5 h-5" />
          Diccionario
        </a>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-slate-100">
          <Download className="w-6 h-6 mx-auto text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">Descargar la app</h3>
        </div>
      </div>
    </aside>
  );
}
