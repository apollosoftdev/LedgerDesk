import { getDb } from './db';

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ Value: string }>(
    'SELECT Value FROM AppSettings WHERE Key = ?',
    key
  );
  return row?.Value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO AppSettings (Key, Value) VALUES (?, ?) ON CONFLICT(Key) DO UPDATE SET Value = ?',
    key,
    value,
    value
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM AppSettings WHERE Key = ?', key);
}
