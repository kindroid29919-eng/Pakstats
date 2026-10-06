# Team Pakistan Bot

One bot, one prefix (`.`). It combines the Pak Stats bot and the Team Pakistan
role-management bot.

## Commands

| Command | Who | What it does |
|---|---|---|
| `.stats` | anyone | Your own stats (matched by your Discord ID) |
| `.stats <player>` | anyone | Another player's stats (partial names work) |
| `.roster` | anyone | Full roster ranked by wins |
| `.addwins <player> <amount>` | owner (`OWNER_IDS`) | Add wins (negative to subtract) |
| `.addtw <player> <amount>` | owner (`OWNER_IDS`) | Add teamwork |
| `.result` | anyone | Post a formatted match result (was `pak vs`). Run with no text for usage |
| `.vs @members` | authorized roles | Give the VS role to up to 16 members |
| `.vsrm @member` | authorized roles | Remove the VS role from one member |
| `.vsrall` | authorized roles | Remove the VS role from everyone |
| `.nick @member <name>` | Manage Nicknames | Nick role + nickname |
| `.ea @member <name>` | Manage Nicknames | EA role + nickname |
| `.help` | anyone | List commands |

`/config` (slash command, Manage Server) sets the VS / Nick / EA roles,
nickname prefixes/suffixes, and which roles may use `.vs`, `.vsrm`, `.vsrall`.

**Rating** = `wins * RATING_WIN_WEIGHT + tw * RATING_TW_WEIGHT` (default 2 and 1),
computed live. **Rank** = position by wins (ties: TW, then name).

## Where data lives (read this before deploying)

Everything that changes at runtime is in **one SQLite file** (`DB_PATH`):
wins/TW, the `.result` number counter, and the role settings. Nothing is
re-seeded over it: `players.seed.json` only supplies names, Discord IDs and
image filenames, and its `wins`/`tw` values are used only the first time a
player is ever seen.

The one-time "set all wins/TW to 0" reset is recorded inside the database. It
runs once, then never again, so numbers you add with `.addwins`/`.addtw` are
kept across restarts and redeploys, **as long as the file itself survives**.

The file survives a redeploy only if it sits on persistent storage:

- **Railway:** add a Volume (mount path `/data`) and set
  `DB_PATH=/data/team-pakistan.sqlite`. If a Volume is attached and `DB_PATH` is
  unset, the bot uses the Volume automatically.
- **Replit:** deployments do not keep runtime-written files. Use Railway (or
  any host with a persistent disk) for the live bot.

On startup the log prints the database path and warns if it looks like it is
on throw-away storage.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill it in.
3. Developer Portal → Bot → enable **Message Content Intent** and
   **Server Members Intent**.
4. `npm start`. The `/config` command registers itself on boot (global
   commands can take a little while to appear the first time).
5. Run `/config set`, `/config authorize` so the role commands know what to use.

Player pictures go in `assets/players/` (filenames in `players.seed.json`),
the roster picture at `assets/roster.png`. Missing images are skipped.

## Tools

- `npm test` runs the tests.
- `npm run ban -- <userId> [reason]` / `--unban` (needs `GUILD_ID`).
- `npm run say -- <channelId> [message]` posts as the bot.
