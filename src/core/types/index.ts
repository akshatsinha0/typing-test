export interface Theme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  caret: string;
  accent: string;
  error: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  fontFamily: string;
}

export type TestMode = 'time' | 'words' | 'quote' | 'zen';

export interface TestConfig {
  mode: TestMode;
  duration: number;        // in seconds for time mode
  wordCount: number;       // for word mode
  language: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  punctuation: boolean;
  numbers: boolean;
  caseSensitive: boolean;
}

export interface TestResult {
  id: string;
  date: Date;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  duration: number;
  mode: TestMode;
  language: string;
  errorMap: Record<string, number>;
  keystrokes: KeystrokeData[];
}

export interface KeystrokeData {
  key: string;
  timestamp: number;
  correct: boolean;
  duration?: number;
}

export interface User {
  id: string;
  username: string;
  preferences: UserPreferences;
  statistics: {
    averageWpm: number;
    bestWpm: number;
    testsCompleted: number;
    totalTimePracticed: number;  // in seconds
  };
}

export interface UserPreferences {
  theme: string;
  fontFamily: string;
  fontSize: number;
  caretStyle: 'block' | 'underline' | 'outline';
  soundFeedback: boolean;
  blindMode: boolean;
  smoothCaret: boolean;
}
