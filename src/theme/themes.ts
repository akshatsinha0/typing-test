import type { Theme } from '../core/types';

export const baseTheme: Omit<Theme, 'id' | 'name'> = {
  background: '#232323',
  foreground: '#323232',
  caret: '#00cc88',
  accent: '#00cc88',
  error: '#f44336',
  success: '#4caf50',
  textPrimary: '#e0e0e0',
  textSecondary: '#9e9e9e',
  fontFamily: '"Roboto Mono", monospace',
};

const themes: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    ...baseTheme,
  },
  {
    id: 'light',
    name: 'Light',
    ...baseTheme,
    background: '#f5f5f5',
    foreground: '#e0e0e0',
    textPrimary: '#303030',
    textSecondary: '#505050',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    ...baseTheme,
    background: '#0D0208',
    foreground: '#191919',
    caret: '#00FF41',
    accent: '#00FF41',
    textPrimary: '#00FF41',
    textSecondary: '#008F11',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    ...baseTheme,
    background: '#0B2545',
    foreground: '#13315C',
    caret: '#8DA9C4',
    accent: '#EEF4ED',
    textPrimary: '#EEF4ED',
    textSecondary: '#8DA9C4',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    ...baseTheme,
    background: '#2D142C',
    foreground: '#510A32',
    caret: '#F05365',
    accent: '#F5D547',
    textPrimary: '#F5F5F5',
    textSecondary: '#EF476F',
  },
];

export default themes;
