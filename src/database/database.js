const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function normalizeAuthorizedRoles(value) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((roleId) => typeof roleId === "string"))]
      : [];
  } catch {
    return [];
  }
}

// Marks the one-time "set every player's wins/TW to 0" reset. Once this key
// exists in the meta table the reset never runs again, so numbers added later
// are permanent.
const STATS_ZEROED_KEY = "stats_zeroed_v1";

function createDatabase(databasePath) {
  const resolvedPath =
    databasePath === ":memory:" ? databasePath : path.resolve(databasePath);

  if (resolvedPath !== ":memory:") {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const database = new Database(resolvedPath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");

  // ---- Schema (CREATE IF NOT EXISTS only: nothing here ever drops data) ----
  database.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      vs_role_id TEXT,
      authorized_role_ids TEXT NOT NULL DEFAULT '[]',
      nick_role_id TEXT,
      nick_prefix TEXT,
      nick_suffix TEXT,
      ea_role_id TEXT,
      ea_prefix TEXT,
      ea_suffix TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stats (
      name TEXT PRIMARY KEY COLLATE NOCASE,
      wins INTEGER NOT NULL DEFAULT 0,
      tw INTEGER NOT NULL DEFAULT 0
    );

    -- Last "Vs #___" number used by .result, so it can auto-increment.
    CREATE TABLE IF NOT EXISTS vs_counter (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ---- Guild settings (role / nickname config) ----
  const ensureGuild = database.prepare(`
    INSERT INTO guild_settings (guild_id)
    VALUES (@guildId)
    ON CONFLICT(guild_id) DO NOTHING
  `);

  const selectGuild = database.prepare(
    "SELECT * FROM guild_settings WHERE guild_id = ?",
  );
  function getGuild(guildId) {
    ensureGuild.run({ guildId });
    const row = selectGuild.get(guildId);
    return {
      guildId: row.guild_id,
      vsRoleId: row.vs_role_id,
      authorizedRoleIds: normalizeAuthorizedRoles(row.authorized_role_ids),
      nickRoleId: row.nick_role_id,
      nickPrefix: row.nick_prefix,
      nickSuffix: row.nick_suffix,
      eaRoleId: row.ea_role_id,
      eaPrefix: row.ea_prefix,
      eaSuffix: row.ea_suffix,
    };
  }

  const allowedColumns = new Set([
    "vs_role_id",
    "authorized_role_ids",
    "nick_role_id",
    "nick_prefix",
    "nick_suffix",
    "ea_role_id",
    "ea_prefix",
    "ea_suffix",
  ]);

  function setFields(guildId, fields) {
    const entries = Object.entries(fields);
    for (const [column] of entries) {
      if (!allowedColumns.has(column)) {
        throw new Error(`Unsupported settings field: ${column}`);
      }
    }
    if (entries.length === 0) return;
    ensureGuild.run({ guildId });
    const assignments = entries.map(
      ([column], index) => `${column} = @value${index}`,
    );
    const values = { guildId };
    entries.forEach(([column, value], index) => {
      values[`value${index}`] =
        column === "authorized_role_ids" ? JSON.stringify(value) : value;
    });
    const statement = database.prepare(`
      UPDATE guild_settings
      SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE guild_id = @guildId
    `);
    statement.run(values);
  }

  function setField(guildId, column, value) {
    setFields(guildId, { [column]: value });
  }

  function authorizeRole(guildId, roleId) {
    const roleIds = new Set(getGuild(guildId).authorizedRoleIds);
    roleIds.add(roleId);
    setField(guildId, "authorized_role_ids", [...roleIds]);
    return [...roleIds];
  }

  function deauthorizeRole(guildId, roleId) {
    const roleIds = getGuild(guildId).authorizedRoleIds.filter(
      (currentRoleId) => currentRoleId !== roleId,
    );
    setField(guildId, "authorized_role_ids", roleIds);
    return roleIds;
  }

  // ---- Meta (tiny key/value store for one-time flags) ----
  function getMeta(key) {
    const row = database.prepare("SELECT value FROM meta WHERE key = ?").get(key);
    return row ? row.value : null;
  }

  function setMeta(key, value) {
    database
      .prepare(
        `INSERT INTO meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(key, String(value));
  }

  // ---- Player stats (wins / TW) ----
  // INSERT OR IGNORE: an existing row is never overwritten by the seed file.
  function ensurePlayer(name, initialWins = 0, initialTw = 0) {
    database
      .prepare(`INSERT OR IGNORE INTO stats (name, wins, tw) VALUES (?, ?, ?)`)
      .run(name, initialWins, initialTw);
  }

  function getStats(name) {
    ensurePlayer(name);
    return database
      .prepare(`SELECT * FROM stats WHERE name = ? COLLATE NOCASE`)
      .get(name);
  }

  function getAllStats() {
    return database.prepare(`SELECT * FROM stats`).all();
  }

  function addWins(name, amount) {
    ensurePlayer(name);
    database
      .prepare(`UPDATE stats SET wins = wins + ? WHERE name = ? COLLATE NOCASE`)
      .run(amount, name);
    return getStats(name);
  }

  function addTW(name, amount) {
    ensurePlayer(name);
    database
      .prepare(`UPDATE stats SET tw = tw + ? WHERE name = ? COLLATE NOCASE`)
      .run(amount, name);
    return getStats(name);
  }

  // ---- .result counter ----
  function getVsCounter() {
    const row = database
      .prepare(`SELECT value FROM vs_counter WHERE id = 1`)
      .get();
    return row ? row.value : null;
  }

  function setVsCounter(value) {
    database
      .prepare(
        `INSERT INTO vs_counter (id, value) VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET value = excluded.value`,
      )
      .run(value);
  }

  // ---- One-time reset: wins and TW -> 0 for everyone ----
  // Runs exactly once per database (guarded by the meta flag). After that,
  // every .addwins / .addtw is kept across restarts and redeploys.
  const zeroStatsOnce = database.transaction(() => {
    if (getMeta(STATS_ZEROED_KEY)) return false;
    database.prepare(`UPDATE stats SET wins = 0, tw = 0`).run();
    setMeta(STATS_ZEROED_KEY, new Date().toISOString());
    return true;
  });
  const didZeroStats = zeroStatsOnce();

  return {
    getGuild,
    setField,
    setFields,
    authorizeRole,
    deauthorizeRole,
    ensurePlayer,
    getStats,
    getAllStats,
    addWins,
    addTW,
    getVsCounter,
    setVsCounter,
    getMeta,
    setMeta,
    didZeroStats,
    path: resolvedPath,
    close: () => database.close(),
  };
}

module.exports = { createDatabase, STATS_ZEROED_KEY };
