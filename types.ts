export interface TranscriptLine {
  timestamp: Date;
  speaker: string;
  text: string;
}

export interface SummaryData {
  summary: string[];
  key_terms: string[];
  action_items: string[];
}

export interface ToneAnalysisData {
  tone: string;
  context: string;
  mood: string;
}

export enum AnalysisTab {
  Analysis = 'Analysis',
  QA = 'Q&A',
  VoiceQA = 'Voice Q&A',
  TextToSpeech = 'Text to Speech',
  ContextTone = 'Context & Tone',
}