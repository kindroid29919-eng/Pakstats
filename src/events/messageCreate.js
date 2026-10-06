const { Events } = require("discord.js");
const { PREFIX } = require("../config");
const { UserFacingError, describeDiscordError } = require("../utils/errors");
const {
  EMBED_COLORS,
  commandResult,
  replyToMessage,
} = require("../utils/responses");

// Every command is triggered with the single "." prefix.
const prefixCommands = [
  // Role / nickname tools
  require("../commands/prefix/vs"),
  require("../commands/prefix/vsrm"),
  require("../commands/prefix/vsrall"),
  require("../commands/prefix/nick"),
  require("../commands/prefix/ea"),
  // Stats + match results
  require("../commands/prefix/stats"),
  require("../commands/prefix/roster"),
  require("../commands/prefix/addwins"),
  require("../commands/prefix/addtw"),
  require("../commands/prefix/result"),
  require("../commands/prefix/help"),
];

const prefixCommandMap = new Map(
  prefixCommands.map((command) => [command.name, command]),
);

function registerMessageCreateEvent(client, db, services) {
  client.on(Events.MessageCreate, async (message) => {
    if (
      message.author.bot ||
      !message.guild ||
      !message.content.startsWith(PREFIX)
    ) {
      return;
    }

    const [commandName] = message.content
      .slice(PREFIX.length)
      .trim()
      .split(/\s+/u);
    const command = prefixCommandMap.get(commandName?.toLowerCase());
    if (!command) return;

    try {
      const result = await command.execute({
        message,
        client,
        db,
        prefix: PREFIX,
        ...services, // { config, players }
      });
      if (
        result &&
        (typeof result === "string" || typeof result === "object")
      ) {
        await replyToMessage(
          message,
          typeof result === "string"
            ? commandResult("Command complete", result, EMBED_COLORS.info)
            : result,
        );
      }
    } catch (error) {
      if (error instanceof UserFacingError) {
        await replyToMessage(
          message,
          commandResult("⚠️ Command failed", error.message, EMBED_COLORS.error),
        ).catch(() => {});
        return;
      }
      console.error(`[command:${command.name}]`, error);
      await replyToMessage(
        message,
        commandResult(
          "⚠️ Command failed",
          describeDiscordError(error),
          EMBED_COLORS.error,
        ),
      ).catch(() => {});
    }
  });
}

module.exports = { registerMessageCreateEvent, prefixCommands };
