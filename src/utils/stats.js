const { UserFacingError } = require("../../utils/errors");
const { getCommandBody } = require("../../utils/args");
const { buildPlayerEmbed } = require("../../utils/embeds");

module.exports = {
  name: "stats",
  async execute({ message, prefix, players, config }) {
    const query = getCommandBody(message, prefix);

    let player;
    if (!query) {
      // ".stats" with no name -> the caller's own card, matched by Discord ID.
      player = players.findRankedPlayerByDiscordId(message.author.id);
      if (!player) {
        throw new UserFacingError("You are not in team Pak's active roster.");
      }
    } else {
      player = players.findRankedPlayer(query);
      if (!player) {
        throw new UserFacingError(`No player found matching "${query}".`);
      }
    }

    const { embeds, files } = buildPlayerEmbed(player, config.assetsDir);
    await message.reply({
      embeds,
      files,
      allowedMentions: { parse: [], repliedUser: false },
    });
    return null;
  },
};
