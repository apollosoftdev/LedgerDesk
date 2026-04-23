import { getDb } from './db';
import type { Record, RecordFilter, RecordImage } from '../types';

function rowToRecord(row: any): Record {
  return {
    id: row.Id,
    title: row.Title,
    category: row.Category,
    description: row.Description,
    amount: row.Amount,
    paymentType: row.PaymentType,
    date: row.Date,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function buildFilterClause(filter: RecordFilter): { where: string; orderBy: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter.titleQuery?.trim()) {
    conditions.push('Title LIKE ?');
    params.push(`%${filter.titleQuery.trim()}%`);
  }
  if (filter.categoryFilter) {
    conditions.push('Category = ?');
    params.push(filter.categoryFilter);
  }
  if (filter.paymentTypeFilter !== null && filter.paymentTypeFilter !== undefined) {
    conditions.push('PaymentType = ?');
    params.push(filter.paymentTypeFilter);
  }
  if (filter.descriptionQuery?.trim()) {
    conditions.push('Description LIKE ?');
    params.push(`%${filter.descriptionQuery.trim()}%`);
  }
  if (filter.amountMin !== null && filter.amountMin !== undefined) {
    conditions.push('Amount >= ?');
    params.push(filter.amountMin);
  }
  if (filter.amountMax !== null && filter.amountMax !== undefined) {
    conditions.push('Amount <= ?');
    params.push(filter.amountMax);
  }
  if (filter.dateStart) {
    conditions.push('Date >= ?');
    params.push(filter.dateStart);
  }
  if (filter.dateEnd) {
    conditions.push('Date <= ?');
    params.push(filter.dateEnd);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

  const sortCol =
    filter.sortBy === 'title' ? 'Title' :
    filter.sortBy === 'amount' ? 'Amount' :
    filter.sortBy === 'category' ? 'Category' :
    filter.sortBy === 'type' ? 'PaymentType' : 'Date';
  const dir = filter.sortDescending === false ? 'ASC' : 'DESC';
  const orderBy = ` ORDER BY ${sortCol} ${dir}, Id DESC`;

  return { where, orderBy, params };
}

export async function searchRecords(filter: RecordFilter = {}): Promise<Record[]> {
  const db = await getDb();
  const { where, orderBy, params } = buildFilterClause(filter);
  const rows = await db.getAllAsync<any>(
    `SELECT Id, Title, Category, Description, Amount, PaymentType, Date, CreatedAt, UpdatedAt
     FROM Records${where}${orderBy}`,
    ...params
  );
  const records = rows.map(rowToRecord);
  for (const r of records) {
    const firstImg = await db.getFirstAsync<{ Uri: string }>(
      'SELECT Uri FROM RecordImages WHERE RecordId = ? ORDER BY SortOrder LIMIT 1',
      r.id
    );
    if (firstImg) {
      r.firstImageUri = firstImg.Uri;
      r.hasImages = true;
    }
  }
  return records;
}

export async function getRecordById(id: number): Promise<Record | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT Id, Title, Category, Description, Amount, PaymentType, Date, CreatedAt, UpdatedAt FROM Records WHERE Id = ?',
    id
  );
  return row ? rowToRecord(row) : null;
}

export async function addRecord(r: Omit<Record, 'id' | 'createdAt' | 'updatedAt' | 'firstImageUri' | 'hasImages'>): Promise<number> {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO Records (Title, Category, Description, Amount, PaymentType, Date, CreatedAt, UpdatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    r.title, r.category, r.description, r.amount, r.paymentType, r.date, now, now
  );
  return result.lastInsertRowId;
}

export async function updateRecord(r: Record): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE Records SET Title=?, Category=?, Description=?, Amount=?, PaymentType=?, Date=?, UpdatedAt=?
     WHERE Id=?`,
    r.title, r.category, r.description, r.amount, r.paymentType, r.date, now, r.id
  );
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM Records WHERE Id = ?', id);
}

export async function getImagesForRecord(recordId: number): Promise<RecordImage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT Id, RecordId, Uri, SortOrder FROM RecordImages WHERE RecordId = ? ORDER BY SortOrder',
    recordId
  );
  return rows.map(r => ({ id: r.Id, recordId: r.RecordId, uri: r.Uri, sortOrder: r.SortOrder }));
}

export async function addImage(recordId: number, uri: string, sortOrder: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO RecordImages (RecordId, Uri, SortOrder) VALUES (?, ?, ?)',
    recordId, uri, sortOrder
  );
}

export async function deleteImage(imageId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM RecordImages WHERE Id = ?', imageId);
}

export async function getStats() {
  const db = await getDb();
  const total = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM Records');
  const income = await db.getFirstAsync<{ s: number | null }>('SELECT SUM(Amount) as s FROM Records WHERE PaymentType = 0');
  const expense = await db.getFirstAsync<{ s: number | null }>('SELECT SUM(Amount) as s FROM Records WHERE PaymentType = 1');
  const inc = income?.s ?? 0;
  const exp = expense?.s ?? 0;
  return {
    total: total?.c ?? 0,
    income: inc,
    expense: exp,
    balance: inc - exp,
  };
}

export async function clearAllRecords(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM RecordImages; DELETE FROM Records;');
}
