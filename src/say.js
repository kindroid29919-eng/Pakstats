// Terminal "send as bot" tool — type a message in your terminal and it
// gets posted to a Discord channel as the bot account.
//
// Usage:
//   One-off message:
//     node src/say.js <channelId> Your message here
//     npm run say -- <channelId> Your message here
//
//   Interactive mode (keeps the connection open, type as many messages
//   as you want, one per line, Ctrl+C to quit):
//     node src/say.js <channelId>
//     npm run say -- <channelId>
//
// Requires DISCORD_TOKEN in the environment. The bot must already be a
// member of the server that channel belongs to, with permission to send
// messages there.
//
// How to get a channel ID: in Discord, enable Settings > Advanced >
// Developer Mode, then right-click the channel > Copy Channel ID.

const readline = require('readline');
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');

function printUsageAndExit() {
  console.error('Usage: node src/say.js <channelId> [message...]');
  console.error('If no message is given, enters interactive mode (type lines, Ctrl+C to quit).');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) printUsageAndExit();

  const channelId = args[0];
  if (!/^\d{15,25}$/.test(channelId)) {
    console.error(`"${channelId}" doesn't look like a valid Discord channel ID.`);
    process.exit(1);
  }

  const oneOffMessage = args.slice(1).join(' ');

  if (!config.token) {
    console.error('Missing DISCORD_TOKEN in environment.');
    process.exit(1);
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    let channel;
    try {
      channel = await client.channels.fetch(channelId);
    } catch (err) {
      console.error('❌ Could not find that channel (check the ID and that the bot is in that server):', err.message || err);
      client.destroy();
      process.exitCode = 1;
      return;
    }
    if (!channel || !channel.isTextBased()) {
      console.error('❌ That channel is not a text channel the bot can send messages in.');
      client.destroy();
      process.exitCode = 1;
      return;
    }

    // One-off mode: send a single message, then exit.
    if (oneOffMessage) {
      try {
        await channel.send(oneOffMessage);
        console.log(`✅ Sent to #${channel.name || channelId}.`);
      } catch (err) {
        console.error('❌ Failed to send message:', err.message || err);
        process.exitCode = 1;
      } finally {
        client.destroy();
      }
      return;
    }

    // Interactive mode: keep the connection open, send each typed line.
    console.log(`Connected as ${client.user.tag}. Sending to #${channel.name || channelId}.`);
    console.log('Type a message and press Enter to send it. Ctrl+C to quit.');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
    rl.prompt();

    rl.on('line', async (line) => {
      const text = line.trim();
      if (text) {
        try {
          await channel.send(text);
        } catch (err) {
          console.error('❌ Failed to send:', err.message || err);
        }
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\nDisconnecting.');
      client.destroy();
      process.exit(0);
    });
  });

  await client.login(config.token);
}

main();
