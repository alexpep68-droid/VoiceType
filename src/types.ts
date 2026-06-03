export interface Dictation {
  id: string;
  rawText: string;
  polishedText: string;
  timestamp: number;
  wordCount: number;
  timeSavedMs: number; 
}
