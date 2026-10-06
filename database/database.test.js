const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createDatabase } = require("./database");

test("settings are isolated by guild and persist after reopening SQLite", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "team-pakistan-db-"));
  const databasePath = path.join(directory, "settings.sqlite");
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  let db = createDatabase(databasePath);
  db.setField("guild-a", "vs_role_id", "role-a");
  db.authorizeRole("guild-a", "mod-role");
  db.setField("guild-a", "nick_prefix", "FL |");
  db.setField("guild-a", "ea_suffix", "✓");
  db.setField("guild-b", "vs_role_id", "role-b");
  db.close();

  db = createDatabase(databasePath);
  assert.equal(db.getGuild("guild-a").vsRoleId, "role-a");
  assert.deepEqual(db.getGuild("guild-a").authorizedRoleIds, ["mod-role"]);
  assert.equal(db.getGuild("guild-a").nickPrefix, "FL |");
  assert.equal(db.getGuild("guild-a").eaSuffix, "✓");
  assert.equal(db.getGuild("guild-b").vsRoleId, "role-b");
  assert.equal(db.getGuild("guild-b").nickPrefix, null);
  db.deauthorizeRole("guild-a", "mod-role");
  assert.deepEqual(db.getGuild("guild-a").authorizedRoleIds, []);
  db.close();
});