import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'dark' | 'light' | 'amoled' | 'nord' | 'dracula' | 'lavender' | 'ocean' | 'system' | 'high-contrast';

interface ThemeContextType {
  darkMode: boolean;
  themeMode: ThemeMode;
  toggleDarkMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  themeMode: 'dark',
  toggleDarkMode: () => {},
  setThemeMode: () => {},
  accentColor: '#667eea',
  setAccentColor: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('monogram_theme');
    return (saved as ThemeMode) || 'dark';
  });
  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem('monogram_accent') || '#667eea';
  });

  const applyTheme = (mode: ThemeMode, accent: string) => {
    document.body.classList.remove('dark-mode', 'light-mode', 'amoled-mode', 'nord-mode', 'dracula-mode', 'lavender-mode', 'ocean-mode', 'high-contrast');
    
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (mode === 'light') {
      document.body.classList.add('light-mode');
    } else if (mode === 'amoled') {
      document.body.classList.add('amoled-mode');
    } else if (mode === 'nord') {
      document.body.classList.add('nord-mode');
    } else if (mode === 'dracula') {
      document.body.classList.add('dracula-mode');
    } else if (mode === 'lavender') {
      document.body.classList.add('lavender-mode');
    } else if (mode === 'ocean') {
      document.body.classList.add('ocean-mode');
    } else if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(isDark ? 'dark-mode' : 'light-mode');
    } else if (mode === 'high-contrast') {
      document.body.classList.add('high-contrast');
    }
    
    document.documentElement.style.setProperty('--accent', accent);
  };

  useEffect(() => {
    applyTheme(themeMode, accentColor);
    localStorage.setItem('monogram_theme', themeMode);
    localStorage.setItem('monogram_accent', accentColor);
  }, [themeMode, accentColor]);

  const toggleDarkMode = () => {
    setThemeModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode: themeMode !== 'light', 
      themeMode, 
      toggleDarkMode, 
      setThemeMode, 
      accentColor, 
      setAccentColor 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};