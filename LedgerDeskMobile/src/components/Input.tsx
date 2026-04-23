import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

/**
 * MUI-style outlined TextField.
 * Label sits at the top-left of the border (floating style).
 * Border + label both color to primary when focused, to error on validation.
 *
 * Placeholder-vs-label rule (matches Material UI):
 *   - Empty + unfocused  → label sits in the input, placeholder hidden
 *   - Focused            → label floats up to the border, placeholder appears
 *   - Has a value        → label floats up, value fills the input
 *
 * Without this rule, an empty unfocused input would show both the label and
 * the placeholder stacked on top of each other.
 */
export function Input({
  label, error, style, onFocus, onBlur, value, multiline, placeholder, ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const active = focused || !!value;
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const labelColor  = error ? colors.danger : focused ? colors.primary : colors.textMuted;

  // Only hand the placeholder to TextInput once the label is out of the way.
  const effectivePlaceholder = !label || active ? placeholder : undefined;

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <View style={{ position: 'relative' }}>
        <TextInput
          {...rest}
          value={value}
          multiline={multiline}
          placeholder={effectivePlaceholder}
          placeholderTextColor={colors.textDim}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[
            styles.input,
            {
              backgroundColor: 'transparent',
              borderColor,
              color: colors.text,
              paddingTop: label ? 16 : 14,
              minHeight: multiline ? 90 : 52,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            focused && { borderWidth: 2 },
            style,
          ]}
        />
        {label ? (
          <View
            style={[
              styles.labelWrap,
              { backgroundColor: colors.bg },
              active ? styles.labelFloat : styles.labelRest,
            ]}
            pointerEvents="none"
          >
            <Text style={{ color: labelColor, fontSize: active ? 12 : 14, fontWeight: active ? '500' : '400' }}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
      {error ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6, marginLeft: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.xs,
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 15,
  },
  labelWrap: {
    position: 'absolute',
    left: 10,
    paddingHorizontal: 6,
  },
  labelRest: {
    top: 14,
  },
  labelFloat: {
    top: -9,
  },
});
