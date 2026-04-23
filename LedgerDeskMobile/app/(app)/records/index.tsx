import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../src/components/Screen';
import { Header } from '../../../src/components/Header';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { RecordRow } from '../../../src/components/RecordRow';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { radius, shadow, spacing } from '../../../src/theme/tokens';
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
  useEffect(() => { getAllCategories().then(setCategories); }, []);

  const clearFilters = () => {
    setTitleQ(''); setDescQ(''); setCategoryFilter(undefined); setPaymentFilter(null);
    setMinAmt(''); setMaxAmt(''); setFromDate(''); setToDate('');
  };

  return (
    <Screen>
      <Header
        title={t('record.list_title')}
        subtitle={`${records.length} ${records.length === 1 ? 'record' : 'records'}`}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => router.push('/(app)/records/new')}
            android_ripple={{ color: colors.surfaceHover, radius: 20, borderless: true }}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '300' }}>＋</Text>
          </Pressable>
        }
      />

      {/* Top controls — fixed-height header area above the scrollable list */}
      <View style={{ flexShrink: 0 }}>
        <View style={[styles.search, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ color: colors.textMuted, fontSize: 16, marginRight: 8 }}>⌕</Text>
          <TextInput
            placeholder={t('filter.search_title')}
            placeholderTextColor={colors.textDim}
            value={titleQ}
            onChangeText={setTitleQ}
            style={{ flex: 1, color: colors.text, fontSize: 14, padding: 0 }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          <Chip label={t('payment.all')} active={paymentFilter === null && !categoryFilter} onPress={() => { setPaymentFilter(null); setCategoryFilter(undefined); }} />
          <Chip label={t('payment.income')} active={paymentFilter === 0} onPress={() => setPaymentFilter(paymentFilter === 0 ? null : 0)} />
          <Chip label={t('payment.expense')} active={paymentFilter === 1} onPress={() => setPaymentFilter(paymentFilter === 1 ? null : 1)} />
          {categories.map(c => (
            <Chip
              key={c.id}
              label={c.name}
              active={categoryFilter === c.name}
              onPress={() => setCategoryFilter(categoryFilter === c.name ? undefined : c.name)}
            />
          ))}
        </ScrollView>

        <Pressable onPress={() => setShowFilters(s => !s)} style={styles.moreBtn}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>
            {showFilters ? '▾' : '▸'} {t('filter.filters')}
          </Text>
        </Pressable>

        {showFilters ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <Input placeholder={t('filter.search_desc')} value={descQ} onChangeText={setDescQ} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Input placeholder={t('filter.min_amount')} value={minAmt} onChangeText={setMinAmt} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Input placeholder={t('filter.max_amount')} value={maxAmt} onChangeText={setMaxAmt} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Input placeholder="YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} /></View>
              <View style={{ flex: 1 }}><Input placeholder="YYYY-MM-DD" value={toDate} onChangeText={setToDate} /></View>
            </View>
            <Button title={t('filter.clear')} onPress={clearFilters} variant="text" fullWidth />
          </View>
        ) : null}
      </View>

      {/* Records list — fills remaining space below the controls */}
      {records.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }, shadow.sm]}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('empty.title')}</Text>
          <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 4 }}>{t('empty.subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={records}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: spacing.huge }}
          renderItem={({ item, index }) => (
            <View style={[
              { backgroundColor: colors.surface },
              index === 0 && { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, ...shadow.sm },
              index === records.length - 1 && { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, overflow: 'hidden' },
            ]}>
              <RecordRow
                record={item}
                onPress={() => router.push(`/(app)/records/${item.id}`)}
                showDivider={index < records.length - 1}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipStyles.chip,
        {
          backgroundColor: active ? colors.primary : 'transparent',
          borderColor: active ? 'transparent' : colors.border,
        },
      ]}
    >
      <Text style={{
        color: active ? colors.onPrimary : colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipScroll: {
    // Force the horizontal ScrollView to its content height — otherwise it
    // stretches vertically in a flex-column parent and pushes everything
    // below it into the middle of the screen.
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  moreBtn: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
  },
});
