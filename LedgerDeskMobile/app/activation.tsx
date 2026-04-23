import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, ToastAndroid, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../src/components/Screen';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, shadow, spacing } from '../src/theme/tokens';
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

  const copy = async (text: string, label?: string) => {
    await Clipboard.setStringAsync(text);
    const msg = t('common.copied', { value: label ?? text });
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.brand, { color: colors.primary }]}>
            {t('app.title')}
          </Text>
          <Text style={[styles.h1, { color: colors.text }]}>
            {t('activation.title')}
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {t('activation.subtitle')}
          </Text>

          <Pressable onPress={() => copy(sn)} style={[infoTile(colors)]}>
            <View>
              <Text style={[tileLabel, { color: colors.textMuted }]}>
                {t('activation.mac_label')}
              </Text>
              <Text style={[tileValue, { color: colors.text }]} selectable>{sn || '—'}</Text>
            </View>
            <Text style={{ color: colors.textDim, fontSize: 16 }}>⎘</Text>
          </Pressable>

          <Pressable onPress={() => copy(challenge)} style={[infoTile(colors), { marginBottom: spacing.xxl }]}>
            <View>
              <Text style={[tileLabel, { color: colors.textMuted }]}>
                {t('activation.challenge_label')}
              </Text>
              <Text style={[tileValue, { color: colors.info, fontSize: 20 }]} selectable>
                {challenge || '—'}
              </Text>
            </View>
            <Text style={{ color: colors.textDim, fontSize: 16 }}>⎘</Text>
          </Pressable>

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
            variant="contained"
            fullWidth
          />

          <Text style={[styles.help, { color: colors.textDim }]}>
            {t('activation.help')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const tileLabel = {
  fontSize: 11,
  fontWeight: '500' as const,
  marginBottom: 4,
};
const tileValue = {
  fontSize: 15,
  fontWeight: '600' as const,
  fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  letterSpacing: 0.5,
};

function infoTile(colors: any) {
  return [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    shadow.sm,
  ];
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    minHeight: '100%',
  },
  brand: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.huge - 8,
  },
  h1: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.xxxl,
  },
  help: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
