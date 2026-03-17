const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.HOP_DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'network-tools.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      ip TEXT,
      mac TEXT,
      notes TEXT
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT NOT NULL,
      params TEXT,
      results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT,
      ip TEXT,
      message TEXT,
      severity TEXT DEFAULT 'info',
      acknowledged INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ssh_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      port INTEGER DEFAULT 22,
      username TEXT,
      last_connected DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveToFile();
  return db;
}

let saveTimeout = null;

function saveToFile() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Failed to save DB:', e.message);
  }
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToFile, 1000);
}

// Wrapper that mimics better-sqlite3 API for easy use
const dbProxy = {
  prepare: (sql) => ({
    all: (...params) => {
      if (!db) return [];
      try {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      } catch (e) {
        console.error('DB query error:', e.message);
        return [];
      }
    },
    run: (...params) => {
      if (!db) return;
      try {
        db.run(sql, params);
        debouncedSave();
      } catch (e) {
        console.error('DB run error:', e.message);
      }
    },
  }),
  getDb,
};

process.on('exit', () => { saveToFile(); });
process.on('SIGINT', () => { saveToFile(); process.exit(); });
process.on('SIGTERM', () => { saveToFile(); process.exit(); });

module.exports = dbProxy;
