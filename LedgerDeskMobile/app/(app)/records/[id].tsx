import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../src/components/Screen';
import { Header } from '../../../src/components/Header';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { ImageLightbox } from '../../../src/components/ImageLightbox';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../src/theme/tokens';
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

  return (
    <Screen>
      <Header title={t('detail.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }}>
        {images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {images.map((img, idx) => (
              <Pressable key={img.id} onPress={() => setLightboxIndex(idx)}>
                <Image
                  source={{ uri: img.uri }}
                  style={{
                    width: screenWidth - spacing.lg * 2,
                    height: 220,
                    borderRadius: radius.lg,
                    marginRight: spacing.sm,
                  }}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Card padded>
          <Text style={[typography.label, { color: colors.textMuted }]}>
            {record.category}
          </Text>
          <Text style={[typography.h1, { color: colors.text, marginTop: spacing.xs }]}>
            {record.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
            {record.date}
          </Text>
        </Card>

        <Card padded style={{ backgroundColor: isExpense ? colors.expenseBg : colors.incomeBg, borderColor: isExpense ? colors.expense : colors.income }}>
          <Text style={[typography.label, { color: isExpense ? colors.expense : colors.income }]}>
            {t('detail.amount_label')}
          </Text>
          <Text style={[typography.display, { color: colors.text, marginTop: spacing.xs }]}>
            {formatAmount(record.amount, record.paymentType)}
          </Text>
        </Card>

        {record.description ? (
          <Card padded>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              {t('detail.desc_label')}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {record.description}
            </Text>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              title={t('detail.edit')}
              onPress={() => router.push(`/(app)/records/edit?id=${record.id}`)}
              variant="secondary"
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('detail.delete')} onPress={onDelete} variant="danger" fullWidth />
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
