import React, { useEffect, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../src/components/Screen';
import { Header } from '../../../src/components/Header';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import {
  addImage, addRecord, deleteImage, getImagesForRecord,
  getRecordById, updateRecord,
} from '../../../src/services/records';
import { getAllCategories } from '../../../src/services/categories';
import { captureFromCamera, deleteImageFile, pickFromLibrary } from '../../../src/services/images';
import type { Category, PaymentType, RecordImage } from '../../../src/types';

export default function RecordForm() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState<PaymentType>(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<RecordImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const cats = await getAllCategories();
      setCategories(cats);
      if (!editingId && cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }
      if (editingId) {
        const r = await getRecordById(editingId);
        if (r) {
          setTitle(r.title);
          setCategory(r.category);
          setDescription(r.description);
          setAmount(String(r.amount));
          setDate(r.date);
          setPaymentType(r.paymentType);
        }
        setExistingImages(await getImagesForRecord(editingId));
      }
    })();
  }, [editingId]);

  const addImagesFromLibrary = async () => {
    const uris = await pickFromLibrary(true);
    if (uris.length) setNewImages(prev => [...prev, ...uris]);
  };

  const addImageFromCamera = async () => {
    const uri = await captureFromCamera();
    if (uri) setNewImages(prev => [...prev, uri]);
  };

  const pickImageSource = () => {
    Alert.alert(t('form.image_add'), undefined, [
      { text: t('form.image_gallery'), onPress: addImagesFromLibrary },
      { text: t('form.image_camera'), onPress: addImageFromCamera },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const removeNewImage = (uri: string) => {
    setNewImages(prev => prev.filter(u => u !== uri));
    deleteImageFile(uri);
  };

  const removeExistingImage = (img: RecordImage) => {
    setExistingImages(prev => prev.filter(i => i.id !== img.id));
    setRemovedImageIds(prev => [...prev, img.id]);
  };

  const onSave = async () => {
    if (!title.trim()) { Alert.alert(t('form.title_header'), t('form.title_placeholder')); return; }
    const amt = Number(amount);
    if (!Number.isFinite(amt)) { Alert.alert(t('form.amount_header')); return; }
    if (!category) { Alert.alert(t('form.category_header')); return; }

    setBusy(true);
    try {
      let recordId = editingId;
      if (editingId) {
        await updateRecord({
          id: editingId, title: title.trim(), category,
          description: description.trim(), amount: amt, paymentType, date,
          createdAt: '', updatedAt: '',
        });
        for (const id of removedImageIds) {
          const img = existingImages.find(i => i.id === id);
          await deleteImage(id);
          if (img) await deleteImageFile(img.uri);
        }
      } else {
        recordId = await addRecord({
          title: title.trim(), category, description: description.trim(),
          amount: amt, paymentType, date,
        });
      }
      if (recordId) {
        const base = existingImages.length;
        for (let i = 0; i < newImages.length; i++) {
          await addImage(recordId, newImages[i], base + i);
        }
      }
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const allThumbs = [
    ...existingImages.map(i => ({ key: `e-${i.id}`, uri: i.uri, onRemove: () => removeExistingImage(i) })),
    ...newImages.map(uri => ({ key: `n-${uri}`, uri, onRemove: () => removeNewImage(uri) })),
  ];

  return (
    <Screen>
      <Header
        title={editingId ? t('form.edit_title') : t('form.new_title')}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
          <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {t('payment.type_label')}
          </Text>
          <View style={styles.segment}>
            <SegmentItem
              label={t('payment.income')}
              active={paymentType === 0}
              onPress={() => setPaymentType(0)}
              color={colors.income}
            />
            <SegmentItem
              label={t('payment.expense')}
              active={paymentType === 1}
              onPress={() => setPaymentType(1)}
              color={colors.expense}
            />
          </View>

          <View style={{ height: spacing.md }} />

          <Input label={t('form.title_header')} placeholder={t('form.title_placeholder')}
            value={title} onChangeText={setTitle} />

          <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {t('form.category_header')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {categories.map(c => (
                <Pressable key={c.id} onPress={() => setCategory(c.name)} style={[
                  styles.chip,
                  {
                    backgroundColor: category === c.name ? colors.accentBg : colors.surface,
                    borderColor: category === c.name ? colors.accent : colors.border,
                  },
                ]}>
                  <Text style={{ color: category === c.name ? colors.accent : colors.textMuted, fontWeight: '600' }}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Input label={t('form.amount_header')} placeholder="0.00"
            value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

          <Input label={t('form.date_header')} placeholder="YYYY-MM-DD"
            value={date} onChangeText={setDate} />

          <Input label={t('form.desc_header')} placeholder={t('form.desc_placeholder')}
            value={description} onChangeText={setDescription} multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }} />

          <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {t('form.image_add')}
          </Text>
          <View style={styles.imageGrid}>
            {allThumbs.map(th => (
              <View key={th.key} style={styles.thumbWrap}>
                <Image source={{ uri: th.uri }} style={styles.thumb} />
                <Pressable
                  onPress={th.onRemove}
                  style={[styles.removeDot, { backgroundColor: colors.danger }]}
                  hitSlop={8}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={pickImageSource}
              style={[styles.addThumb, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.accent, fontSize: 28, fontWeight: '300' }}>＋</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <View style={{ flex: 1 }}>
              <Button title={t('form.cancel')} onPress={() => router.back()} variant="secondary" fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t('form.save')} onPress={onSave} loading={busy} fullWidth />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SegmentItem({ label, active, onPress, color }:
  { label: string; active: boolean; onPress: () => void; color: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segItem,
        {
          backgroundColor: active ? color : colors.surface,
          borderColor: active ? color : colors.border,
        },
      ]}
    >
      <Text style={{ color: active ? '#0A0A0F' : colors.textMuted, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: spacing.sm },
  segItem: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1,
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumbWrap: { position: 'relative' },
  thumb: { width: 80, height: 80, borderRadius: radius.md },
  addThumb: {
    width: 80, height: 80, borderRadius: radius.md, borderWidth: 1,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  removeDot: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
});
