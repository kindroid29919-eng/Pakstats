const { buildRosterEmbed } = require("../../utils/embeds");

module.exports = {
  name: "roster",
  async execute({ message, players, config }) {
    const { embeds, files } = buildRosterEmbed(
      players.getRankedPlayers(),
      config.rosterImagePath,
      "roster.png",
    );
    await message.reply({
      embeds,
      files,
      allowedMentions: { parse: [], repliedUser: false },
    });
    return null;
  },
};
