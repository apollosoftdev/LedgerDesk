import { getDb } from './db';
import type { Category } from '../types';

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT Id, Name, SortOrder FROM Categories ORDER BY SortOrder'
  );
  return rows.map(r => ({ id: r.Id, name: r.Name, sortOrder: r.SortOrder }));
}

export async function addCategory(name: string): Promise<void> {
  const db = await getDb();
  const max = await db.getFirstAsync<{ m: number | null }>('SELECT MAX(SortOrder) as m FROM Categories');
  const next = (max?.m ?? -1) + 1;
  await db.runAsync('INSERT INTO Categories (Name, SortOrder) VALUES (?, ?)', name, next);
}

export async function renameCategory(id: number, newName: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE Categories SET Name = ? WHERE Id = ?', newName, id);
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM Categories WHERE Id = ?', id);
}

export async function reassignCategory(oldName: string, newName: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE Records SET Category = ? WHERE Category = ?', newName, oldName);
}

export async function countRecordsInCategory(name: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM Records WHERE Category = ?', name);
  return row?.c ?? 0;
}
