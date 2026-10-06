// Merges the static roster (name / Discord ID / image) from players.seed.json
// with the live wins/TW numbers stored in the database.

function createPlayerService({ db, seed, ratingWeights }) {
  if (seed.length > 18) {
    console.warn(
      `[players] players.seed.json has ${seed.length} players, but the max is 18.`,
    );
  }

  function computeRating(wins, tw) {
    return wins * ratingWeights.win + tw * ratingWeights.tw;
  }

  function getAllPlayersWithStats() {
    // Seed values only apply the first time a player is ever seen; an existing
    // database row is never overwritten.
    seed.forEach((p) => db.ensurePlayer(p.name, p.wins || 0, p.tw || 0));
    const statMap = new Map(
      db.getAllStats().map((s) => [s.name.toLowerCase(), s]),
    );

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

  // Sorted by wins (desc), ties broken by TW then name; rank 1 = most wins.
  function getRankedPlayers() {
    const sorted = [...getAllPlayersWithStats()].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.tw !== a.tw) return b.tw - a.tw;
      return a.name.localeCompare(b.name);
    });
    sorted.forEach((p, i) => {
      p.rank = i + 1;
    });
    return sorted;
  }

  // Exact name, then prefix, then substring match.
  function findRankedPlayer(query) {
    const ranked = getRankedPlayers();
    const q = query.trim().toLowerCase();
    return (
      ranked.find((p) => p.name.toLowerCase() === q) ||
      ranked.find((p) => p.name.toLowerCase().startsWith(q)) ||
      ranked.find((p) => p.name.toLowerCase().includes(q))
    );
  }

  function findRankedPlayerByDiscordId(discordId) {
    return getRankedPlayers().find((p) => p.id === discordId);
  }

  return {
    computeRating,
    getAllPlayersWithStats,
    getRankedPlayers,
    findRankedPlayer,
    findRankedPlayerByDiscordId,
  };
}

module.exports = { createPlayerService };
