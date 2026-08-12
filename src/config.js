require('dotenv').config();

const ownerIds = (process.env.OWNER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = {
  token: process.env.DISCORD_TOKEN,
  ownerIds,
  // Prefix requires a trailing space, e.g. "pak stats Bob"
  prefix: 'pak ',
  dbPath: process.env.DB_PATH || './data/pakstats.db',
  ratingWeights: {
    win: Number(process.env.RATING_WIN_WEIGHT || 2),
    tw: Number(process.env.RATING_TW_WEIGHT || 1),
  },
};
