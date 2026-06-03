import React from 'react';
import { Home, History, BookA, Download, LogOut, Settings } from 'lucide-react';

export type Tab = 'home' | 'history' | 'dictionary' | 'settings' | 'download';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onInstallAction?: () => void;
}

export function Sidebar({ activeTab, onTabChange, onInstallAction }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-[#F9FAFB] flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-slate-900">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2c0-1.1-.9-2-2-2-1.33 0-2.67-.5-4-1.5C6.67 9.5 6 8.35 6 7.11 6 4.9 7.9 3 10.11 3h3.78c2.21 0 4.11 1.9 4.11 4.11 0 1.24-.67 2.39-1.89 3.39 1.33 1 2.67 1.5 4 2.5 1.33 1 1.89 2.15 1.89 3.39 0 2.21-1.9 4.11-4.11 4.11H12v-2.5z" fill="currentColor"/>
          </svg>
          VoiceType
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <button 
          onClick={() => onTabChange('home')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'home' ? 'bg-slate-200/50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Home className="w-5 h-5 opacity-70" />
          Inicio
        </button>
        <button 
          onClick={() => onTabChange('history')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'history' ? 'bg-slate-200/50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <History className="w-5 h-5 opacity-70" />
          Historial
        </button>
        <button 
          onClick={() => onTabChange('dictionary')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dictionary' ? 'bg-slate-200/50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <BookA className="w-5 h-5 opacity-70" />
          Diccionario
        </button>
        <button 
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-200/50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Settings className="w-5 h-5 opacity-70" />
          Ajustes
        </button>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div 
          onClick={() => onTabChange('download')}
          className={`rounded-xl shadow-sm p-4 text-center border cursor-pointer hover:bg-slate-50 transition ${activeTab === 'download' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-100'}`}
        >
          <Download className="w-6 h-6 mx-auto text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Descargar App</h3>
          <p className="text-[10px] text-slate-500">Escritorio, Android y Web</p>
        </div>
      </div>
    </aside>
  );
}
