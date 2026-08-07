import React, { createContext, useContext, useState } from 'react';
import { themeTokens } from './tokens';

type ThemeMode = 'light' | 'dark' | 'hospital';

type ThemeColors = typeof themeTokens.colors;

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof themeTokens.typography;
  roundness: typeof themeTokens.roundness;
  spacing: typeof themeTokens.spacing;
  setMode: (mode: ThemeMode) => void;
}

const darkColors: ThemeColors = {
  ...themeTokens.colors,
  background: '#121212',
  backgroundMain: '#1e1e1e',
  surface: '#1e1e1e',
  surfaceContainer: '#2c2c2c',
  surfaceContainerHigh: '#3a3a3a',
  surfaceContainerHighest: '#484848',
  surfaceContainerLow: '#181818',
  surfaceContainerLowest: '#0c0c0c',
  surfaceGlass: 'rgba(30, 30, 30, 0.7)',
  onSurface: '#f1f1f1',
  onSurfaceVariant: '#c5c6ce',
  textRich: '#ffffff',
  outline: '#8e9099',
  outlineVariant: '#44474e',
};

const hospitalColors: ThemeColors = {
  ...themeTokens.colors,
  // High contrast monochrome-focused theme for high-stress medical environments
  background: '#ffffff',
  backgroundMain: '#ffffff',
  surface: '#f8fafc',
  surfaceContainer: '#f1f5f9',
  surfaceContainerHigh: '#e2e8f0',
  surfaceContainerHighest: '#cbd5e1',
  surfaceContainerLow: '#f8fafc',
  surfaceContainerLowest: '#ffffff',
  surfaceGlass: 'rgba(255, 255, 255, 0.9)',
  primary: '#0f172a',
  onSurface: '#0f172a',
  onSurfaceVariant: '#334155',
  textRich: '#000000',
  outline: '#475569',
  outlineVariant: '#cbd5e1',
  statusCritical: '#ba1a1a', // Use bright red for critical alerts in hospital mode
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const getColors = () => {
    switch (mode) {
      case 'dark':
        return darkColors;
      case 'hospital':
        return hospitalColors;
      default:
        return themeTokens.colors;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors: getColors(),
        typography: themeTokens.typography,
        roundness: themeTokens.roundness,
        spacing: themeTokens.spacing,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
