const { EmbedBuilder, MessageFlags } = require("discord.js");

const EMBED_COLORS = {
  success: 0x57f287,
  info: 0x5865f2,
  warning: 0xfee75c,
  error: 0xed4245,
};
const EMBED_FOOTER = "Managing Team Pak • Made by ahxdr07";

function commandResult(title, description, color = EMBED_COLORS.success) {
  return { title, description, color };
}

function createBotEmbed(client, result) {
  const payload =
    typeof result === "string"
      ? commandResult("Team Pakistan", result, EMBED_COLORS.info)
      : result;
  const embed = new EmbedBuilder()
    .setColor(payload.color ?? EMBED_COLORS.success)
    .setTitle(payload.title)
    .setDescription(payload.description)
    .setFooter({ text: EMBED_FOOTER })
    .setTimestamp();
  const user = client?.user;
  if (user) {
    embed.setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL(),
    });
  }
  return embed;
}

async function replyToMessage(message, result) {
  return message.reply({
    embeds: [createBotEmbed(message.client, result)],
    allowedMentions: { parse: [], repliedUser: false },
  });
}

async function replyToInteraction(interaction, result) {
  const options = {
    embeds: [createBotEmbed(interaction.client, result)],
    flags: MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  };
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(options);
  }
  return interaction.reply(options);
}

module.exports = {
  EMBED_COLORS,
  commandResult,
  createBotEmbed,
  replyToInteraction,
  replyToMessage,
};
