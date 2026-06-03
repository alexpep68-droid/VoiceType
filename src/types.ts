export interface Dictation {
  id: string;
  rawText: string;
  polishedText: string;
  timestamp: number;
  wordCount: number;
}

export type Tone = 'natural' | 'profesional' | 'casual' | 'ventas' | 'whatsapp' | 'correo_formal';

export interface DictionaryItem {
  id: string;
  word: string;
  replacement: string;
}

