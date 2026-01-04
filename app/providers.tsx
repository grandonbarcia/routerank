'use client';

import { Toaster } from 'sonner';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeContextValue = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within Providers');
  }
  return value;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const isDark = saved === 'true';
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'darkMode') return;
      setIsDarkMode(event.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDarkMode,
      setDarkMode: (v: boolean) => setIsDarkMode(v),
      toggleDarkMode: () => setIsDarkMode((v) => !v),
    }),
    [isDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Toaster position="top-right" richColors />
    </ThemeContext.Provider>
  );
}
