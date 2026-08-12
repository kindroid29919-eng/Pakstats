// Fixed custom emoji used in every "pak vs" result message.
const EMOJIS = {
  CROWN_PAK: '<:crown_pak:1375001270980706405>',
  PAK_CROWN: '<:PAK_Crown:1527300717566627912>',
  NOTE: '<:Note:1400395381950517339>',
  SWORDS: '<:swords:1501270294906671264>',
};

// Canonical map name -> custom emoji.
const MAP_EMOJI = {
  Space: '<:Space:1186927585746243595>',
  Cove: '<:cove:1186926417250877460>',
  Spingo: '<:Spingo:1373251724399345777>',
  Over: '<:over:1186927976458231870>',
  Cannon: '<:CannonClimb:1202495192477868143>',
  Super: '<:SuperSlide:1134796441508909056>',
  Paint: '<:paint:1186927918149013574>',
  Laser: '<:laser:1186926735393034300>',
  BD: '<:bd:1135909264288923708>',
  LD: '<:ld:1505539283786924064>',
  LavaLand: '<:LavaLand:1186927384822300712>',
  BotBash: '<:BotBash:1186994933249347654>',
  Bombardment: '<:Bombardment:1390003216946565131>',
};

// Every alias a player might type (full name, short name, abbreviation),
// normalized to lowercase with no spaces/punctuation, mapped to the
// canonical key used in MAP_EMOJI above.
const RAW_MAP_ALIASES = {
  paintsplash: 'Paint',
  paint: 'Paint',
  ps: 'Paint',

  spacerace: 'Space',
  space: 'Space',
  sr: 'Space',

  stumblecove: 'Cove',
  cove: 'Cove',
  sc: 'Cove',

  overandunder: 'Over',
  over: 'Over',
  ou: 'Over',

  spingoround: 'Spingo',
  spingo: 'Spingo',
  sgr: 'Spingo',

  cannonclimb: 'Cannon',
  cannon: 'Cannon',
  cc: 'Cannon',

  superslide: 'Super',
  super: 'Super',
  ss: 'Super',

  lasertracer: 'Laser',
  laser: 'Laser',
  lt: 'Laser',

  blockdash: 'BD',
  bd: 'BD',

  botbash: 'BotBash',
  bb: 'BotBash',

  lavaland: 'LavaLand',
  ll: 'LavaLand',

  bombardment: 'Bombardment',
  bomb: 'Bombardment',

  laserdash: 'LD',
  ld: 'LD',
};

