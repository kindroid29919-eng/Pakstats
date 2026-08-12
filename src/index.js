const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const { addWins, addTW } = require('./db');
const { getRankedPlayers, findRankedPlayer, findRankedPlayerByDiscordId } = require('./players');
const { buildPlayerEmbed, buildRosterEmbed } = require('./utils/embeds');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'players');
const ROSTER_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'roster.png');
const ROSTER_IMAGE_NAME = 'roster.png';

if (!config.token) {
  console.error('Missing DISCORD_TOKEN in environment. Set it in .env or Railway variables.');
  process.exit(1);
}

if (config.ownerIds.length === 0) {
  console.warn('Warning: OWNER_IDS is empty. Owner-only commands will be unusable by anyone.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`Pak Stats bot logged in as ${client.user.tag}`);
});

function isOwner(userId) {
  return config.ownerIds.includes(userId);
}

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;

    const content = message.content;
    // Prefix must be exactly "pak " (case-insensitive), with a space after it.
    if (content.length < config.prefix.length) return;
    if (content.slice(0, config.prefix.length).toLowerCase() !== config.prefix) return;

    const rest = content.slice(config.prefix.length).trim();
    if (!rest) return;

    const parts = rest.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'stats':
        await handleStats(message, args);
        break;
      case 'roster':
        await handleRoster(message);
        break;
      case 'addwins':
        await handleAddWins(message, args);
        break;
      case 'addtw':
        await handleAddTW(message, args);
        break;
      case 'help':
        await handleHelp(message);
        break;
      default:
        // Unknown command under the "pak " prefix — ignore silently.
        break;
    }
  } catch (err) {
    console.error('Error handling message:', err);
    message.reply('Something went wrong running that command.').catch(() => {});
  }
});

async function handleStats(message, args) {
  // "pak stats" with no name -> look up the caller by their Discord ID.
  if (args.length === 0) {
    const player = findRankedPlayerByDiscordId(message.author.id);
    if (!player) {
      return message.reply("You are not in team Pak's active roster.");
    }
    const { embeds, files } = buildPlayerEmbed(player, ASSETS_DIR);
    return message.reply({ embeds, files });
  }

  // "pak stats <name>" -> look up any player by name.
  const query = args.join(' ');
  const player = findRankedPlayer(query);
  if (!player) {
    return message.reply(`No player found matching "${query}".`);
  }
  const { embeds, files } = buildPlayerEmbed(player, ASSETS_DIR);
  return message.reply({ embeds, files });
}

async function handleRoster(message) {
  const ranked = getRankedPlayers();
  const { embeds, files } = buildRosterEmbed(ranked, ROSTER_IMAGE_PATH, ROSTER_IMAGE_NAME);
  return message.reply({ embeds, files });
}

async function handleAddWins(message, args) {
  if (!isOwner(message.author.id)) {
    return message.reply('Only the bot owner can use this command.');
  }
  if (args.length < 2) {
    return message.reply('Usage: `pak addwins <player name> <amount>`');
  }
  const amount = Number(args[args.length - 1]);
  const name = args.slice(0, -1).join(' ');
  if (!Number.isFinite(amount)) {
    return message.reply('Amount must be a number.');
  }
  const player = findRankedPlayer(name);
  if (!player) {
    return message.reply(`No player found matching "${name}".`);
  }
  const updated = addWins(player.name, amount);
  return message.reply(`✅ ${player.name} wins updated: **${updated.wins}** (added ${amount}).`);
}

async function handleAddTW(message, args) {
  if (!isOwner(message.author.id)) {
    return message.reply('Only the bot owner can use this command.');
  }
  if (args.length < 2) {
    return message.reply('Usage: `pak addtw <player name> <amount>`');
  }
  const amount = Number(args[args.length - 1]);
  const name = args.slice(0, -1).join(' ');
  if (!Number.isFinite(amount)) {
    return message.reply('Amount must be a number.');
  }
  const player = findRankedPlayer(name);
  if (!player) {
    return message.reply(`No player found matching "${name}".`);
  }
  const updated = addTW(player.name, amount);
  return message.reply(`✅ ${player.name} TW updated: **${updated.tw}** (added ${amount}).`);
}

async function handleHelp(message) {
  return message.reply(
    [
      '**Pak Stats Commands**',
      '`pak stats` — Show your own stats (matched by your Discord ID)',
      "`pak stats <player>` — Show another player's stats by name",
      '`pak roster` — Show the full team roster',
      '`pak addwins <player> <amount>` — (owner only) Add wins',
      '`pak addtw <player> <amount>` — (owner only) Add teamwork',
    ].join('\n')
  );
}

client.login(config.token);
