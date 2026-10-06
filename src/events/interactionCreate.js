const { Events, InteractionType } = require("discord.js");
const { slashCommandMap } = require("../commands/slash");
const { UserFacingError, describeDiscordError } = require("../utils/errors");
const {
  EMBED_COLORS,
  commandResult,
  replyToInteraction,
} = require("../utils/responses");

function registerInteractionCreateEvent(client, db) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (
      interaction.type !== InteractionType.ApplicationCommand ||
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    const command = slashCommandMap.get(interaction.commandName);
    if (!command) return;

    try {
      const result = await command.execute(interaction, { client, db });
      if (
        result &&
        (typeof result === "string" || typeof result === "object")
      ) {
        await replyToInteraction(
          interaction,
          typeof result === "string"
            ? commandResult("Configuration updated", result, EMBED_COLORS.info)
            : result,
        );
      }
    } catch (error) {
      if (error instanceof UserFacingError) {
        await replyToInteraction(
          interaction,
          commandResult(
            "⚠️ Configuration error",
            error.message,
            EMBED_COLORS.error,
          ),
        ).catch(() => {});
        return;
      }
      console.error(`[slash:${interaction.commandName}]`, error);
      await replyToInteraction(
        interaction,
        commandResult(
          "⚠️ Configuration error",
          describeDiscordError(error),
          EMBED_COLORS.error,
        ),
      ).catch(() => {});
    }
  });
}

module.exports = { registerInteractionCreateEvent };
