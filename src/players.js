const seed = require('../players.seed.json');
const { getAllStats, ensurePlayer } = require('./db');
const config = require('./config');

if (seed.length > 16) {
  console.warn(`Warning: players.seed.json has ${seed.length} players, but the max is 16.`);
}

function computeRating(wins, tw) {
  return wins * config.ratingWeights.win + tw * config.ratingWeights.tw;
}

// Merge static seed data (name/image/strengths/weaknesses) with the
// live wins/TW numbers stored in SQLite.
function getAllPlayersWithStats() {
  seed.forEach((p) => ensurePlayer(p.name, p.wins || 0, p.tw || 0));
  const dbStats = getAllStats();
  const statMap = new Map(dbStats.map((s) => [s.name.toLowerCase(), s]));

  return seed.map((p) => {
    const s = statMap.get(p.name.toLowerCase()) || { wins: 0, tw: 0 };
    return {
      ...p,
      wins: s.wins,
      tw: s.tw,
      rating: computeRating(s.wins, s.tw),
    };
  });
}

// Full roster sorted by Wins (desc), tie-broken by TW then name, with
// a "rank" field (1 = most wins) attached to each player.
function getRankedPlayers() {
  const players = getAllPlayersWithStats();
  const sorted = [...players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.tw !== a.tw) return b.tw - a.tw;
    return a.name.localeCompare(b.name);
  });
  sorted.forEach((p, i) => {
    p.rank = i + 1;
  });
  return sorted;
}

// Find a player by exact name, then prefix match, then substring match,
// so "pak stats sam" can match "Samuel" etc.
function findRankedPlayer(query) {
  const ranked = getRankedPlayers();
  const q = query.trim().toLowerCase();
  return (
    ranked.find((p) => p.name.toLowerCase() === q) ||
    ranked.find((p) => p.name.toLowerCase().startsWith(q)) ||
    ranked.find((p) => p.name.toLowerCase().includes(q))
  );
}

// Look up a player by their Discord user ID (used for "pak stats" with no
// name, so a player can check their own stats).
function findRankedPlayerByDiscordId(discordId) {
  const ranked = getRankedPlayers();
  return ranked.find((p) => p.id === discordId);
}

module.exports = {
  seed,
  computeRating,
  getAllPlayersWithStats,
  getRankedPlayers,
  findRankedPlayer,
  findRankedPlayerByDiscordId,
};
