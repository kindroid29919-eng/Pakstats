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

// Single-row table that remembers the last "Vs #___" number used, so
// future "pak vs" results can auto-increment without the user retyping it.
db.exec(`
  CREATE TABLE IF NOT EXISTS vs_counter (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    value INTEGER NOT NULL
  );
`);

function getVsCounter() {
  const row = db.prepare(`SELECT value FROM vs_counter WHERE id = 1`).get();
  return row ? row.value : null;
}

function setVsCounter(value) {
  db.prepare(
    `INSERT INTO vs_counter (id, value) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET value = excluded.value`
  ).run(value);
}

// Creates the row if it doesn't exist yet. initialWins/initialTw are only
// used the very first time a player is seen (e.g. from players.seed.json);
// once a row exists, INSERT OR IGNORE will never overwrite it.
function ensurePlayer(name, initialWins = 0, initialTw = 0) {
  db.prepare(`INSERT OR IGNORE INTO stats (name, wins, tw) VALUES (?, ?, ?)`).run(
    name,
    initialWins,
    initialTw
  );
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

module.exports = {
  db,
  ensurePlayer,
  getStats,
  getAllStats,
  addWins,
  addTW,
  getVsCounter,
  setVsCounter,
};
