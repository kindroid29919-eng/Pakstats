const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

function formatList(list) {
  if (!list || list.length === 0) return '—';
  return list.map((item) => `• ${item}`).join('\n');
}

function buildPlayerEmbed(player, assetsDir) {
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${player.name}`)
    .setColor(0x2b6cb0)
    .addFields(
      { name: 'Rank', value: `#${player.rank}`, inline: true },
      { name: 'Rating', value: `${player.rating}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Wins', value: `${player.wins}`, inline: true },
      { name: 'Teamwork (TW)', value: `${player.tw}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Strengths', value: formatList(player.strengths) },
      { name: 'Weaknesses', value: formatList(player.weaknesses) }
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
    .setTitle('🏆 Team Roster — Pak Stats')
    .setColor(0x2b6cb0)
    .setDescription(
      rankedPlayers
        .map((p) => `**#${p.rank} ${p.name}** — Rating: ${p.rating} (Wins: ${p.wins}, TW: ${p.tw})`)
        .join('\n')
    );

  const files = [];
  if (rosterImagePath && fs.existsSync(rosterImagePath)) {
    const attachment = new AttachmentBuilder(rosterImagePath, { name: rosterImageName });
    embed.setImage(`attachment://${rosterImageName}`);
    files.push(attachment);
  }

  return { embeds: [embed], files };
}

module.exports = { buildPlayerEmbed, buildRosterEmbed };
