const { UserFacingError } = require("../../utils/errors");
const { getCommandBody, splitArgs } = require("../../utils/args");
const { commandResult } = require("../../utils/responses");

// Builds .addwins / .addtw. Both write straight to the database, which
// is the only place wins/TW live, so changes survive restarts and redeploys.
function createAddStatCommand({ name, field, label, dbMethod }) {
  return {
    name,
    async execute({ message, prefix, db, players, config }) {
      if (!config.ownerIds.includes(message.author.id)) {
        throw new UserFacingError("Only the bot owner can use this command.");
      }

      const args = splitArgs(getCommandBody(message, prefix));
      if (args.length < 2) {
        throw new UserFacingError(
          `Usage: \`${prefix}${name} <player name> <amount>\``,
        );
      }

      const amount = Number(args[args.length - 1]);
      if (!Number.isInteger(amount)) {
        throw new UserFacingError("Amount must be a whole number.");
      }

      const query = args.slice(0, -1).join(" ");
      const player = players.findRankedPlayer(query);
      if (!player) {
        throw new UserFacingError(`No player found matching "${query}".`);
      }

      const updated = db[dbMethod](player.name, amount);
      return commandResult(
        `✅ ${label} updated`,
        `**${player.name}** now has **${updated[field]}** ${label} (${amount >= 0 ? "added" : "removed"} ${Math.abs(amount)}).`,
      );
    },
  };
}

module.exports = { createAddStatCommand };