// name/flag/continent lookup, keyed by lowercase country name. Add more
// entries here any time a new opponent country comes up.
const COUNTRIES = {
  pakistan: { display: 'Pakistan', flag: '🇵🇰', continent: 'Asia' },
  japan: { display: 'Japan', flag: '🇯🇵', continent: 'Asia' },
  india: { display: 'India', flag: '🇮🇳', continent: 'Asia' },
  china: { display: 'China', flag: '🇨🇳', continent: 'Asia' },
  'south korea': { display: 'South Korea', flag: '🇰🇷', continent: 'Asia' },
  'north korea': { display: 'North Korea', flag: '🇰🇵', continent: 'Asia' },
  bangladesh: { display: 'Bangladesh', flag: '🇧🇩', continent: 'Asia' },
  'sri lanka': { display: 'Sri Lanka', flag: '🇱🇰', continent: 'Asia' },
  nepal: { display: 'Nepal', flag: '🇳🇵', continent: 'Asia' },
  afghanistan: { display: 'Afghanistan', flag: '🇦🇫', continent: 'Asia' },
  iran: { display: 'Iran', flag: '🇮🇷', continent: 'Asia' },
  iraq: { display: 'Iraq', flag: '🇮🇶', continent: 'Asia' },
  'saudi arabia': { display: 'Saudi Arabia', flag: '🇸🇦', continent: 'Asia' },
  uae: { display: 'UAE', flag: '🇦🇪', continent: 'Asia' },
  'united arab emirates': { display: 'UAE', flag: '🇦🇪', continent: 'Asia' },
  qatar: { display: 'Qatar', flag: '🇶🇦', continent: 'Asia' },
  kuwait: { display: 'Kuwait', flag: '🇰🇼', continent: 'Asia' },
  bahrain: { display: 'Bahrain', flag: '🇧🇭', continent: 'Asia' },
  oman: { display: 'Oman', flag: '🇴🇲', continent: 'Asia' },
  turkey: { display: 'Turkey', flag: '🇹🇷', continent: 'Asia' },
  israel: { display: 'Israel', flag: '🇮🇱', continent: 'Asia' },
  jordan: { display: 'Jordan', flag: '🇯🇴', continent: 'Asia' },
  lebanon: { display: 'Lebanon', flag: '🇱🇧', continent: 'Asia' },
  syria: { display: 'Syria', flag: '🇸🇾', continent: 'Asia' },
  yemen: { display: 'Yemen', flag: '🇾🇪', continent: 'Asia' },
  indonesia: { display: 'Indonesia', flag: '🇮🇩', continent: 'Asia' },
  malaysia: { display: 'Malaysia', flag: '🇲🇾', continent: 'Asia' },
  singapore: { display: 'Singapore', flag: '🇸🇬', continent: 'Asia' },
  thailand: { display: 'Thailand', flag: '🇹🇭', continent: 'Asia' },
  vietnam: { display: 'Vietnam', flag: '🇻🇳', continent: 'Asia' },
  philippines: { display: 'Philippines', flag: '🇵🇭', continent: 'Asia' },
  myanmar: { display: 'Myanmar', flag: '🇲🇲', continent: 'Asia' },
  cambodia: { display: 'Cambodia', flag: '🇰🇭', continent: 'Asia' },
  laos: { display: 'Laos', flag: '🇱🇦', continent: 'Asia' },
  mongolia: { display: 'Mongolia', flag: '🇲🇳', continent: 'Asia' },
  kazakhstan: { display: 'Kazakhstan', flag: '🇰🇿', continent: 'Asia' },
  uzbekistan: { display: 'Uzbekistan', flag: '🇺🇿', continent: 'Asia' },

  'united kingdom': { display: 'United Kingdom', flag: '🇬🇧', continent: 'Europe' },
  uk: { display: 'United Kingdom', flag: '🇬🇧', continent: 'Europe' },
  england: { display: 'England', flag: '🏴', continent: 'Europe' },
  germany: { display: 'Germany', flag: '🇩🇪', continent: 'Europe' },
  france: { display: 'France', flag: '🇫🇷', continent: 'Europe' },
  italy: { display: 'Italy', flag: '🇮🇹', continent: 'Europe' },
  spain: { display: 'Spain', flag: '🇪🇸', continent: 'Europe' },
  portugal: { display: 'Portugal', flag: '🇵🇹', continent: 'Europe' },
  netherlands: { display: 'Netherlands', flag: '🇳🇱', continent: 'Europe' },
  belgium: { display: 'Belgium', flag: '🇧🇪', continent: 'Europe' },
  switzerland: { display: 'Switzerland', flag: '🇨🇭', continent: 'Europe' },
  austria: { display: 'Austria', flag: '🇦🇹', continent: 'Europe' },
  sweden: { display: 'Sweden', flag: '🇸🇪', continent: 'Europe' },
  norway: { display: 'Norway', flag: '🇳🇴', continent: 'Europe' },
  denmark: { display: 'Denmark', flag: '🇩🇰', continent: 'Europe' },
  finland: { display: 'Finland', flag: '🇫🇮', continent: 'Europe' },
  poland: { display: 'Poland', flag: '🇵🇱', continent: 'Europe' },
  russia: { display: 'Russia', flag: '🇷🇺', continent: 'Europe' },
  ukraine: { display: 'Ukraine', flag: '🇺🇦', continent: 'Europe' },
  greece: { display: 'Greece', flag: '🇬🇷', continent: 'Europe' },
  ireland: { display: 'Ireland', flag: '🇮🇪', continent: 'Europe' },
  iceland: { display: 'Iceland', flag: '🇮🇸', continent: 'Europe' },
  romania: { display: 'Romania', flag: '🇷🇴', continent: 'Europe' },
  hungary: { display: 'Hungary', flag: '🇭🇺', continent: 'Europe' },
  'czech republic': { display: 'Czech Republic', flag: '🇨🇿', continent: 'Europe' },
  serbia: { display: 'Serbia', flag: '🇷🇸', continent: 'Europe' },
  croatia: { display: 'Croatia', flag: '🇭🇷', continent: 'Europe' },

  egypt: { display: 'Egypt', flag: '🇪🇬', continent: 'Africa' },
  nigeria: { display: 'Nigeria', flag: '🇳🇬', continent: 'Africa' },
  'south africa': { display: 'South Africa', flag: '🇿🇦', continent: 'Africa' },
  kenya: { display: 'Kenya', flag: '🇰🇪', continent: 'Africa' },
  morocco: { display: 'Morocco', flag: '🇲🇦', continent: 'Africa' },
  algeria: { display: 'Algeria', flag: '🇩🇿', continent: 'Africa' },
  tunisia: { display: 'Tunisia', flag: '🇹🇳', continent: 'Africa' },
  ghana: { display: 'Ghana', flag: '🇬🇭', continent: 'Africa' },
  ethiopia: { display: 'Ethiopia', flag: '🇪🇹', continent: 'Africa' },

  usa: { display: 'USA', flag: '🇺🇸', continent: 'North America' },
  'united states': { display: 'USA', flag: '🇺🇸', continent: 'North America' },
  america: { display: 'USA', flag: '🇺🇸', continent: 'North America' },
  canada: { display: 'Canada', flag: '🇨🇦', continent: 'North America' },
  mexico: { display: 'Mexico', flag: '🇲🇽', continent: 'North America' },

  brazil: { display: 'Brazil', flag: '🇧🇷', continent: 'South America' },
  argentina: { display: 'Argentina', flag: '🇦🇷', continent: 'South America' },
  chile: { display: 'Chile', flag: '🇨🇱', continent: 'South America' },
  colombia: { display: 'Colombia', flag: '🇨🇴', continent: 'South America' },
  peru: { display: 'Peru', flag: '🇵🇪', continent: 'South America' },
  uruguay: { display: 'Uruguay', flag: '🇺🇾', continent: 'South America' },

  australia: { display: 'Australia', flag: '🇦🇺', continent: 'Oceania' },
  'new zealand': { display: 'New Zealand', flag: '🇳🇿', continent: 'Oceania' },
};

module.exports = { EMOJIS, MAP_EMOJI, RAW_MAP_ALIASES, COUNTRIES };
