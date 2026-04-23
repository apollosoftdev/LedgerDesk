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
import { DateField } from '../../../src/components/DateField';
import { Button } from '../../../src/components/Button';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { radius, spacing } from '../../../src/theme/tokens';
import {
  addImage, addRecord, deleteImage, getImagesForRecord,
  getRecordById, localIsoDate, updateRecord,
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
  const [date, setDate] = useState(localIsoDate());
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
      if (!editingId && cats.length > 0 && !category) setCategory(cats[0].name);
      if (editingId) {
        const r = await getRecordById(editingId);
        if (r) {
          setTitle(r.title); setCategory(r.category); setDescription(r.description);
          setAmount(String(r.amount)); setDate(r.date); setPaymentType(r.paymentType);
        }
        setExistingImages(await getImagesForRecord(editingId));
      }
    })();
  }, [editingId]);

  const addFromLibrary = async () => {
    const uris = await pickFromLibrary(true);
    if (uris.length) setNewImages(prev => [...prev, ...uris]);
  };
  const captureImage = async () => {
    const uri = await captureFromCamera();
    if (uri) setNewImages(prev => [...prev, uri]);
  };
  const pickImageSource = () => {
    Alert.alert(t('form.image_add'), undefined, [
      { text: t('form.image_gallery'), onPress: addFromLibrary },
      { text: t('form.image_camera'), onPress: captureImage },
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
    if (!title.trim()) { Alert.alert(t('form.title_header')); return; }
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

  const thumbs = [
    ...existingImages.map(i => ({ key: `e-${i.id}`, uri: i.uri, onRemove: () => removeExistingImage(i) })),
    ...newImages.map(uri => ({ key: `n-${uri}`, uri, onRemove: () => removeNewImage(uri) })),
  ];

  return (
    <Screen>
      <Header
        title={editingId ? t('form.edit_title') : t('form.new_title')}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t('payment.type_label')}
          </Text>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
            <SegmentButton
              label={t('payment.income')}
              active={paymentType === 0}
              activeColor={colors.income}
              onPress={() => setPaymentType(0)}
            />
            <SegmentButton
              label={t('payment.expense')}
              active={paymentType === 1}
              activeColor={colors.expense}
              onPress={() => setPaymentType(1)}
            />
          </View>

          <Input label={t('form.title_header')} placeholder={t('form.title_placeholder')} value={title} onChangeText={setTitle} />

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t('form.category_header')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {categories.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.name)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: category === c.name ? colors.primary : 'transparent',
                      borderColor: category === c.name ? 'transparent' : colors.border,
                    },
                  ]}
                >
                  <Text style={{
                    color: category === c.name ? colors.onPrimary : colors.textMuted,
                    fontSize: 12,
                    fontWeight: '500',
                  }}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label={t('form.amount_header')} placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <DateField label={t('form.date_header')} value={date} onChange={setDate} />
            </View>
          </View>

          <Input
            label={t('form.desc_header')}
            placeholder={t('form.desc_placeholder')}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t('form.image_add')}
          </Text>
          <View style={styles.imageGrid}>
            {thumbs.map(th => (
              <View key={th.key} style={styles.thumbWrap}>
                <Image source={{ uri: th.uri }} style={styles.thumb} />
                <Pressable
                  onPress={th.onRemove}
                  style={styles.removeDot}
                  hitSlop={8}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={pickImageSource}
              style={[styles.addThumb, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '300' }}>＋</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Sticky save bar */}
        <View style={[styles.saveBar, { backgroundColor: colors.bg }]}>
          <View style={{ flex: 1 }}>
            <Button title={t('form.cancel')} onPress={() => router.back()} variant="outlined" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('form.save')} onPress={onSave} loading={busy} variant="contained" fullWidth />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SegmentButton({
  label, active, activeColor, onPress,
}: { label: string; active: boolean; activeColor: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segBtn,
        { backgroundColor: active ? activeColor : 'transparent' },
      ]}
    >
      <Text style={{
        color: active ? '#FFFFFF' : colors.textMuted,
        fontWeight: '500',
        fontSize: 13,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    paddingLeft: 4,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    padding: 4,
    marginBottom: spacing.xl,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: 80, height: 80, borderRadius: radius.sm },
  addThumb: {
    width: 80, height: 80,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeDot: {
    position: 'absolute',
    top: 4, right: 4,
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
});
