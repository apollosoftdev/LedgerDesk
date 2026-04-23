import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../src/components/Screen';
import { Header } from '../../../src/components/Header';
import { Button } from '../../../src/components/Button';
import { ImageLightbox } from '../../../src/components/ImageLightbox';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { radius, shadow, spacing } from '../../../src/theme/tokens';
import { deleteRecord, getImagesForRecord, getRecordById } from '../../../src/services/records';
import { deleteImageFile } from '../../../src/services/images';
import { formatAmount } from '../../../src/services/currency';
import type { Record as RecordType, RecordImage } from '../../../src/types';

export default function RecordDetail() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = Number(id);

  const [record, setRecord] = useState<RecordType | null>(null);
  const [images, setImages] = useState<RecordImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    if (id === 'new') return;
    (async () => {
      const r = await getRecordById(recordId);
      setRecord(r);
      if (r) setImages(await getImagesForRecord(r.id));
    })();
  }, [recordId]));

  if (id === 'new') return null;
  if (!record) return <Screen />;

  const isExpense = record.paymentType === 1;
  const screenWidth = Dimensions.get('window').width;

  const onDelete = () => {
    Alert.alert(t('delete.title'), t('delete.confirm', { title: record.title }), [
      { text: t('delete.cancel'), style: 'cancel' },
      {
        text: t('delete.button'), style: 'destructive', onPress: async () => {
          for (const img of images) await deleteImageFile(img.uri);
          await deleteRecord(record.id);
          router.back();
        },
      },
    ]);
  };

  const amountColor = isExpense ? colors.expense : colors.income;
  const amountBg    = isExpense ? colors.expenseBg : colors.incomeBg;

  return (
    <Screen>
      <Header title={t('detail.title')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.huge }}>
        {/* Gallery */}
        {images.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {images.map((img, idx) => (
                <Pressable
                  key={img.id}
                  onPress={() => setLightboxIndex(idx)}
                  style={{ position: 'relative' }}
                >
                  <Image
                    source={{ uri: img.uri }}
                    style={{
                      width: screenWidth - 40,
                      height: (screenWidth - 40) * 0.62,
                      borderRadius: radius.md,
                      marginRight: 8,
                    }}
                  />
                  {idx === 0 ? (
                    <View style={styles.zoomHint}>
                      <Text style={{ color: '#fff', fontSize: 10 }}>tap to zoom</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Meta */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 4 }}>
            {record.category}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{record.title}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>{record.date}</Text>
        </View>

        {/* Amount card */}
        <View style={[styles.amountCard, { backgroundColor: amountBg }, shadow.sm]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: amountColor, marginBottom: 4 }}>
            {t('detail.amount_label')}
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700', letterSpacing: -0.8, color: amountColor, fontVariant: ['tabular-nums'] }}>
            {formatAmount(record.amount, record.paymentType)}
          </Text>
        </View>

        {/* Description */}
        {record.description ? (
          <View style={[styles.desc, { backgroundColor: colors.surface }, shadow.sm]}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 6 }}>
              {t('detail.desc_label')}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.text }}>
              {record.description}
            </Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button
              title={t('detail.edit')}
              onPress={() => router.push(`/(app)/records/edit?id=${record.id}`)}
              variant="outlined"
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('detail.delete')} onPress={onDelete} variant="danger-outlined" fullWidth />
          </View>
        </View>
      </ScrollView>

      <ImageLightbox
        uris={images.map(i => i.uri)}
        initialIndex={lightboxIndex ?? 0}
        visible={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  amountCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: radius.md,
  },
  desc: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 10,
    right: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
