import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, '../data');
fs.mkdirSync(dataDirectory, { recursive: true });

export function createDatabase(filename = path.join(dataDirectory, 'tickets.db')) {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      used_at TEXT
    );
  `);
  return db;
}

export const db = createDatabase();
