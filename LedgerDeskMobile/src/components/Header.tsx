import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

/**
 * MUI-style AppBar. 56px min height, icon buttons are 40px circular with ripple.
 */
export function Header({ title, subtitle, onBack, right }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          android_ripple={{ color: colors.surfaceHover, radius: 20, borderless: true }}
          style={styles.iconBtn}
        >
          <Text style={{ color: colors.text, fontSize: 22, lineHeight: 22 }}>‹</Text>
        </Pressable>
      ) : (
        <View style={{ width: spacing.md }} />
      )}

      <View style={styles.title}>
        <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      {right ?? <View style={{ width: spacing.md }} />}
    </View>
  );
}

// Style that needs the theme colors is generated at render time; keep base
// layout in StyleSheet for perf.
const styles = StyleSheet.create({
  wrap: {
    minHeight: 56,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    paddingLeft: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
