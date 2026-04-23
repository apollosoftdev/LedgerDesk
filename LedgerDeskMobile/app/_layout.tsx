import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { initI18n } from '../src/i18n';
import { getDb } from '../src/services/db';
import { loadCurrency } from '../src/services/currency';
import { useAuthStore } from '../src/hooks/useAuthStore';

function Gate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const isAuth = useAuthStore(s => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await getDb();
      await initI18n();
      await loadCurrency();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthArea = segments[0] === 'login';
    if (!isAuth && !inAuthArea) {
      router.replace('/login');
    } else if (isAuth && inAuthArea) {
      router.replace('/(app)/dashboard');
    }
  }, [ready, isAuth, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Gate>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </Gate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
