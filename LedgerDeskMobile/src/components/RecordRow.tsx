import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { formatAmount } from '../services/currency';
import type { Record } from '../types';

type Props = {
  record: Record;
  onPress?: () => void;
  showDivider?: boolean;
};

export function RecordRow({ record, onPress, showDivider = true }: Props) {
  const { colors } = useTheme();
  const isExpense = record.paymentType === 1;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.surfaceHover }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceHover : 'transparent',
          borderBottomColor: colors.divider,
          borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <View style={[
        styles.avatar,
        { backgroundColor: isExpense ? colors.expenseBg : colors.incomeBg },
      ]}>
        {record.firstImageUri ? (
          <Image source={{ uri: record.firstImageUri }} style={styles.avatarImage} />
        ) : (
          <Text style={{
            color: isExpense ? colors.expense : colors.income,
            fontWeight: '700',
            fontSize: 16,
          }}>
            {isExpense ? '−' : '+'}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '500', color: colors.text }}
          numberOfLines={1}
        >
          {record.title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
          {record.category} · {record.date}
        </Text>
      </View>

      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: isExpense ? colors.expense : colors.income,
        fontVariant: ['tabular-nums'],
      }}>
        {formatAmount(record.amount, record.paymentType)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: spacing.md,
  },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
});
