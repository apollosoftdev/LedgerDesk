import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function Header({ title, subtitle, onBack, right }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { borderBottomColor: colors.divider }]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '600' }}>‹</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
