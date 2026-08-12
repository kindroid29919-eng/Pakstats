const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('./config');

// Make sure the folder holding the DB file exists (important for the
// Railway Volume mount path, e.g. /data).
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS stats (
    name TEXT PRIMARY KEY COLLATE NOCASE,
    wins INTEGER NOT NULL DEFAULT 0,
    tw INTEGER NOT NULL DEFAULT 0
  );
`);

function ensurePlayer(name) {
  db.prepare(`INSERT OR IGNORE INTO stats (name, wins, tw) VALUES (?, 0, 0)`).run(name);
}

function getStats(name) {
  ensurePlayer(name);
  return db.prepare(`SELECT * FROM stats WHERE name = ? COLLATE NOCASE`).get(name);
}

function getAllStats() {
  return db.prepare(`SELECT * FROM stats`).all();
}

function addWins(name, amount) {
  ensurePlayer(name);
  db.prepare(`UPDATE stats SET wins = wins + ? WHERE name = ? COLLATE NOCASE`).run(amount, name);
  return getStats(name);
}

function addTW(name, amount) {
  ensurePlayer(name);
  db.prepare(`UPDATE stats SET tw = tw + ? WHERE name = ? COLLATE NOCASE`).run(amount, name);
  return getStats(name);
}

module.exports = { db, ensurePlayer, getStats, getAllStats, addWins, addTW };
