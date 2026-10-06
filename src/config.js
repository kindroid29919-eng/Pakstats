const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ quiet: true });

// One prefix for every command: .stats  .result  .vs  .nick  ...
const PREFIX = ".";

const ROOT_DIR = path.join(__dirname, "..");

function resolveDatabasePath() {
  const explicit = (
    process.env.DB_PATH ||
    process.env.BOT_DATABASE_PATH ||
    ""
  ).trim();
  if (explicit) return explicit;

  // On Railway, a mounted Volume exposes its path here. Using it by default
  // means the database lands on persistent storage even if DB_PATH is unset.
  const volume = process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim();
  if (volume) return path.join(volume, "team-pakistan.sqlite");

  return "./data/team-pakistan.sqlite";
}

function getRuntimeConfig() {
  const token = (
    process.env.DISCORD_BOT_TOKEN ||
    process.env.DISCORD_TOKEN ||
    ""
  ).trim();
  if (!token) {
    throw new Error(
      "DISCORD_BOT_TOKEN is missing. Add it as a Secret/Variable on your host or in a local .env file.",
    );
  }

  return {
    token,
    prefix: PREFIX,
    guildId: (process.env.GUILD_ID || "").trim(),
    ownerIds: (process.env.OWNER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    databasePath: resolveDatabasePath(),
    ratingWeights: {
      win: Number(process.env.RATING_WIN_WEIGHT || 2),
      tw: Number(process.env.RATING_TW_WEIGHT || 1),
    },
    assetsDir: path.join(ROOT_DIR, "assets", "players"),
    rosterImagePath: path.join(ROOT_DIR, "assets", "roster.png"),
  };
}

// Warns when the database file is probably on storage that is wiped on every
// deploy. Purely informational; never blocks startup.
function persistenceWarnings(databasePath) {
  const warnings = [];
  const resolved = path.resolve(databasePath);
  const volume = process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim();

  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
    if (!volume) {
      warnings.push(
        "Railway detected but no Volume is mounted. The database WILL be wiped on every deploy. Add a Volume (e.g. mount path /data) and set DB_PATH=/data/team-pakistan.sqlite.",
      );
    } else if (!resolved.startsWith(path.resolve(volume) + path.sep)) {
      warnings.push(
        `DB_PATH (${resolved}) is outside the mounted Volume (${volume}). It will be wiped on deploy. Point DB_PATH inside the Volume.`,
      );
    }
  }
  if (process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT) {
    warnings.push(
      "Replit detected. Files written at runtime (including this SQLite file) are not guaranteed to survive a new deployment. Use a host with a persistent volume (e.g. Railway Volume).",
    );
  }
  return warnings;
}

module.exports = { PREFIX, getRuntimeConfig, persistenceWarnings };
