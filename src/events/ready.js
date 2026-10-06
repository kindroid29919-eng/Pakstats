const { Events } = require("discord.js");
const { slashCommands } = require("../commands/slash");

function registerReadyEvent(client) {
  client.once(Events.ClientReady, async (readyClient) => {
    readyClient.user.setActivity("Team Pakistan");
    console.info(
      `[ready] Team Pakistan is online as ${readyClient.user.tag} in ${readyClient.guilds.cache.size} server(s).`,
    );

    // Keep the /config slash command registered (safe to repeat on every boot).
    try {
      await readyClient.application.commands.set(
        slashCommands.map((command) => command.data.toJSON()),
      );
      console.info("[ready] Slash commands registered.");
    } catch (error) {
      console.error("[ready] Could not register slash commands:", error.message);
    }
  });
}

module.exports = { registerReadyEvent };
