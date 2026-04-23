import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, shadow, spacing } from '../theme/tokens';

type Props = ViewProps & {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padded?: boolean;
};

export function Card({ children, style, elevation = 'sm', padded = true, ...rest }: Props) {
  const { colors } = useTheme();
  const shadowStyle =
    elevation === 'none' ? undefined :
    elevation === 'md'   ? shadow.md :
    elevation === 'lg'   ? shadow.lg : shadow.sm;

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: padded ? spacing.lg : 0,
        } as ViewStyle,
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
