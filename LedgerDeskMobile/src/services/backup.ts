import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from './db';

const BACKUP_VERSION = 1;
const APP_TAG = 'LedgerDeskMobile';
const IMAGE_DIR = `${FileSystem.documentDirectory}record-images/`;

type RecordRow = {
  Id: number; Title: string; Category: string; Description: string;
  Amount: number; PaymentType: number; Date: string;
  CreatedAt: string; UpdatedAt: string;
};
type CategoryRow = { Id: number; Name: string; SortOrder: number };
type ImageRow = { Id: number; RecordId: number; Uri: string; SortOrder: number };
type SettingRow = { Key: string; Value: string };

type BackupFile = {
  version: number;
  app: string;
  exportedAt: string;
  records: RecordRow[];
  categories: CategoryRow[];
  images: Array<{ recordId: number; sortOrder: number; base64: string; ext: string }>;
  settings: SettingRow[];
};

function guessExt(uri: string): string {
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return m?.[1]?.toLowerCase() ?? 'jpg';
}

async function ensureImageDir() {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

export async function exportBackup(): Promise<string> {
  const db = await getDb();

  const records = await db.getAllAsync<RecordRow>(
    'SELECT Id, Title, Category, Description, Amount, PaymentType, Date, CreatedAt, UpdatedAt FROM Records'
  );
  const categories = await db.getAllAsync<CategoryRow>(
    'SELECT Id, Name, SortOrder FROM Categories'
  );
  const imageRows = await db.getAllAsync<ImageRow>(
    'SELECT Id, RecordId, Uri, SortOrder FROM RecordImages'
  );
  const settings = await db.getAllAsync<SettingRow>(
    'SELECT Key, Value FROM AppSettings'
  );

  const images: BackupFile['images'] = [];
  for (const row of imageRows) {
    try {
      const info = await FileSystem.getInfoAsync(row.Uri);
      if (!info.exists) continue;
      const b64 = await FileSystem.readAsStringAsync(row.Uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      images.push({
        recordId: row.RecordId,
        sortOrder: row.SortOrder,
        base64: b64,
        ext: guessExt(row.Uri),
      });
    } catch {
      // skip unreadable image
    }
  }

  const backup: BackupFile = {
    version: BACKUP_VERSION,
    app: APP_TAG,
    exportedAt: new Date().toISOString(),
    records, categories, images, settings,
  };

  const filename = `ledgerdesk-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(backup), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'LedgerDesk Backup',
      UTI: 'public.json',
    });
  }

  return path;
}

export type RestoreResult = {
  ok: boolean;
  error?: string;
  counts?: { records: number; categories: number; images: number; settings: number };
};

export async function pickAndRestore(): Promise<RestoreResult> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (pick.canceled || !pick.assets?.[0]) return { ok: false, error: 'cancelled' };

  const uri = pick.assets[0].uri;
  let parsed: BackupFile;
  try {
    const raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    parsed = JSON.parse(raw);
  } catch (e: any) {
    return { ok: false, error: 'Could not read backup file.' };
  }

  if (!parsed || parsed.app !== APP_TAG) {
    return { ok: false, error: 'Not a LedgerDesk backup file.' };
  }
  if (parsed.version !== BACKUP_VERSION) {
    return { ok: false, error: `Unsupported backup version: ${parsed.version}` };
  }

  const db = await getDb();
  await ensureImageDir();

  await db.execAsync('BEGIN TRANSACTION');
  try {
    // Wipe existing data
    await db.execAsync(`
      DELETE FROM RecordImages;
      DELETE FROM Records;
      DELETE FROM Categories;
      DELETE FROM AppSettings;
    `);

    // Clear on-disk image files from old state
    try {
      const files = await FileSystem.readDirectoryAsync(IMAGE_DIR);
      for (const f of files) {
        await FileSystem.deleteAsync(IMAGE_DIR + f, { idempotent: true });
      }
    } catch { /* ignore */ }

    // Restore categories
    for (const c of parsed.categories ?? []) {
      await db.runAsync(
        'INSERT INTO Categories (Id, Name, SortOrder) VALUES (?, ?, ?)',
        c.Id, c.Name, c.SortOrder
      );
    }

    // Restore records (keep original IDs so images can link)
    for (const r of parsed.records ?? []) {
      await db.runAsync(
        `INSERT INTO Records (Id, Title, Category, Description, Amount, PaymentType, Date, CreatedAt, UpdatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.Id, r.Title, r.Category, r.Description, r.Amount, r.PaymentType,
        r.Date, r.CreatedAt, r.UpdatedAt
      );
    }

    // Restore images: write base64 back to disk, insert row with new URI
    for (let i = 0; i < (parsed.images ?? []).length; i++) {
      const img = parsed.images[i];
      const filename = `${Date.now()}-${i}.${img.ext || 'jpg'}`;
      const dest = IMAGE_DIR + filename;
      await FileSystem.writeAsStringAsync(dest, img.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await db.runAsync(
        'INSERT INTO RecordImages (RecordId, Uri, SortOrder) VALUES (?, ?, ?)',
        img.recordId, dest, img.sortOrder
      );
    }

    // Restore settings
    for (const s of parsed.settings ?? []) {
      await db.runAsync(
        'INSERT INTO AppSettings (Key, Value) VALUES (?, ?)',
        s.Key, s.Value
      );
    }

    await db.execAsync('COMMIT');
  } catch (e: any) {
    await db.execAsync('ROLLBACK');
    return { ok: false, error: e?.message ?? 'Restore failed' };
  }

  return {
    ok: true,
    counts: {
      records: parsed.records?.length ?? 0,
      categories: parsed.categories?.length ?? 0,
      images: parsed.images?.length ?? 0,
      settings: parsed.settings?.length ?? 0,
    },
  };
}
