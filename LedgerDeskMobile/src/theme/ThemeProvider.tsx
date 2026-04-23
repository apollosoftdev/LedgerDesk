import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { getSetting, setSetting } from '../services/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    (async () => {
      const stored = await getSetting('theme_mode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    })();
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    await setSetting('theme_mode', next);
  };

  const effectiveMode: 'light' | 'dark' = mode === 'system' ? systemScheme : mode;
  const colors = effectiveMode === 'light' ? (lightColors as unknown as ThemeColors) : darkColors;

  const value = useMemo(
    () => ({ colors, mode, effectiveMode, setMode }),
    [colors, mode, effectiveMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
