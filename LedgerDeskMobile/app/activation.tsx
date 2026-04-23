import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, ToastAndroid, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../src/components/Screen';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing, typography } from '../src/theme/tokens';
import {
  activate, getOrCreateChallenge, getSerialNumber,
} from '../src/services/license';

export default function Activation() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [sn, setSn] = useState('');
  const [challenge, setChallenge] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setSn(await getSerialNumber());
      setChallenge(await getOrCreateChallenge());
    })();
  }, []);

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    const msg = t('common.copied', { value: label });
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  const onActivate = async () => {
    setError(null);
    const trimmed = key.trim();
    if (!trimmed) { setError(t('activation.error_empty')); return; }
    setBusy(true);
    try {
      const ok = await activate(trimmed);
      if (!ok) { setError(t('activation.error_invalid')); return; }
      router.replace('/login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxxl }}>
          <Text style={[typography.label, { color: colors.accent, marginBottom: spacing.sm }]}>
            {t('app.title').toUpperCase()}
          </Text>
          <Text style={[typography.display, { color: colors.text, marginBottom: spacing.sm }]}>
            {t('activation.title')}
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.xl }]}>
            {t('activation.subtitle')}
          </Text>

          <Card padded style={{ marginBottom: spacing.md }}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>
              {t('activation.mac_label')}
            </Text>
            <Pressable onPress={() => copy(sn, sn)}>
              <Text style={[styles.mono, { color: colors.text }]} selectable>
                {sn || '—'}
              </Text>
            </Pressable>
          </Card>

          <Card padded style={{ marginBottom: spacing.xl }}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>
              {t('activation.challenge_label')}
            </Text>
            <Pressable onPress={() => copy(challenge, challenge)}>
              <Text style={[styles.mono, { color: colors.accent, fontSize: 22 }]} selectable>
                {challenge || '—'}
              </Text>
            </Pressable>
          </Card>

          <Input
            label={t('activation.key_header')}
            placeholder={t('activation.key_placeholder')}
            value={key}
            onChangeText={setKey}
            autoCapitalize="characters"
            autoCorrect={false}
            error={error ?? undefined}
          />

          <Button
            title={t('activation.button')}
            onPress={onActivate}
            loading={busy}
            fullWidth
            style={{ marginTop: spacing.md }}
          />

          <Text style={[typography.caption, { color: colors.textDim, marginTop: spacing.xl, lineHeight: 20 }]}>
            {t('activation.help')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
