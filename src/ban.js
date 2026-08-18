// Terminal ban tool — run this directly on the machine hosting the bot
// (locally, or in a Railway shell) instead of typing "pak ban <id>" in Discord.
//
// Usage:
//   node src/ban.js <userId> [reason...]
//   node src/ban.js <userId> --unban
//
// Examples:
//   node src/ban.js 123456789012345678 Spamming links
//   npm run ban -- 123456789012345678 Spamming links
//
// Requires DISCORD_TOKEN and GUILD_ID to be set (.env locally, or Railway
// service variables). The bot must have the "Ban Members" permission in
// that server.

const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');

function printUsageAndExit() {
  console.error('Usage: node src/ban.js <userId> [reason...]');
  console.error('       node src/ban.js <userId> --unban');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) printUsageAndExit();

  const userId = args[0];
  if (!/^\d{15,25}$/.test(userId)) {
    console.error(`"${userId}" doesn't look like a valid Discord user ID.`);
    process.exit(1);
  }

  const isUnban = args.includes('--unban');
  const reason = args
    .slice(1)
    .filter((a) => a !== '--unban')
    .join(' ') || 'Banned via terminal';

  if (!config.token) {
    console.error('Missing DISCORD_TOKEN in environment.');
    process.exit(1);
  }
  if (!config.guildId) {
    console.error('Missing GUILD_ID in environment. Set it to the server ID you want to moderate.');
    process.exit(1);
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    try {
      const guild = await client.guilds.fetch(config.guildId);

      if (isUnban) {
        await guild.bans.remove(userId, 'Unbanned via terminal');
        console.log(`✅ Unbanned user ${userId} from ${guild.name}.`);
      } else {
        await guild.bans.create(userId, { reason });
        console.log(`✅ Banned user ${userId} from ${guild.name}. Reason: ${reason}`);
      }
    } catch (err) {
      console.error('❌ Failed to update ban status:', err.message || err);
      process.exitCode = 1;
    } finally {
      client.destroy();
    }
  });

  await client.login(config.token);
}

main();
