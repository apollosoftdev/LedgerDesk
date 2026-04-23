import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../src/components/Screen';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing, typography } from '../src/theme/tokens';
import { isPasswordSet, setPassword, verifyPassword } from '../src/services/auth';
import { useAuthStore } from '../src/hooks/useAuthStore';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore(s => s.login);

  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [password, setPasswordInput] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const has = await isPasswordSet();
      setIsSetup(!has);
    })();
  }, []);

  if (isSetup === null) return <Screen />;

  const onSubmit = async () => {
    setError(null);
    if (!password) { setError(t('login.error_empty')); return; }
    if (password.length < 4) { setError(t('login.error_short')); return; }

    setBusy(true);
    try {
      if (isSetup) {
        if (password !== confirm) { setError(t('login.error_mismatch')); return; }
        await setPassword(password);
        login();
        router.replace('/(app)/dashboard');
      } else {
        const ok = await verifyPassword(password);
        if (!ok) { setError(t('login.error_wrong')); return; }
        login();
        router.replace('/(app)/dashboard');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, justifyContent: 'center' }}>
          <View style={{ marginBottom: spacing.xxxl }}>
            <Text style={[typography.label, { color: colors.accent, marginBottom: spacing.sm }]}>
              {t('app.title').toUpperCase()}
            </Text>
            <Text style={[typography.display, { color: colors.text, marginBottom: spacing.sm }]}>
              {isSetup ? t('login.title_setup') : t('login.title_welcome')}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              {isSetup ? t('login.subtitle_setup') : t('login.subtitle_login')}
            </Text>
          </View>

          <Input
            label={t('login.password_header')}
            placeholder={t('login.password_placeholder')}
            value={password}
            onChangeText={setPasswordInput}
            secureTextEntry
            autoCapitalize="none"
            error={error ?? undefined}
          />

          {isSetup ? (
            <Input
              label={t('login.confirm_header')}
              placeholder={t('login.confirm_placeholder')}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
            />
          ) : null}

          <Button
            title={isSetup ? t('login.button_setup') : t('login.button_login')}
            onPress={onSubmit}
            loading={busy}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
