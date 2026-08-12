# Pak Stats — Discord Bot

A small, private Discord bot that tracks stats for up to 16 players.

## Commands

The prefix is **`pak `** (the word "pak" followed by a space), case-insensitive.

| Command | Who | Description |
|---|---|---|
| `pak stats <player>` | anyone | Show a player's stats (picture, wins, TW, strengths, weaknesses, rating, rank) |
| `pak roster` | anyone | Show the full team roster, ranked by wins |
| `pak addwins <player> <amount>` | owner only | Add wins to a player (use a negative number to subtract) |
| `pak addtw <player> <amount>` | owner only | Add teamwork points to a player |
| `pak help` | anyone | List commands |

Player name matching is case-insensitive and also matches on a partial name
(e.g. `pak stats sam` will match "Samuel" if no one else starts with "sam").

**Rating** = `wins * RATING_WIN_WEIGHT + tw * RATING_TW_WEIGHT` (weights are
configurable, default win=2, tw=1). It recalculates automatically any time
wins or TW change — it isn't stored, it's computed on the fly.

**Rank** = position among all 16 players sorted by Wins (ties broken by TW,
then name). Also recalculated automatically, never stored.

## Project layout

```
pak-stats-bot/
├── players.seed.json      ← EDIT THIS: names, strengths, weaknesses, image filenames
├── assets/
│   ├── players/            ← put the 16 player pictures here
│   │   ├── player01.png
│   │   ├── ...
│   │   └── player16.png
│   └── roster.png          ← the full-roster picture
├── data/                    ← SQLite database lives here (wins/TW only)
└── src/                     ← bot code
```

### Editing player data

Open `players.seed.json` and fill in each of the 16 entries:

```json
{
  "name": "Real Player Name",
  "image": "player01.png",
  "strengths": ["Fast rotations", "Great callouts"],
  "weaknesses": ["Inconsistent aim"]
}
```

- `image` must match a filename you drop into `assets/players/`.
- Wins and TW are **not** in this file — they live in the SQLite database and
  are only changed with `pak addwins` / `pak addtw`, starting at 0 for every
  player.
- The roster image goes at `assets/roster.png`.

> Note: this file seeds each player's name/image/strengths/weaknesses on
> every startup and is matched by name against the database. If you rename a
> player after they already have wins/TW recorded, the database won't find a
> match under the old name and will start that "new" name at 0. Renaming is
> safe before you've recorded any stats.

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN` — from the [Discord Developer Portal](https://discord.com/developers/applications)
   - `OWNER_IDS` — your Discord user ID (comma-separated if more than one owner)
3. In the Developer Portal, under your bot's **Bot** settings, enable the
   **Message Content Intent** (required to read `pak ...` commands).
4. Run it:
   ```
   npm start
   ```

## Deploying to Railway

1. Push this project to a GitHub repo and create a new Railway project from it.
2. In Railway, add a **Volume** to the service (e.g. mount path `/data`).
3. Set environment variables on the Railway service:
   - `DISCORD_TOKEN`
   - `OWNER_IDS`
   - `DB_PATH=/data/pakstats.db` (must point inside the mounted volume so the
     database survives redeploys)
   - optionally `RATING_WIN_WEIGHT` / `RATING_TW_WEIGHT`
4. Railway will detect the Node app from `package.json` and run `npm start`
   automatically.
5. Make sure `assets/players/*.png` and `assets/roster.png` are committed to
   the repo — they ship with the code, no external image hosting is used.

## Inviting the bot

Generate an invite URL in the Developer Portal (OAuth2 → URL Generator) with
the `bot` scope and at minimum the **Send Messages**, **Embed Links**, and
**Attach Files** permissions, plus **Read Message History** if you want it to
work smoothly in threads/channels with history.

## Notes on data storage

- Only **wins** and **TW** are stored in SQLite (`data/pakstats.db` locally,
  or the Railway Volume path in production). Everything else (name, picture,
  strengths, weaknesses) is static and lives in `players.seed.json` +
  `assets/`, so it's easy to hand-edit without touching a database.
- Max 16 players is enforced by convention (the seed file); the bot will warn
  in the logs if you add more than 16 entries but won't hard-block it.
