import React from 'react';
import type { Tone } from '../types';
import { Filter } from 'lucide-react';

interface Props {
  activeTone: Tone;
  onToneChange: (tone: Tone) => void;
}

export function ToneSelector({ activeTone, onToneChange }: Props) {
  const tones: { id: Tone; label: string; desc: string }[] = [
    { id: 'natural', label: 'Natural', desc: 'Como hablas, pero sin muletillas.' },
    { id: 'profesional', label: 'Profesional', desc: 'Serio y directo, ideal para documentos.' },
    { id: 'casual', label: 'Casual', desc: 'Relajado, para equipo o notas.' },
    { id: 'ventas', label: 'Ventas', desc: 'Persuasivo y entusiasta.' },
    { id: 'whatsapp', label: 'WhatsApp', desc: 'Corto, con emojis y directo.' },
    { id: 'correo_formal', label: 'Correo Formal', desc: 'Estructurado y cortés.' }
  ];

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-medium text-slate-700">Tono del Mensaje</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tones.map(t => (
          <button
            key={t.id}
            onClick={() => onToneChange(t.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
              activeTone === t.id 
              ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
            title={t.desc}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
