import { useState, useEffect, useCallback, useRef } from 'react';
import type { TestConfig, TestResult, KeystrokeData, ComplexityLevel } from '../../../core/types';

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
  burstSpeeds: number[];
}

function mapComplexityToLevel(complexity: number): ComplexityLevel {
  if (complexity < 1) return 'easy';
  if (complexity < 2) return 'medium';
  return 'hard';
}

export const useTypingTest = ({ config, text, onComplete }: UseTypingTestProps) => {
  // Get the correct duration from either timePreset (new) or duration (old)
  const testDuration = config.timePreset || config.duration || 60;
  
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
    remainingTime: config.mode === 'time' ? testDuration : 0,
    progress: 0,
    burstSpeeds: []
  });

  const intervalRef = useRef<number | null>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const lastKeystrokeRef = useRef<KeystrokeData | null>(null);

  // Physics calculations
  const calculateConfidence = useCallback((keystrokes: KeystrokeData[]): number => {
    if (keystrokes.length < 2) return 1;
    
    const intervals = keystrokes.slice(1).map((k, i) => k.timestamp - keystrokes[i].timestamp);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, t) => a + (t - mean) ** 2, 0) / intervals.length;
    return Math.exp(-variance / 1000);
  }, []);

  const calculateComplexity = useCallback((text: string): number => {
    const wordLengths = text.split(' ').map(w => w.length);
    const avgWordLen = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
    const uniqueChars = new Set(text).size;
    return (avgWordLen * uniqueChars) / 100;
  }, []);

  const calculateBurstSpeed = useCallback((keystrokes: KeystrokeData[]): number[] => {
    const burstWindow = 10; // Last 10 keystrokes
    const bursts: number[] = [];
    
    for (let i = Math.max(0, keystrokes.length - burstWindow); i < keystrokes.length - 1; i++) {
      const duration = keystrokes[i + 1].timestamp - keystrokes[i].timestamp;
      if (duration > 0) {
        bursts.push(60000 / (duration * 60)); // CPM burst
      }
    }
    
    return bursts.length > 0 
      ? [Math.min(...bursts), Math.max(...bursts), bursts.reduce((a, b) => a + b, 0) / bursts.length]
      : [0, 0, 0];
  }, []);

  // Metrics calculation with memoization
  const calculateMetrics = useCallback(() => {
    if (!state.startTime) return;

    const currentTime = Date.now();
    const elapsedTimeInSeconds = (currentTime - state.startTime) / 1000;
    const totalChars = state.charsCorrect + state.charsIncorrect;
    
    // Real-time burst analysis
    const recentBursts = calculateBurstSpeed(state.keystrokes);
    
    // Dynamic WPM calculation
    const rawWpm = totalChars > 0 ? Math.round((state.charsCorrect / 5 / Math.max(0.1, elapsedTimeInSeconds)) * 60) : 0;
    const errorPenalty = Math.min(0.5, state.charsIncorrect / (totalChars || 1));
    const adjustedWpm = Math.round(rawWpm * (1 - errorPenalty));

    setState(prev => ({
      ...prev,
      wpm: adjustedWpm,
      accuracy: totalChars > 0 ? Math.round((state.charsCorrect / totalChars) * 100) : 100,
      elapsedTime: elapsedTimeInSeconds,
      remainingTime: config.mode === 'time' 
        ? Math.max(0, testDuration - elapsedTimeInSeconds)
        : prev.remainingTime,
      progress: config.mode === 'time'
        ? Math.min(100, (elapsedTimeInSeconds / testDuration) * 100)
        : Math.min(100, (state.currentPosition / Math.max(1, text.length)) * 100),
      burstSpeeds: [...prev.burstSpeeds.slice(-50), ...recentBursts]
    }));
  }, [state.startTime, state.charsCorrect, state.charsIncorrect, state.currentPosition, state.keystrokes, config.mode, testDuration, text.length, calculateBurstSpeed]);

  // Optimized timer management
  useEffect(() => {
    if (state.isActive && !state.isFinished) {
      intervalRef.current = window.setInterval(calculateMetrics, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isActive, state.isFinished, calculateMetrics]);

  // Enhanced key handler with burst tracking
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    if (state.isFinished) return;

    const key = e.key;
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key)) return;

    const timestamp = Date.now();
    const newKeystroke: KeystrokeData = {
      key,
      timestamp,
      correct: false,
      duration: lastKeystrokeRef.current 
        ? timestamp - lastKeystrokeRef.current.timestamp
        : 0
    };

    setState(prev => {
      if (!prev.startTime) {
        lastKeystrokeRef.current = { ...newKeystroke, duration: 0 };
        return { ...prev, startTime: timestamp, isActive: true };
      }

      const isBackspace = key === 'Backspace';
      const expectedChar = text[prev.currentPosition];
      const isCorrect = !isBackspace && key === expectedChar;

      // Update error map
      const newErrorMap = { ...prev.errorMap };
      if (!isCorrect && expectedChar) {
        newErrorMap[expectedChar] = (newErrorMap[expectedChar] || 0) + 1;
      }

      // Calculate new position
      const newPosition = isBackspace 
        ? Math.max(0, prev.currentPosition - 1)
        : prev.currentPosition + 1;

      // Check completion - FIXED: Only complete for word mode AND reached end
      // For time mode, completion is handled by timer expiration
      const isComplete = config.mode !== 'time' && 
                         newPosition >= text.length && 
                         text.length > 0;

      // IMPORTANT: Don't set isFinished here for time mode, 
      // let the timer handle it
      return {
        ...prev,
        currentPosition: newPosition,
        inputText: isBackspace ? prev.inputText.slice(0, -1) : prev.inputText + key,
        charsCorrect: prev.charsCorrect + (isCorrect ? 1 : 0),
        charsIncorrect: prev.charsIncorrect + (isCorrect ? 0 : 1),
        errorMap: newErrorMap,
        keystrokes: [...prev.keystrokes, { ...newKeystroke, correct: isCorrect }],
        isFinished: config.mode !== 'time' ? isComplete : false
      };
    });

    lastKeystrokeRef.current = newKeystroke;
  }, [state.isFinished, config.mode, text]);

  // Complete handler with physics metrics
  const handleTestComplete = useCallback(() => {
    // Don't complete again if already finished
    if (state.isFinished) return;
    
    const endTime = Date.now();
    const finalState = state;

    const confidence = calculateConfidence(finalState.keystrokes);
    const complexity = calculateComplexity(text);
    const burstAnalysis = calculateBurstSpeed(finalState.keystrokes);
    
    // Ensure we have enough data for rawWPM calculation
    const rawWPM = finalState.keystrokes.length > 1
      ? finalState.keystrokes
          .filter(k => k.correct)
          .reduce((sum, k, i, arr) => i > 0 
            ? sum + (60000 / ((k.timestamp - arr[i-1].timestamp) || 1)) 
            : 0, 0) / 5
      : finalState.wpm;

    const result: TestResult = {
      id: `test-${endTime}`,
      date: new Date(endTime),
      wpm: finalState.wpm,
      rawWPM,
      accuracy: finalState.accuracy,
      correctChars: finalState.charsCorrect,
      incorrectChars: finalState.charsIncorrect,
      totalChars: finalState.charsCorrect + finalState.charsIncorrect,
      duration: finalState.elapsedTime,
      mode: config.mode,
      language: config.language,
      errorMap: finalState.errorMap,
      keystrokes: finalState.keystrokes,
      textComplexity: mapComplexityToLevel(complexity),
      physics: {
        baseWPM: finalState.wpm,
        confidence,
        burstSpeed: burstAnalysis,
        complexityFactor: complexity,
        errorDensity: finalState.charsIncorrect / (finalState.charsCorrect + finalState.charsIncorrect || 1)
      },
      timeAttackMode: config.mode === 'time'
    };

    onComplete(result);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setState(prev => ({
      ...prev,
      endTime,
      isFinished: true,
      isActive: false
    }));
  }, [state, config.mode, config.language, text, calculateConfidence, calculateComplexity, calculateBurstSpeed, onComplete]);

  // Automatic completion check for time mode
  useEffect(() => {
    if (state.remainingTime <= 0 && config.mode === 'time' && state.isActive) {
      handleTestComplete();
    }
  }, [state.remainingTime, config.mode, state.isActive, handleTestComplete]);

  // Event listener management
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Debug output (can be removed in production)
  useEffect(() => {
    console.log("Test configuration:", {
      mode: config.mode,
      duration: testDuration,
      timePreset: config.timePreset,
      isActive: state.isActive,
      isFinished: state.isFinished,
      remainingTime: state.remainingTime
    });
  }, [config.mode, testDuration, config.timePreset, state.isActive, state.isFinished, state.remainingTime]);

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
    resetTest: useCallback(() => {
      setState(prev => ({
        ...prev,
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
        remainingTime: config.mode === 'time' ? testDuration : 0,
        progress: 0,
        burstSpeeds: []
      }));
      lastKeystrokeRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, [config.mode, testDuration])
  };
};
