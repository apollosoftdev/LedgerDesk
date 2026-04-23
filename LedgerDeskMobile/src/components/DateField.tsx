import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { localIsoDate } from '../services/records';

type Props = {
  label?: string;
  value: string;              // YYYY-MM-DD (may be empty)
  onChange: (next: string) => void;
  placeholder?: string;
  error?: string;
  clearable?: boolean;        // show × to clear when set (filter use-case)
  maximumDate?: Date;
  minimumDate?: Date;
};

/**
 * MUI-outlined field that opens the native OS date picker on tap.
 * Mirrors <Input>'s label-floats-on-focus behavior so both field types
 * look consistent in a form.
 */
export function DateField({
  label, value, onChange, placeholder = 'Select date',
  error, clearable, maximumDate, minimumDate,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const active = focused || !!value;
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  const labelColor  = error ? colors.danger : focused ? colors.primary : colors.textMuted;

  // Parse YYYY-MM-DD into a local Date, or default to today.
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    setFocused(false);
    if (event.type === 'set' && selected) {
      onChange(localIsoDate(selected));
    }
  };

  const onPressField = () => {
    setFocused(true);
    setOpen(true);
  };

  const clear = (e: any) => {
    e.stopPropagation?.();
    onChange('');
  };

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={onPressField}
          android_ripple={null}
          style={[
            styles.field,
            {
              borderColor,
              borderWidth: focused ? 2 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: value ? colors.text : colors.textDim,
              fontSize: 15,
              flex: 1,
            }}
          >
            {value || (active ? placeholder : '')}
          </Text>
          {clearable && value ? (
            <Pressable onPress={clear} hitSlop={10} style={styles.clearBtn}>
              <Text style={{ color: colors.textMuted, fontSize: 16, lineHeight: 16 }}>×</Text>
            </Pressable>
          ) : null}
        </Pressable>

        {label ? (
          <View
            pointerEvents="none"
            style={[
              styles.labelWrap,
              { backgroundColor: colors.bg },
              active ? styles.labelFloat : styles.labelRest,
            ]}
          >
            <Text style={{
              color: labelColor,
              fontSize: active ? 12 : 14,
              fontWeight: active ? '500' : '400',
            }}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}

      {open ? (
        <DateTimePicker
          value={parsed}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    borderRadius: radius.sm,  // matches Button + Input radius
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelWrap: {
    position: 'absolute',
    left: 10,
    paddingHorizontal: 6,
  },
  labelRest: { top: 14 },
  labelFloat: { top: -9 },
  clearBtn: {
    width: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
