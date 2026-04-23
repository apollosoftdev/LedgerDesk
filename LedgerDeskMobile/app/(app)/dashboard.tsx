import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View, Platform, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, typography } from '../../src/theme/tokens';
import { getStats } from '../../src/services/records';
import { formatBalance } from '../../src/services/currency';

type Stats = { total: number; income: number; expense: number; balance: number };

export default function Dashboard() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, income: 0, expense: 0, balance: 0 });

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
    }, [])
  );

  const copyValue = async (raw: number | string) => {
    const text = typeof raw === 'number' ? String(raw) : raw;
    await Clipboard.setStringAsync(text);
    const msg = t('common.copied', { value: text });
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(msg);
    }
  };

  return (
    <Screen>
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        right={
          <Pressable onPress={() => router.push('/(app)/settings')} hitSlop={12}>
            <Text style={{ color: colors.accent, fontSize: 22 }}>⚙</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Pressable onLongPress={() => copyValue(stats.balance)} onPress={() => copyValue(stats.balance)} delayLongPress={250}>
          <Card padded>
            <Text style={[typography.label, { color: colors.textMuted }]}>
              {t('dashboard.stat_balance')}
            </Text>
            <Text
              style={[
                typography.display,
                {
                  color: stats.balance >= 0 ? colors.income : colors.expense,
                  marginTop: spacing.xs,
                  fontSize: 42,
                },
              ]}
            >
              {formatBalance(stats.balance)}
            </Text>
          </Card>
        </Pressable>

        <View style={styles.row}>
          <Pressable style={{ flex: 1 }} onPress={() => copyValue(stats.income)}>
            <Card style={{ backgroundColor: colors.incomeBg, borderColor: colors.income }}>
              <Text style={[typography.label, { color: colors.income }]}>
                {t('dashboard.stat_income')}
              </Text>
              <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xs }]}>
                {formatBalance(stats.income)}
              </Text>
            </Card>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => copyValue(stats.expense)}>
            <Card style={{ backgroundColor: colors.expenseBg, borderColor: colors.expense }}>
              <Text style={[typography.label, { color: colors.expense }]}>
                {t('dashboard.stat_expense')}
              </Text>
              <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xs }]}>
                {formatBalance(stats.expense)}
              </Text>
            </Card>
          </Pressable>
        </View>

        <Pressable onPress={() => copyValue(stats.total)}>
          <Card padded>
            <Text style={[typography.label, { color: colors.textMuted }]}>
              {t('dashboard.stat_total')}
            </Text>
            <Text style={[typography.h1, { color: colors.text, marginTop: spacing.xs }]}>
              {stats.total}
            </Text>
          </Card>
        </Pressable>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          <Button
            title={t('record.new_button')}
            onPress={() => router.push('/(app)/records/new')}
            fullWidth
          />
          <Button
            title={t('record.list_title')}
            onPress={() => router.push('/(app)/records')}
            variant="secondary"
            fullWidth
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
});
