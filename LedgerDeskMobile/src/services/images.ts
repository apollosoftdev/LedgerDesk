import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const IMAGE_DIR = `${FileSystem.documentDirectory}record-images/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

async function persistUri(tempUri: string): Promise<string> {
  await ensureDir();
  const ext = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dest = IMAGE_DIR + filename;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

export async function pickFromLibrary(allowMultiple = true): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: allowMultiple,
    quality: 0.85,
    selectionLimit: allowMultiple ? 10 : 1,
  });

  if (result.canceled) return [];
  const uris: string[] = [];
  for (const asset of result.assets) {
    uris.push(await persistUri(asset.uri));
  }
  return uris;
}

export async function captureFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  return persistUri(result.assets[0].uri);
}

export async function deleteImageFile(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}
