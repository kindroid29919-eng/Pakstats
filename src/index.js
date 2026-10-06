const { Client, Events, GatewayIntentBits } = require("discord.js");
const { getRuntimeConfig, persistenceWarnings } = require("./config");
const { createDatabase } = require("./database/database");
const { createPlayerService } = require("./stats/players");
const { registerReadyEvent } = require("./events/ready");
const { registerMessageCreateEvent } = require("./events/messageCreate");
const { registerInteractionCreateEvent } = require("./events/interactionCreate");
const seed = require("../players.seed.json");

async function start() {
  const config = getRuntimeConfig();
  const database = createDatabase(config.databasePath);

  console.info(`[db] Using database file: ${database.path}`);
  if (database.didZeroStats) {
    console.info("[db] One-time reset applied: all wins/TW set to 0.");
  }
  for (const warning of persistenceWarnings(config.databasePath)) {
    console.warn(`[db] WARNING: ${warning}`);
  }
  if (config.ownerIds.length === 0) {
    console.warn(
      "[config] OWNER_IDS is empty. .addwins and .addtw will be unusable by anyone.",
    );
  }

  const players = createPlayerService({
    db: database,
    seed,
    ratingWeights: config.ratingWeights,
  });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers, // privileged: enable "Server Members Intent"
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent, // privileged: enable "Message Content Intent"
    ],
  });

  registerReadyEvent(client);
  registerMessageCreateEvent(client, database, { config, players });
  registerInteractionCreateEvent(client, database);
  client.on(Events.Warn, (warning) => console.warn(`[discord] ${warning}`));
  client.on(Events.Error, (error) =>
    console.error("[discord] Client error:", error),
  );

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`[shutdown] Received ${signal}; closing the bot cleanly.`);
    client.destroy();
    database.close();
    process.exitCode = 0;
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await client.login(config.token);
  } catch (error) {
    database.close();
    throw error;
  }
}

if (require.main === module) {
  start().catch((error) => {
    console.error("[startup] Team Pakistan could not start:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { start };
