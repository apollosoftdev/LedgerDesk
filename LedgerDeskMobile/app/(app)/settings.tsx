import React, { useEffect, useState } from 'react';
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet,
  Text, ToastAndroid, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { useTheme, ThemeMode } from '../../src/theme/ThemeProvider';
import { radius, shadow, spacing } from '../../src/theme/tokens';
import { changePassword } from '../../src/services/auth';
import {
  addCategory, countRecordsInCategory, deleteCategory,
  getAllCategories, reassignCategory,
} from '../../src/services/categories';
import { clearAllRecords } from '../../src/services/records';
import { exportBackup, pickAndRestore, resetBackupFolder } from '../../src/services/backup';
import { deactivate as deactivateLicense, getSerialNumber, getStoredKey } from '../../src/services/license';
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
  const [sn, setSn] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [busyBackup, setBusyBackup] = useState(false);
  const [busyRestore, setBusyRestore] = useState(false);

  const loadCats = async () => setCategories(await getAllCategories());
  const loadLicense = async () => {
    setSn(await getSerialNumber());
    setLicenseKey((await getStoredKey()) ?? '');
  };
  useEffect(() => { loadCats(); loadLicense(); }, []);

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    const msg = t('common.copied', { value: text });
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

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

  const onLangChange = async (l: SupportedLang) => { await changeLanguage(l); setLang(l); };
  const onCurrencyChange = async (code: CurrencyCode) => { await setCurrency(code); setCurrencyState(code); };

  const onBackup = async () => {
    setBusyBackup(true);
    try {
      const r = await exportBackup();
      if (!r.ok) {
        if (r.error !== 'cancelled') Alert.alert(t('settings.backup_failed'), r.error);
        return;
      }
      Alert.alert(t('settings.backup_done'), t('settings.backup_saved_to', { filename: r.filename }));
    } catch (e: any) {
      Alert.alert(t('settings.backup_failed'), e?.message ?? 'Unknown error');
    } finally {
      setBusyBackup(false);
    }
  };

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
              if (result.error !== 'cancelled') Alert.alert(t('settings.restore_failed'), result.error ?? '');
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

  const onResetBackupFolder = async () => {
    await resetBackupFolder();
    Alert.alert(t('settings.backup_folder_reset'));
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

  const onLogout = () => { logout(); router.replace('/login'); };

  const onDeactivate = () => {
    Alert.alert(t('settings.deactivate_title'), t('settings.deactivate_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.license_deactivate'), style: 'destructive',
        onPress: async () => {
          await deactivateLicense();
          logout();
          router.replace('/activation');
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title={t('settings.title')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: spacing.huge }}>
        {/* Appearance */}
        <Section title={t('settings.theme')}>
          <ToggleRow>
            <ToggleChip label={t('settings.theme_default')} active={mode === 'system'} onPress={() => setMode('system' as ThemeMode)} />
            <ToggleChip label={t('settings.theme_light')} active={mode === 'light'} onPress={() => setMode('light' as ThemeMode)} />
            <ToggleChip label={t('settings.theme_dark')} active={mode === 'dark'} onPress={() => setMode('dark' as ThemeMode)} />
          </ToggleRow>
        </Section>

        <Section title={t('settings.language')}>
          <ToggleRow>
            {SUPPORTED_LANGS.map(l => (
              <ToggleChip key={l} label={l === 'en' ? 'English' : '中文'} active={lang === l} onPress={() => onLangChange(l)} />
            ))}
          </ToggleRow>
        </Section>

        <Section title={t('settings.currency')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
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

        {/* Security */}
        <Section title={t('settings.security')}>
          <Input label={t('settings.old_password')} placeholder={t('settings.old_password_placeholder')}
            value={oldPw} onChangeText={setOldPw} secureTextEntry autoCapitalize="none" />
          <Input label={t('settings.new_password')} placeholder={t('settings.new_password_placeholder')}
            value={newPw} onChangeText={setNewPw} secureTextEntry autoCapitalize="none" />
          <Input label={t('settings.confirm_password')} placeholder={t('settings.confirm_password_placeholder')}
            value={confirmPw} onChangeText={setConfirmPw} secureTextEntry autoCapitalize="none" />
          <Button title={t('settings.change_password')} onPress={onChangePassword} variant="outlined" fullWidth />
        </Section>

        {/* Categories */}
        <Section title={t('settings.categories')}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Input placeholder={t('settings.new_category_placeholder')} value={newCat} onChangeText={setNewCat} />
            </View>
            <View style={{ marginTop: 4 }}>
              <Button title={t('settings.add_category')} onPress={onAddCategory} variant="contained" />
            </View>
          </View>
          <View style={[styles.catList, { backgroundColor: colors.surface }, shadow.sm]}>
            {categories.map((c, idx) => (
              <View
                key={c.id}
                style={[
                  styles.catRow,
                  idx < categories.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Text style={{ color: colors.text, flex: 1, fontSize: 14 }}>{c.name}</Text>
                <Pressable onPress={() => onDeleteCategory(c)} hitSlop={8}>
                  <Text style={{ color: colors.danger, fontSize: 18, fontWeight: '500' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Section>

        {/* License */}
        <Section title={t('settings.license')}>
          <View style={[styles.licenseBox, { backgroundColor: colors.surface }, shadow.sm]}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 4 }}>
              {t('settings.license_mac')}
            </Text>
            <Pressable onPress={() => copy(sn)}>
              <Text style={[styles.mono, { color: colors.text, marginBottom: 14 }]} selectable>
                {sn || '—'}
              </Text>
            </Pressable>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 4 }}>
              {t('settings.license_key')}
            </Text>
            <Pressable onPress={() => copy(licenseKey)}>
              <Text style={[styles.mono, { color: colors.text, marginBottom: 14 }]} selectable>
                {licenseKey || '—'}
              </Text>
            </Pressable>
            <Button title={t('settings.license_deactivate')} onPress={onDeactivate} variant="danger-outlined" fullWidth />
          </View>
        </Section>

        {/* Data */}
        <Section title={t('settings.data_management')}>
          <View style={[styles.groupCard, { backgroundColor: colors.surface }, shadow.sm]}>
            <Button title={t('settings.backup')} onPress={onBackup} loading={busyBackup} variant="contained" fullWidth />
            <Button title={t('settings.restore')} onPress={onRestore} loading={busyRestore} variant="outlined" fullWidth />
            <Button title={t('settings.backup_folder_reset_button')} onPress={onResetBackupFolder} variant="text" fullWidth />
          </View>
        </Section>

        {/* Danger zone */}
        <View style={[styles.dangerZone, { borderTopColor: colors.divider }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger, marginBottom: 10, paddingLeft: 4 }}>
            {t('settings.reset_app_title')}
          </Text>
          <View style={{ gap: 8 }}>
            <Button title={t('settings.clear_records')} onPress={onClearRecords} variant="danger" fullWidth />
            <Button title={t('settings.logout')} onPress={onLogout} variant="text" fullWidth />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 20, marginBottom: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10, paddingLeft: 4 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{children}</View>;
}

function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggleChip,
        {
          backgroundColor: active ? colors.primary : 'transparent',
          borderColor: active ? 'transparent' : colors.border,
        },
      ]}
    >
      <Text style={{ color: active ? colors.onPrimary : colors.textMuted, fontWeight: '500', fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  catList: {
    borderRadius: radius.md,
    marginTop: 10,
    overflow: 'hidden',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  licenseBox: {
    padding: 16,
    borderRadius: radius.md,
  },
  groupCard: {
    padding: 16,
    borderRadius: radius.md,
    gap: 8,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dangerZone: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
  },
});
