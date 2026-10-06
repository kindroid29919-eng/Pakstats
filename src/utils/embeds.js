const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const path = require("node:path");
const fs = require("node:fs");

function buildPlayerEmbed(player, assetsDir) {
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${player.name}`)
    .setColor(0x2b6cb0)
    .setDescription(
      [
        `**Rank:** #${player.rank}  •  **Rating:** ${player.rating}`,
        `**Wins:** ${player.wins}`,
        `**Teamwork:** ${player.tw}`,
      ].join("\n"),
    );

  const files = [];
  if (player.image) {
    const imagePath = path.join(assetsDir, player.image);
    if (fs.existsSync(imagePath)) {
      const attachment = new AttachmentBuilder(imagePath, { name: player.image });
      embed.setThumbnail(`attachment://${player.image}`);
      files.push(attachment);
    }
  }

  return { embeds: [embed], files };
}

function buildRosterEmbed(rankedPlayers, rosterImagePath, rosterImageName) {
  const embed = new EmbedBuilder()
    .setTitle("🏆 Team Roster — Pak Stats")
    .setColor(0x2b6cb0)
    .setDescription(
      rankedPlayers
        .map(
          (p) =>
            `**#${p.rank} ${p.name}** — Rating: ${p.rating} (Wins: ${p.wins}, TW: ${p.tw})`,
        )
        .join("\n"),
    );

  const files = [];
  if (rosterImagePath && fs.existsSync(rosterImagePath)) {
    const attachment = new AttachmentBuilder(rosterImagePath, {
      name: rosterImageName,
    });
    embed.setImage(`attachment://${rosterImageName}`);
    files.push(attachment);
  }

  return { embeds: [embed], files };
}

module.exports = { buildPlayerEmbed, buildRosterEmbed };
