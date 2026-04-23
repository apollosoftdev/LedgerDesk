import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, shadow, spacing } from '../theme/tokens';

type Variant = 'contained' | 'outlined' | 'text' | 'danger' | 'danger-outlined';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title, onPress, variant = 'contained',
  loading, disabled, fullWidth, style, textStyle,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  let bg: string = 'transparent';
  let fg: string = colors.text;
  let border: string = 'transparent';
  let elevation: typeof shadow.sm | undefined;

  switch (variant) {
    case 'contained':
      bg = colors.primary;
      fg = colors.onPrimary;
      elevation = shadow.sm;
      break;
    case 'outlined':
      bg = 'transparent';
      fg = colors.primary;
      border = colors.border;
      break;
    case 'text':
      bg = 'transparent';
      fg = colors.primary;
      break;
    case 'danger':
      bg = colors.danger;
      fg = '#FFFFFF';
      elevation = shadow.sm;
      break;
    case 'danger-outlined':
      bg = 'transparent';
      fg = colors.danger;
      border = colors.danger;
      break;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: variant === 'contained' ? 'rgba(255,255,255,0.18)' : 'rgba(24,119,242,0.12)' }}
      style={({ pressed }) => [
        styles.base,
        elevation,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[styles.text, { color: fg }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: spacing.xxl,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
