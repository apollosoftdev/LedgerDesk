import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('ledgerdesk.db');
  await _db.execAsync('PRAGMA journal_mode=WAL;');
  await _db.execAsync('PRAGMA foreign_keys=ON;');
  await initSchema(_db);
  return _db;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Categories (
      Id        INTEGER PRIMARY KEY AUTOINCREMENT,
      Name      TEXT    NOT NULL UNIQUE,
      SortOrder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Records (
      Id          INTEGER PRIMARY KEY AUTOINCREMENT,
      Title       TEXT    NOT NULL,
      Category    TEXT    NOT NULL,
      Description TEXT    NOT NULL DEFAULT '',
      Amount      REAL    NOT NULL,
      PaymentType INTEGER NOT NULL DEFAULT 0,
      Date        TEXT    NOT NULL,
      CreatedAt   TEXT    NOT NULL,
      UpdatedAt   TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS RecordImages (
      Id        INTEGER PRIMARY KEY AUTOINCREMENT,
      RecordId  INTEGER NOT NULL REFERENCES Records(Id) ON DELETE CASCADE,
      Uri       TEXT    NOT NULL,
      SortOrder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS AppSettings (
      Key   TEXT PRIMARY KEY,
      Value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_records_date ON Records(Date);
    CREATE INDEX IF NOT EXISTS idx_records_category ON Records(Category);
  `);

  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM Categories');
  if (!count || count.c === 0) {
    const seed = ['Salary', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];
    for (let i = 0; i < seed.length; i++) {
      await db.runAsync('INSERT INTO Categories (Name, SortOrder) VALUES (?, ?)', seed[i], i);
    }
  }
}
