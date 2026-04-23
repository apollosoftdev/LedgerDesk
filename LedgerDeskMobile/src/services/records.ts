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

export type TrendGranularity = 'day' | 'week' | 'month' | 'year';

export type TrendPoint = {
  date: string;   // ISO YYYY-MM-DD of the bucket's end
  label: string;  // short axis label ("Apr 22", "Apr", "2024")
  tooltip: string; // verbose label for tooltip ("Apr 15 – Apr 21, 2026", "April 2026", "2024")
  balance: number; // cumulative running balance at end of bucket
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const iso = (d: Date) => d.toISOString().slice(0, 10);

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();           // Sun=0..Sat=6
  const offset = (day + 6) % 7;     // days since Monday
  const m = new Date(d);
  m.setDate(d.getDate() - offset);
  m.setHours(0, 0, 0, 0);
  return m;
}

/**
 * Returns N buckets of cumulative running balance, ending with the
 * bucket that contains today. Each bucket's width depends on granularity.
 */
export async function getBalanceTrend(
  granularity: TrendGranularity,
  count: number
): Promise<TrendPoint[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ Date: string; Amount: number; PaymentType: number }>(
    'SELECT Date, Amount, PaymentType FROM Records ORDER BY Date ASC'
  );

  const dailyChange: { [date: string]: number } = {};
  for (const r of rows) {
    const net = r.PaymentType === 1 ? -r.Amount : r.Amount;
    dailyChange[r.Date] = (dailyChange[r.Date] ?? 0) + net;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build N buckets ending with the bucket containing today.
  const buckets: { startISO: string; endISO: string; label: string; tooltip: string }[] = [];

  if (granularity === 'day') {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const s = iso(d);
      const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
      const tooltip = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      buckets.push({ startISO: s, endISO: s, label, tooltip });
    }
  } else if (granularity === 'week') {
    const thisMonday = startOfWeekMonday(today);
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(thisMonday);
      start.setDate(thisMonday.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const label = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
      const tooltip = `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
      buckets.push({ startISO: iso(start), endISO: iso(end), label, tooltip });
    }
  } else if (granularity === 'month') {
    const curY = today.getFullYear();
    const curM = today.getMonth();
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(curY, curM - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // last day of month
      const label = MONTHS[start.getMonth()];
      const tooltip = `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      buckets.push({ startISO: iso(start), endISO: iso(end), label, tooltip });
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      const year = today.getFullYear() - i;
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      buckets.push({ startISO: iso(start), endISO: iso(end), label: String(year), tooltip: String(year) });
    }
  }

  // Seed balance = sum of daily changes before the first bucket.
  const firstStart = buckets[0].startISO;
  let cumulative = 0;
  for (const [date, change] of Object.entries(dailyChange)) {
    if (date < firstStart) cumulative += change;
  }

  const out: TrendPoint[] = [];
  for (const b of buckets) {
    for (const [date, change] of Object.entries(dailyChange)) {
      if (date >= b.startISO && date <= b.endISO) cumulative += change;
    }
    out.push({ date: b.endISO, label: b.label, tooltip: b.tooltip, balance: cumulative });
  }
  return out;
}
