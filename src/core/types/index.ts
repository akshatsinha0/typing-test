// src/core/types/index.ts

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
  gradient?: string;
}

export type TestMode = 'time' | 'words' | 'quote' | 'zen' | 'code';
export type ComplexityLevel = 'easy' | 'medium' | 'hard';

export interface TestConfig {
  mode: TestMode;
  timePreset: number;
  wordPreset: number;
  language: string;
  textComplexity: ComplexityLevel;
  punctuation: boolean;
  numbers: boolean;
  caseSensitive: boolean;
  timeAttackMode: boolean;
  duration? : number;
}

export interface TypingPhysics {
  baseWPM: number;
  confidence: number;
  burstSpeed: number[];
  complexityFactor: number;
  errorDensity: number;
}

export interface TestResult {
  id: string;
  date: Date;
  wpm: number;
  rawWPM: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  duration: number;
  mode: TestMode;
  language: string;
  errorMap: Record<string, number>;
  keystrokes: KeystrokeData[];
  physics: TypingPhysics;
  textComplexity: ComplexityLevel;
  timeAttackMode: boolean;
}

export interface KeystrokeData {
  key: string;
  timestamp: number;
  correct: boolean;
  duration: number;
  pressure?: number;
  velocity?: number;
}

export interface User {
  id: string;
  username: string;
  preferences: UserPreferences;
  statistics: {
    averageWPM: number;
    bestWPM: number;
    testsCompleted: number;
    totalTimePracticed: number;
    averageConfidence: number;
    averageConsistency: number;
    complexityProgress: Record<ComplexityLevel, number>;
  };
}

export interface UserPreferences {
  theme: string;
  fontFamily: string;
  fontSize: number;
  caretStyle: 'block' | 'underline' | 'outline' | 'animated';
  soundFeedback: boolean;
  hapticFeedback: boolean;
  smoothCaret: boolean;
  dynamicDifficulty: boolean;
}

export interface PracticeSession {
  id: string;
  startTime: Date;
  endTime: Date;
  focusArea: 'speed' | 'accuracy' | 'endurance';
  targetMetrics: {
    wpm: number;
    accuracy: number;
    duration: number;
  };
  achievedMetrics: TestResult;
}

export interface APIResponse<T> {
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: string;
  };
  timestamp: number;
}

export interface LiveProgress {
  wpmHistory: number[];
  accuracyHistory: number[];
  currentStreak: number;
  errorPatterns: Record<string, number>;
  heatmap: Record<number, number>;
}
