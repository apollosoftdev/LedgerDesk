import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useTheme, ThemeMode } from '../../src/theme/ThemeProvider';
import { radius, spacing, typography } from '../../src/theme/tokens';
import { changePassword } from '../../src/services/auth';
import {
  addCategory, countRecordsInCategory, deleteCategory,
  getAllCategories, reassignCategory,
} from '../../src/services/categories';
import { clearAllRecords } from '../../src/services/records';
import { exportBackup, pickAndRestore } from '../../src/services/backup';
import { CURRENCIES, currentCode, setCurrency, CurrencyCode } from '../../src/services/currency';
import { changeLanguage, SUPPORTED_LANGS, SupportedLang } from '../../src/i18n';
import i18n from '../../src/i18n';
import type { Category } from '../../src/types';
import { useAuthStore } from '../../src/hooks/useAuthStore';

export default function Settings() {
  const { colors, mode, setMode } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore(s => s.logout);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [lang, setLang] = useState<SupportedLang>(i18n.language as SupportedLang);
  const [currency, setCurrencyState] = useState<string>(currentCode());

  const loadCats = async () => setCategories(await getAllCategories());
  useEffect(() => { loadCats(); }, []);

  const onChangePassword = async () => {
    if (!oldPw) { Alert.alert(t('settings.password_error_empty')); return; }
    if (newPw.length < 4) { Alert.alert(t('settings.password_error_short')); return; }
    if (newPw !== confirmPw) { Alert.alert(t('settings.password_error_mismatch')); return; }
    const ok = await changePassword(oldPw, newPw);
    if (!ok) { Alert.alert(t('settings.password_error_wrong')); return; }
    setOldPw(''); setNewPw(''); setConfirmPw('');
    Alert.alert(t('settings.password_changed'));
  };

  const onAddCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    await addCategory(name);
    setNewCat('');
    loadCats();
  };

  const onDeleteCategory = async (cat: Category) => {
    const count = await countRecordsInCategory(cat.name);
    const others = categories.filter(c => c.id !== cat.id);
    if (count > 0 && others.length === 0) {
      Alert.alert(t('category.cannot_delete'), t('category.cannot_delete_msg', { name: cat.name, count }));
      return;
    }
    if (count === 0) {
      Alert.alert(t('category.delete_title'), t('category.delete_confirm', { name: cat.name }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteCategory(cat.id); loadCats(); } },
      ]);
      return;
    }
    const target = others[0].name;
    Alert.alert(
      t('category.delete_title'),
      t('category.delete_reassign', { name: cat.name, count }) + `\n→ ${target}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('category.delete_button'), style: 'destructive',
          onPress: async () => {
            await reassignCategory(cat.name, target);
            await deleteCategory(cat.id);
            loadCats();
          },
        },
      ]
    );
  };

  const onLangChange = async (l: SupportedLang) => {
    await changeLanguage(l);
    setLang(l);
  };

  const onCurrencyChange = async (code: CurrencyCode) => {
    await setCurrency(code);
    setCurrencyState(code);
  };

  const onClearRecords = () => {
    Alert.alert(t('settings.clear_records_title'), t('settings.clear_records_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clear_records_button'), style: 'destructive',
        onPress: async () => { await clearAllRecords(); Alert.alert('OK'); },
      },
    ]);
  };

  const [busyBackup, setBusyBackup] = useState(false);
  const onBackup = async () => {
    setBusyBackup(true);
    try {
      await exportBackup();
    } catch (e: any) {
      Alert.alert('Backup failed', e?.message ?? 'Unknown error');
    } finally {
      setBusyBackup(false);
    }
  };

  const [busyRestore, setBusyRestore] = useState(false);
  const onRestore = () => {
    Alert.alert(t('settings.restore_title'), t('settings.restore_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.restore_button'), style: 'destructive',
        onPress: async () => {
          setBusyRestore(true);
          try {
            const result = await pickAndRestore();
            if (!result.ok) {
              if (result.error !== 'cancelled') {
                Alert.alert(t('settings.restore_failed'), result.error ?? '');
              }
            } else {
              const c = result.counts!;
              Alert.alert(
                t('settings.restore_done'),
                t('settings.restore_summary', { records: c.records, categories: c.categories, images: c.images })
              );
              loadCats();
            }
          } finally {
            setBusyRestore(false);
          }
        },
      },
    ]);
  };

  const onLogout = () => { logout(); router.replace('/login'); };

  return (
    <Screen>
      <Header title={t('settings.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl }}>

        <Section title={t('settings.security')}>
          <Input label={t('settings.old_password')} placeholder={t('settings.old_password_placeholder')}
            value={oldPw} onChangeText={setOldPw} secureTextEntry autoCapitalize="none" />
          <Input label={t('settings.new_password')} placeholder={t('settings.new_password_placeholder')}
            value={newPw} onChangeText={setNewPw} secureTextEntry autoCapitalize="none" />
          <Input label={t('settings.confirm_password')} placeholder={t('settings.confirm_password_placeholder')}
            value={confirmPw} onChangeText={setConfirmPw} secureTextEntry autoCapitalize="none" />
          <Button title={t('settings.change_password')} onPress={onChangePassword} fullWidth />
        </Section>

        <Section title={t('settings.theme')}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ToggleChip label={t('settings.theme_default')} active={mode === 'system'} onPress={() => setMode('system' as ThemeMode)} />
            <ToggleChip label={t('settings.theme_light')} active={mode === 'light'} onPress={() => setMode('light' as ThemeMode)} />
            <ToggleChip label={t('settings.theme_dark')} active={mode === 'dark'} onPress={() => setMode('dark' as ThemeMode)} />
          </View>
        </Section>

        <Section title={t('settings.language')}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {SUPPORTED_LANGS.map(l => (
              <ToggleChip key={l} label={l === 'en' ? 'English' : '中文'} active={lang === l} onPress={() => onLangChange(l)} />
            ))}
          </View>
        </Section>

        <Section title={t('settings.currency')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {CURRENCIES.map(c => (
                <ToggleChip
                  key={c.code}
                  label={`${c.symbol} ${c.code}`}
                  active={currency === c.code}
                  onPress={() => onCurrencyChange(c.code as CurrencyCode)}
                />
              ))}
            </View>
          </ScrollView>
        </Section>

        <Section title={t('settings.categories')}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input placeholder={t('settings.new_category_placeholder')} value={newCat} onChangeText={setNewCat} />
            </View>
            <Button title={t('settings.add_category')} onPress={onAddCategory} />
          </View>
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            {categories.map(c => (
              <View key={c.id} style={[styles.catRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.text, flex: 1 }}>{c.name}</Text>
                <Pressable onPress={() => onDeleteCategory(c)} hitSlop={8}>
                  <Text style={{ color: colors.danger, fontWeight: '600' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Section>

        <Section title={t('settings.data_management')}>
          <View style={{ gap: spacing.sm }}>
            <Button title={t('settings.backup')} onPress={onBackup} loading={busyBackup} fullWidth />
            <Button title={t('settings.restore')} onPress={onRestore} loading={busyRestore} variant="secondary" fullWidth />
            <Button title={t('settings.clear_records')} onPress={onClearRecords} variant="danger" fullWidth />
          </View>
        </Section>

        <Button title={t('settings.logout')} onPress={onLogout} variant="ghost" fullWidth />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[typography.label, { color: colors.accent, marginBottom: spacing.sm }]}>{title}</Text>
      <Card padded>
        {children}
      </Card>
    </View>
  );
}

function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[
      styles.chip,
      {
        backgroundColor: active ? colors.accentBg : colors.surface,
        borderColor: active ? colors.accent : colors.border,
      },
    ]}>
      <Text style={{ color: active ? colors.accent : colors.textMuted, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  catRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1,
  },
});
