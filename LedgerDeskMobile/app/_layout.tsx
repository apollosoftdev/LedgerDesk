import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { initI18n } from '../src/i18n';
import { getDb } from '../src/services/db';
import { loadCurrency } from '../src/services/currency';
import { isActivated } from '../src/services/license';
import { useAuthStore } from '../src/hooks/useAuthStore';

function Gate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [licensed, setLicensed] = useState(false);
  const isAuth = useAuthStore(s => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  const refreshLicense = async () => setLicensed(await isActivated());

  useEffect(() => {
    (async () => {
      await getDb();
      await initI18n();
      await loadCurrency();
      await refreshLicense();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const seg0 = segments[0];
    const onActivation = seg0 === 'activation';
    const onLogin = seg0 === 'login';

    if (!licensed) {
      if (!onActivation) router.replace('/activation');
      return;
    }
    // licensed
    if (onActivation) {
      router.replace('/login');
      return;
    }
    if (!isAuth && !onLogin) {
      router.replace('/login');
      return;
    }
    if (isAuth && onLogin) {
      router.replace('/(app)/dashboard');
    }
  }, [ready, licensed, isAuth, segments]);

  // Re-check license when returning to activation or login (e.g. after deactivate)
  useEffect(() => {
    if (!ready) return;
    const seg0 = segments[0];
    if (seg0 === 'activation' || seg0 === 'login') {
      refreshLicense();
    }
  }, [segments, ready]);

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
