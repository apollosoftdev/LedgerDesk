import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';
import { formatAmount } from '../services/currency';
import type { Record } from '../types';

type Props = {
  record: Record;
  onPress?: () => void;
};

export function RecordRow({ record, onPress }: Props) {
  const { colors } = useTheme();
  const isExpense = record.paymentType === 1;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceHover : colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}>
        {record.firstImageUri ? (
          <Image source={{ uri: record.firstImageUri }} style={styles.thumbImage} />
        ) : (
          <View style={[styles.pill, { backgroundColor: isExpense ? colors.expenseBg : colors.incomeBg }]}>
            <Text style={{ color: isExpense ? colors.expense : colors.income, fontWeight: '700' }}>
              {isExpense ? '−' : '+'}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
          {record.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.accent }]}>{record.category}</Text>
          <Text style={[typography.caption, { color: colors.textDim }]}>·</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{record.date}</Text>
        </View>
      </View>

      <Text
        style={[
          typography.bodyBold,
          { color: isExpense ? colors.expense : colors.income, marginLeft: spacing.md },
        ]}
      >
        {formatAmount(record.amount, record.paymentType)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  pill: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
