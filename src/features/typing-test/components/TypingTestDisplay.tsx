import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Typography } from '../../../core/components/atoms/Typography';
import { useTypingTest } from '../hooks/useTypingTest';
import type { TestConfig, TestResult } from '../../../core/types';

interface TypingTestDisplayProps {
  config: TestConfig;
  text: string;
  onComplete: (result: TestResult) => void;
}

const TestContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  background-color: var(--foreground);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const TextDisplay = styled.div`
  position: relative;
  font-family: var(--font-family);
  font-size: 1.5rem;
  line-height: 2.5rem;
  min-height: 7.5rem;
  white-space: pre-wrap;
  padding: 1rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  user-select: none;
`;

const TextCharacter = styled.span<{ $status: 'current' | 'correct' | 'incorrect' | 'upcoming' }>`
  position: relative;
  transition: all 0.05s ease;
  
  
  ${props => props.$status === 'current' && `
    color: var(--text-primary);
    background-color: transparent;
  `}
  
  ${props => props.$status === 'correct' && `
    color: var(--text-primary);
  `}
  
  ${props => props.$status === 'incorrect' && `
    color: var(--error);
    text-decoration: underline;
  `}
  
  ${props => props.$status === 'upcoming' && `
    color: var(--text-secondary);
  `}
`;

const Caret = styled.span`
  position: absolute;
  width: 2px;
  height: 1.8rem;
  background-color: var(--caret);
  animation: blink 1s step-end infinite;
  
  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  margin-top: 1rem;
  overflow: hidden;
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background-color: var(--accent);
  transition: width 0.3s ease;
`;

export const TypingTestDisplay: React.FC<TypingTestDisplayProps> = ({ config, text, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { 
    currentPosition, 
    inputText, 
    isActive, 
    wpm, 
    accuracy, 
    remainingTime, 
    progress, 
    caretRef
  } = useTypingTest({
    config,
    text,
    onComplete,
  });

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll container to keep caret in view
  useEffect(() => {
    if (caretRef.current && containerRef.current) {
      const caretPos = caretRef.current.offsetTop;
      const containerHeight = containerRef.current.offsetHeight;
      const scrollTop = containerRef.current.scrollTop;
      
      if (caretPos > scrollTop + containerHeight - 50) {
        containerRef.current.scrollTop = caretPos - containerHeight + 50;
      } else if (caretPos < scrollTop + 50) {
        containerRef.current.scrollTop = caretPos - 50;
      }
    }
  }, [currentPosition]);

  // Render characters with appropriate styling
  const renderText = () => {
    return text.split('').map((char, index) => {
      const isCurrent = index === currentPosition;
      const isPast = index < currentPosition;
      const isCorrect = isPast && inputText[index] === char;
      const isIncorrect = isPast && inputText[index] !== char;
      
      let status: 'current' | 'correct' | 'incorrect' | 'upcoming' = 'upcoming';
      
      if (isCurrent) status = 'current';
      else if (isCorrect) status = 'correct';
      else if (isIncorrect) status = 'incorrect';
      
      return (
        <TextCharacter key={index} $status={status}>
          {isCurrent && <Caret ref={caretRef} />}
          {char}
        </TextCharacter>
      );
    });
  };

  return (
    <TestContainer>
      <StatsBar>
        <StatItem>
          <Typography variant="caption">WPM</Typography>
          <Typography variant="h4" color="var(--accent)">
            {isActive ? wpm : '-'}
          </Typography>
        </StatItem>
        
        <StatItem>
          <Typography variant="caption">
            {config.mode === 'time' ? 'TIME' : 'PROGRESS'}
          </Typography>
          <Typography variant="h4">
            {config.mode === 'time' 
              ? formatTime(remainingTime) 
              : `${Math.floor(progress)}%`}
          </Typography>
        </StatItem>
        
        <StatItem>
          <Typography variant="caption">ACCURACY</Typography>
          <Typography variant="h4" color="var(--success)">
            {isActive ? `${accuracy}%` : '-'}
          </Typography>
        </StatItem>
      </StatsBar>
      
      <TextDisplay ref={containerRef}>
        {renderText()}
      </TextDisplay>
      
      <ProgressBar>
        <Progress width={progress} />
      </ProgressBar>
    </TestContainer>
  );
};
