import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../src/components/Screen';
import { Header } from '../../../src/components/Header';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { RecordRow } from '../../../src/components/RecordRow';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { searchRecords } from '../../../src/services/records';
import { getAllCategories } from '../../../src/services/categories';
import type { Category, PaymentType, Record, RecordFilter } from '../../../src/types';

export default function RecordsList() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [records, setRecords] = useState<Record[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [titleQ, setTitleQ] = useState('');
  const [descQ, setDescQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [paymentFilter, setPaymentFilter] = useState<PaymentType | null>(null);
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const reload = useCallback(async () => {
    const filter: RecordFilter = {
      titleQuery: titleQ || undefined,
      descriptionQuery: descQ || undefined,
      categoryFilter,
      paymentTypeFilter: paymentFilter,
      amountMin: minAmt ? Number(minAmt) : null,
      amountMax: maxAmt ? Number(maxAmt) : null,
      dateStart: fromDate || null,
      dateEnd: toDate || null,
      sortBy: 'date',
      sortDescending: true,
    };
    setRecords(await searchRecords(filter));
  }, [titleQ, descQ, categoryFilter, paymentFilter, minAmt, maxAmt, fromDate, toDate]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  const clearFilters = () => {
    setTitleQ(''); setDescQ(''); setCategoryFilter(undefined); setPaymentFilter(null);
    setMinAmt(''); setMaxAmt(''); setFromDate(''); setToDate('');
  };

  return (
    <Screen>
      <Header
        title={t('record.list_title')}
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => router.push('/(app)/records/new')} hitSlop={12}>
            <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '300' }}>＋</Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <Input
          placeholder={t('filter.search_title')}
          value={titleQ}
          onChangeText={setTitleQ}
        />
        <Pressable onPress={() => setShowFilters(s => !s)} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>
            {showFilters ? '▾' : '▸'} {t('filter.filters')}
          </Text>
        </Pressable>

        {showFilters ? (
          <View style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md }}>
              <Chip
                label={t('payment.all')}
                active={paymentFilter === null}
                onPress={() => setPaymentFilter(null)}
              />
              <Chip
                label={t('payment.income')}
                active={paymentFilter === 0}
                onPress={() => setPaymentFilter(0)}
              />
              <Chip
                label={t('payment.expense')}
                active={paymentFilter === 1}
                onPress={() => setPaymentFilter(1)}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Chip
                  label={t('filter.all_categories')}
                  active={!categoryFilter}
                  onPress={() => setCategoryFilter(undefined)}
                />
                {categories.map(c => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    active={categoryFilter === c.name}
                    onPress={() => setCategoryFilter(c.name)}
                  />
                ))}
              </View>
            </ScrollView>

            <Input placeholder={t('filter.search_desc')} value={descQ} onChangeText={setDescQ} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input placeholder={t('filter.min_amount')} value={minAmt} onChangeText={setMinAmt} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input placeholder={t('filter.max_amount')} value={maxAmt} onChangeText={setMaxAmt} keyboardType="numeric" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input placeholder="YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} />
              </View>
              <View style={{ flex: 1 }}>
                <Input placeholder="YYYY-MM-DD" value={toDate} onChangeText={setToDate} />
              </View>
            </View>

            <Button title={t('filter.clear')} onPress={clearFilters} variant="ghost" />
          </View>
        ) : null}
      </View>

      <FlatList
        data={records}
        keyExtractor={r => String(r.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl }}
        renderItem={({ item }) => (
          <RecordRow record={item} onPress={() => router.push(`/(app)/records/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: spacing.xxxl }}>
            <Text style={[typography.h3, { color: colors.textMuted }]}>{t('empty.title')}</Text>
            <Text style={[typography.caption, { color: colors.textDim, marginTop: spacing.sm }]}>
              {t('empty.subtitle')}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[
      chipStyles.chip,
      {
        backgroundColor: active ? colors.accentBg : colors.surface,
        borderColor: active ? colors.accent : colors.border,
      },
    ]}>
      <Text style={{ color: active ? colors.accent : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
