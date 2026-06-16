const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function getDbPath() {
  if (process.env.SQLITE_PATH) {
    return process.env.SQLITE_PATH;
  }

  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/campusnotes.db';
    const seedDbPath = path.join(__dirname, 'data', 'campusnotes.db');

    if (!fs.existsSync(tmpDbPath)) {
      try {
        if (fs.existsSync(seedDbPath)) {
          fs.copyFileSync(seedDbPath, tmpDbPath);
          console.log(`Database successfully seeded from ${seedDbPath} to ${tmpDbPath}`);
        } else {
          console.log(`Seed database not found at ${seedDbPath}. A new empty database will be initialized.`);
        }
      } catch (err) {
        console.error('Error seeding database to /tmp:', err);
      }
    }
    return tmpDbPath;
  }

  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return path.join(dataDir, 'campusnotes.db');
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      google_id TEXT UNIQUE,
      auth_provider TEXT NOT NULL DEFAULT 'local',
      profile_pic TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT 'Basic',
      downloads_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      semester TEXT NOT NULL,
      type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      cloudinary_url TEXT NOT NULL DEFAULT '',
      local_filename TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT NOT NULL,
      uploaded_by_email TEXT NOT NULL,
      downloads INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_notes_semester ON notes(semester);
    CREATE INDEX IF NOT EXISTS idx_notes_uploaded_by_email ON notes(uploaded_by_email);
  `);
}

function connectDB() {
  if (db) {
    return db;
  }

  db = new Database(getDbPath());
  if (process.env.VERCEL) {
    db.pragma('journal_mode = DELETE');
  } else {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  initSchema(db);

  return db;
}

module.exports = connectDB;
