const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createDatabase, STATS_ZEROED_KEY } = require("../database/database");
const { createPlayerService } = require("./players");
const { parseVsInput, buildVsMessage } = require("./vsBuilder");
const seed = require("../../players.seed.json");

const weights = { win: 2, tw: 1 };

function tempDb(context) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "team-pak-"));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, "bot.sqlite");
}

test("seed file has every player at 0 wins / 0 TW and no strengths/weaknesses", () => {
  assert.ok(seed.length > 0);
  for (const p of seed) {
    assert.equal(p.wins, 0, p.name);
    assert.equal(p.tw, 0, p.name);
    assert.ok(!("strengths" in p) && !("weaknesses" in p), p.name);
  }
});

test("added wins/TW survive reopening the database and are never re-zeroed", (context) => {
  const file = tempDb(context);

  let db = createDatabase(file);
  assert.equal(db.didZeroStats, true); // first ever boot sets the flag
  let players = createPlayerService({ db, seed, ratingWeights: weights });
  players.getRankedPlayers(); // seeds rows
  db.addWins("Ahad", 5);
  db.addTW("Ahad", 3);
  db.close();

  // "New deployment": same file, fresh process.
  db = createDatabase(file);
  assert.equal(db.didZeroStats, false);
  players = createPlayerService({ db, seed, ratingWeights: weights });
  const ahad = players.findRankedPlayer("ahad");
  assert.equal(ahad.wins, 5);
  assert.equal(ahad.tw, 3);
  assert.equal(ahad.rating, 5 * 2 + 3);
  assert.equal(ahad.rank, 1);
  db.close();
});

test("one-time reset zeroes old data exactly once, then stays out of the way", (context) => {
  const file = tempDb(context);

  // Simulate an older database that already holds real numbers.
  let db = createDatabase(file);
  db.ensurePlayer("Soman", 364, 18);
  db.setMeta(STATS_ZEROED_KEY, ""); // placeholder so we can clear it below
  db.close();
  const Database = require("better-sqlite3");
  const raw = new Database(file);
  raw.prepare("DELETE FROM meta WHERE key = ?").run(STATS_ZEROED_KEY);
  raw.close();

  db = createDatabase(file);
  assert.equal(db.didZeroStats, true);
  assert.deepEqual(
    { wins: db.getStats("Soman").wins, tw: db.getStats("Soman").tw },
    { wins: 0, tw: 0 },
  );
  db.addWins("Soman", 7);
  db.close();

  db = createDatabase(file);
  assert.equal(db.didZeroStats, false);
  assert.equal(db.getStats("Soman").wins, 7);
  db.close();
});

test("role settings and stats live side by side in one database", (context) => {
  const file = tempDb(context);
  let db = createDatabase(file);
  db.setField("g1", "vs_role_id", "role-1");
  db.addWins("Zekey", 2);
  db.close();
  db = createDatabase(file);
  assert.equal(db.getGuild("g1").vsRoleId, "role-1");
  assert.equal(db.getStats("Zekey").wins, 2);
  db.close();
});

test(".result builder still formats a match and the vs counter persists", (context) => {
  const file = tempDb(context);
  const parsed = parseVsInput(
    "teams: Pakistan vs Japan\nscore: 4-6\nnumber: 725\nZekey ps sr\nmvp: Ahad",
  );
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.explicitNumber, 725);
  const text = buildVsMessage(parsed, 725);
  assert.match(text, /Vs #725/u);
  assert.match(text, /Pakistan 🇵🇰 vs Japan 🇯🇵/u);

  let db = createDatabase(file);
  assert.equal(db.getVsCounter(), null);
  db.setVsCounter(725);
  db.close();
  db = createDatabase(file);
  assert.equal(db.getVsCounter(), 725);
  db.close();
});
