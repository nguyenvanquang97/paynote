import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'paynote.db';

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabase({
    name: DB_NAME,
    location: 'default',
  });

  await initializeDatabase(db);

  return db;
};

const initializeDatabase = async (database: SQLite.SQLiteDatabase) => {
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      bank TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL,
      description TEXT,
      category TEXT,
      transaction_type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      raw_text TEXT NOT NULL,
      is_suspected_gap INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  await database.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp
    ON transactions (timestamp DESC)
  `);

  await database.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_transactions_bank
    ON transactions (bank)
  `);

  await database.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_transactions_category
    ON transactions (category)
  `);

  await database.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_transactions_type
    ON transactions (transaction_type)
  `);
};

export const closeDatabase = async () => {
  if (db) {
    await db.close();
    db = null;
  }
};
