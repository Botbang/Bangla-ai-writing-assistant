export interface Correction {
  incorrect: string;
  correct: string;
  explanation: string;
}

// FIX: Add FileInfo and ChatMessage interfaces for the file analyzer feature.
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  extractedStrings: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
