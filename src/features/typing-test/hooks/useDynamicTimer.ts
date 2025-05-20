import { useEffect, useState } from 'react';

export const useDynamicTimer = (initialTime: number, onComplete: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if(isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if(t <= 0.1) {
            setIsActive(false);
            onComplete();
            return 0;
          }
          return t - 0.1;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  return {
    timeLeft: Number(timeLeft.toFixed(1)),
    startTimer: () => setIsActive(true),
    pauseTimer: () => setIsActive(false),
    resetTimer: (newTime: number) => {
      setIsActive(false);
      setTimeLeft(newTime);
    }
  };
};
