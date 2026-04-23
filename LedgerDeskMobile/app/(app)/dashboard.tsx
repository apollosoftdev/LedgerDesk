import React, { useCallback, useState } from 'react';
import {
  Alert, Dimensions, Platform, Pressable, ScrollView, StyleSheet,
  Text, ToastAndroid, View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { BalanceChart } from '../../src/components/BalanceChart';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, shadow, spacing } from '../../src/theme/tokens';
import { getBalanceTrend, getStats } from '../../src/services/records';
import type { TrendGranularity, TrendPoint } from '../../src/services/records';
import { formatBalance } from '../../src/services/currency';

type Stats = { total: number; income: number; expense: number; balance: number };

const GRANULARITY_COUNT: Record<TrendGranularity, number> = {
  day: 30,
  week: 12,
  month: 12,
  year: 5,
};

export default function Dashboard() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, income: 0, expense: 0, balance: 0 });
  const [granularity, setGranularity] = useState<TrendGranularity>('day');
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const screenW = Dimensions.get('window').width;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setStats(await getStats());
        setTrend(await getBalanceTrend(granularity, GRANULARITY_COUNT[granularity]));
      })();
    }, [granularity])
  );

  const copy = async (raw: number | string) => {
    const text = typeof raw === 'number' ? String(raw) : raw;
    await Clipboard.setStringAsync(text);
    const msg = t('common.copied', { value: text });
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  return (
    <Screen>
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        right={
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            android_ripple={{ color: colors.surfaceHover, radius: 20, borderless: true }}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: colors.text, fontSize: 20 }}>⚙</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.huge * 2 }}>
        {/* Balance card */}
        <Pressable onPress={() => copy(stats.balance)}>
          <View style={[styles.balanceCard, { backgroundColor: colors.surface }, shadow.md]}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>
              {t('dashboard.stat_balance')}
            </Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>
              {formatBalance(stats.balance)}
            </Text>
          </View>
        </Pressable>

        {/* Stat cards */}
        <View style={styles.statRow}>
          <Pressable style={{ flex: 1 }} onPress={() => copy(stats.income)}>
            <View style={[styles.stat, { backgroundColor: colors.surface }, shadow.sm]}>
              <Text style={[styles.statLabel, { color: colors.income }]}>
                {t('dashboard.stat_income')}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatBalance(stats.income)}
              </Text>
            </View>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => copy(stats.expense)}>
            <View style={[styles.stat, { backgroundColor: colors.surface }, shadow.sm]}>
              <Text style={[styles.statLabel, { color: colors.expense }]}>
                {t('dashboard.stat_expense')}
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatBalance(stats.expense)}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Balance trend chart */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Balance trend
          </Text>
        </View>

        <View style={styles.chartWrap}>
          <BalanceChart
            data={trend}
            granularity={granularity}
            onGranularityChange={setGranularity}
            width={screenW - 32}
            height={210}
          />
        </View>

        <Pressable onPress={() => router.push('/(app)/records')} style={styles.seeAllLink}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
            View all records →
          </Text>
        </Pressable>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(app)/records/new')}
        style={({ pressed }) => [
          styles.fab,
          shadow.fab,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Text style={{ color: colors.onPrimary, fontSize: 28, fontWeight: '300', lineHeight: 32 }}>＋</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 20,
    borderRadius: radius.lg,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: spacing.xl,
  },
  stat: {
    padding: 14,
    borderRadius: radius.md,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  chartWrap: {
    marginHorizontal: 16,
  },
  seeAllLink: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
