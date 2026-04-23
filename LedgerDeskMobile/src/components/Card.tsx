import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

type Props = ViewProps & {
  elevated?: boolean;
  padded?: boolean;
};

export function Card({ children, style, elevated, padded = true, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? colors.bgElevated : colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: padded ? spacing.lg : 0,
        } as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
