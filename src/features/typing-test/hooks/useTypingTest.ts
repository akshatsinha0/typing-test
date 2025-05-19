import { useState, useEffect, useCallback, useRef } from 'react';
import type { TestConfig } from '../../../core/types';
import type { TestResult } from '../../../core/types';
import type { KeystrokeData } from '../../../core/types';

interface UseTypingTestProps {
  config: TestConfig;
  text: string;
  onComplete: (result: TestResult) => void;
}

interface TypingState {
  inputText: string;
  startTime: number | null;
  endTime: number | null;
  isFinished: boolean;
  isActive: boolean;
  charsCorrect: number;
  charsIncorrect: number;
  currentPosition: number;
  errorMap: Record<string, number>;
  keystrokes: KeystrokeData[];
  wpm: number;
  accuracy: number;
  elapsedTime: number;
  remainingTime: number;
  progress: number;
}

export const useTypingTest = ({ config, text, onComplete }: UseTypingTestProps) => {
  const [state, setState] = useState<TypingState>({
    inputText: '',
    startTime: null,
    endTime: null,
    isFinished: false,
    isActive: false,
    charsCorrect: 0,
    charsIncorrect: 0,
    currentPosition: 0,
    errorMap: {},
    keystrokes: [],
    wpm: 0,
    accuracy: 0,
    elapsedTime: 0,
    remainingTime: config.mode === 'time' ? config.duration : 0,
    progress: 0,
  });

  const intervalRef = useRef<number | null>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  
  // Calculate metrics
  const calculateMetrics = useCallback(() => {
    if (!state.startTime) return;
    
    const currentTime = Date.now();
    const elapsedTimeInSeconds = (currentTime - state.startTime) / 1000;
    
    // Standard calculation: 5 characters = 1 word
    const totalWords = state.charsCorrect / 5;
    const wpm = Math.round((totalWords / elapsedTimeInSeconds) * 60);
    
    const totalChars = state.charsCorrect + state.charsIncorrect;
    const accuracy = totalChars > 0 ? Math.round((state.charsCorrect / totalChars) * 100) : 100;
    
    let remainingTime = 0;
    if (config.mode === 'time') {
      remainingTime = Math.max(0, config.duration - elapsedTimeInSeconds);
    }
    
    let progress = 0;
    if (config.mode === 'time') {
      progress = Math.min(100, (elapsedTimeInSeconds / config.duration) * 100);
    } else if (config.mode === 'words') {
      progress = Math.min(100, (state.currentPosition / text.length) * 100);
    }
    
    setState(prev => ({
      ...prev,
      wpm,
      accuracy,
      elapsedTime: elapsedTimeInSeconds,
      remainingTime,
      progress,
    }));
  }, [state.startTime, state.charsCorrect, state.charsIncorrect, state.currentPosition, config.mode, config.duration, text.length]);

  // Start timer
  useEffect(() => {
    if (state.isActive && state.startTime && !state.isFinished) {
      intervalRef.current = window.setInterval(() => {
        calculateMetrics();
        
        // Check if time's up for time mode
        if (config.mode === 'time' && state.remainingTime <= 0) {
          handleTestComplete();
        }
      }, 100);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.startTime, state.isFinished, state.remainingTime, calculateMetrics, config.mode]);

  // Handle keypress
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    
    if (state.isFinished) return;
    
    // Start timer on first keypress
    if (!state.startTime) {
      setState(prev => ({ ...prev, startTime: Date.now(), isActive: true }));
    }
    
    const key = e.key;
    
    // Skip modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key)) {
      return;
    }
    
    // Handle special keys
    if (key === 'Backspace') {
      setState(prev => ({
        ...prev,
        currentPosition: Math.max(0, prev.currentPosition - 1),
        inputText: prev.inputText.slice(0, -1),
        keystrokes: [
          ...prev.keystrokes, 
          { key, timestamp: Date.now(), correct: true }
        ],
      }));
      return;
    }
    
    // Regular character input
    const expectedChar = text[state.currentPosition];
    const isCorrect = key === expectedChar;
    
    // Update error map for incorrect characters
    const newErrorMap = { ...state.errorMap };
    if (!isCorrect) {
      newErrorMap[expectedChar] = (newErrorMap[expectedChar] || 0) + 1;
    }
    
    setState(prev => {
      const newPosition = prev.currentPosition + 1;
      const newInputText = prev.inputText + key;
      
      // Check if test is complete (reached end of text for words/quote mode)
      const isTestComplete = 
        config.mode !== 'time' && newPosition >= text.length;
      
      if (isTestComplete) {
        handleTestComplete();
      }
      
      return {
        ...prev,
        currentPosition: newPosition,
        inputText: newInputText,
        charsCorrect: prev.charsCorrect + (isCorrect ? 1 : 0),
        charsIncorrect: prev.charsIncorrect + (isCorrect ? 0 : 1),
        errorMap: newErrorMap,
        keystrokes: [
          ...prev.keystrokes, 
          { key, timestamp: Date.now(), correct: isCorrect }
        ],
      };
    });
  }, [state.currentPosition, state.inputText, state.isFinished, state.startTime, state.errorMap, state.keystrokes, text, config.mode]);

  // Handle test completion
  const handleTestComplete = useCallback(() => {
    const endTime = Date.now();
    
    setState(prev => {
      if (prev.isFinished) return prev;
      
      const testDuration = 
        prev.startTime ? (endTime - prev.startTime) / 1000 : 0;
      
      const result: TestResult = {
        id: `test-${Date.now()}`,
        date: new Date(),
        wpm: prev.wpm,
        rawWpm: prev.wpm, // Can be adjusted for errors
        accuracy: prev.accuracy,
        correctChars: prev.charsCorrect,
        incorrectChars: prev.charsIncorrect,
        totalChars: prev.charsCorrect + prev.charsIncorrect,
        duration: testDuration,
        mode: config.mode,
        language: config.language,
        errorMap: prev.errorMap,
        keystrokes: prev.keystrokes,
      };
      
      onComplete(result);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      return {
        ...prev,
        endTime,
        isFinished: true,
        isActive: false,
      };
    });
  }, [onComplete, config.mode, config.language]);

  // Reset test
  const resetTest = useCallback(() => {
    setState({
      inputText: '',
      startTime: null,
      endTime: null,
      isFinished: false,
      isActive: false,
      charsCorrect: 0,
      charsIncorrect: 0,
      currentPosition: 0,
      errorMap: {},
      keystrokes: [],
      wpm: 0,
      accuracy: 0,
      elapsedTime: 0,
      remainingTime: config.mode === 'time' ? config.duration : 0,
      progress: 0,
    });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [config.mode, config.duration]);

  // Setup and cleanup event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleKeyPress]);

  return {
    currentPosition: state.currentPosition,
    inputText: state.inputText,
    isActive: state.isActive,
    isFinished: state.isFinished,
    wpm: state.wpm,
    accuracy: state.accuracy,
    elapsedTime: state.elapsedTime,
    remainingTime: state.remainingTime,
    progress: state.progress,
    caretRef,
    resetTest,
  };
};
