import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Screen({ children, style, ...rest }: ViewProps) {
  const { colors, effectiveMode } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style={effectiveMode === 'dark' ? 'light' : 'dark'} />
      <View {...rest} style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
