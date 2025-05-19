import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import themes from './themes';
import type { Theme } from '../core/types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) setCurrentTheme(theme);
    }
  }, []);

  const handleThemeChange = (themeId: string) => {
    const newTheme = themes.find(t => t.id === themeId);
    if (newTheme) {
      setCurrentTheme(newTheme);
      localStorage.setItem('selectedTheme', themeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme: handleThemeChange,
        availableThemes: themes,
      }}
    >
      <div
        style={{
          '--background': currentTheme.background,
          '--foreground': currentTheme.foreground,
          '--caret': currentTheme.caret,
          '--accent': currentTheme.accent,
          '--error': currentTheme.error,
          '--success': currentTheme.success,
          '--text-primary': currentTheme.textPrimary,
          '--text-secondary': currentTheme.textSecondary,
          '--font-family': currentTheme.fontFamily,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
