const { EMOJIS, MAP_EMOJI, RAW_MAP_ALIASES, COUNTRIES } = require('./vsData');

const CLOSING_LINE = 'Pakistan zindabad 🇵🇰 ';

// Build a normalized alias lookup once: strip everything but letters/digits
// and lowercase, so "Space Race", "space", "SR", "s r" etc. all resolve.
const MAP_LOOKUP = {};
for (const [alias, canonical] of Object.entries(RAW_MAP_ALIASES)) {
  MAP_LOOKUP[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = canonical;
}

function resolveMap(token) {
  const key = token.toLowerCase().replace(/[^a-z0-9]/g, '');
  return MAP_LOOKUP[key] || null;
}

function resolveTeam(rawName) {
  const key = rawName.trim().toLowerCase();
  const country = COUNTRIES[key];
  if (country) {
    return {
      name: country.display,
      flag: country.flag,
      continent: country.continent,
      display: `${country.display} ${country.flag}`,
    };
  }
  const name = rawName.trim();
  return { name, flag: null, continent: null, display: name };
}

const LABEL_REGEX = /^(teams?|vs|score|cup|number|#|vsnum|mvp|note|region)\s*:\s*(.+)$/i;

// Parses the raw multi-line text that follows "pak vs" into structured
// data, or returns { error } if something mandatory is missing/invalid.
function parseVsInput(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const fields = {};
  const resultLines = [];

  for (const line of lines) {
    const match = line.match(LABEL_REGEX);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key === 'team' || key === 'teams' || key === 'vs') fields.teams = value;
      else if (key === '#' || key === 'vsnum') fields.number = value;
      else fields[key] = value;
    } else {
      resultLines.push(line);
    }
  }

  if (!fields.teams) {
    return { error: 'Missing team info. Add a line like: `teams: Pakistan vs Japan`' };
  }
  const teamParts = fields.teams.split(/\s+vs\s+/i);
  if (teamParts.length !== 2) {
    return { error: 'Could not parse teams. Use: `teams: TeamA vs TeamB`' };
  }
  const teamA = resolveTeam(teamParts[0]);
  const teamB = resolveTeam(teamParts[1]);

  if (!fields.score) {
    return { error: 'Missing score. Add a line like: `score: 4-6`' };
  }

  const cupLine = fields.cup || 'Friendly Vs';

  let region = fields.region || null;
  if (!region && teamA.continent && teamB.continent) {
    region = teamA.continent === teamB.continent ? `${teamA.continent} Only` : 'International';
  }

  let explicitNumber = null;
  if (fields.number) {
    const n = parseInt(String(fields.number).replace('#', '').trim(), 10);
    if (Number.isFinite(n)) explicitNumber = n;
  }

  const order = [];
  const playerMaps = new Map(); // lowercase name -> { display, emojis: [] }
  const warnings = [];

  for (const line of resultLines) {
    const tokens = line.split(/\s+/);
    if (tokens.length < 2) {
      warnings.push(`Couldn't parse line: "${line}"`);
      continue;
    }
    const playerSpec = tokens[0];
    const mapTokens = tokens.slice(1).filter((t) => !/^x\d+$/i.test(t));
    const players = playerSpec
      .split('/')
      .map((p) => p.trim())
      .filter(Boolean);

    const resolvedEmojis = [];
    for (const mt of mapTokens) {
      const canonical = resolveMap(mt);
      if (!canonical) {
        warnings.push(`Unknown map "${mt}" on line: "${line}"`);
        continue;
      }
      resolvedEmojis.push(MAP_EMOJI[canonical]);
    }

    for (const p of players) {
      const key = p.toLowerCase();
      if (!playerMaps.has(key)) {
        playerMaps.set(key, { display: p, emojis: [] });
        order.push(key);
      }
      playerMaps.get(key).emojis.push(...resolvedEmojis);
    }
  }

  if (order.length === 0) {
    return { error: 'No player/map result lines found, e.g. `Zekey ps sr`' };
  }

  const playerLines = order.map((key) => {
    const p = playerMaps.get(key);
    return `${p.display} ${p.emojis.join(' ')}`.trim();
  });

  return {
    teamA,
    teamB,
    score: fields.score,
    cupLine,
    region,
    explicitNumber,
    playerLines,
    mvp: fields.mvp || null,
    note: fields.note || null,
    warnings,
  };
}

// Builds the final plain-text (non-embed) Discord message, preserving the
// exact spacing/markdown structure of the reference example.
function buildVsMessage(parsed, vsNumber) {
  const lines = [];
  lines.push('||@everyone||');
  lines.push(`**Vs #${vsNumber}`);
  lines.push(`⚔️ | ${parsed.teamA.display} vs ${parsed.teamB.display}`);
  if (parsed.region) lines.push(`🌏 | ${parsed.region}`);
  lines.push(`🏆| ${parsed.cupLine}`);
  lines.push(`${EMOJIS.SWORDS} | ${parsed.score}`);
  lines.push('');

  const bracketed = parsed.playerLines.map((text, i) => {
    let line = `${EMOJIS.CROWN_PAK} | ${text}`;
    if (i === 0) line = '«' + line;
    if (i === parsed.playerLines.length - 1) line = line + '»';
    return line;
  });
  lines.push(...bracketed);

  if (parsed.mvp || parsed.note) {
    lines.push('');
    if (parsed.mvp) lines.push(`${EMOJIS.PAK_CROWN} :- ${parsed.mvp}`);
    if (parsed.note) lines.push(`${EMOJIS.NOTE} :- ${parsed.note}`);
  }

  lines.push('');
  lines.push(`__${CLOSING_LINE}__**`);

  return lines.join('\n');
}

module.exports = { parseVsInput, buildVsMessage };
