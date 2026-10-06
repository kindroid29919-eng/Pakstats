const { commandResult, EMBED_COLORS } = require("../../utils/responses");

module.exports = {
  name: "help",
  async execute({ prefix }) {
    const p = prefix;
    return commandResult(
      "📖 Team Pakistan Commands",
      [
        "**Stats**",
        `\`${p}stats\` — Your own stats (matched by your Discord ID)`,
        `\`${p}stats <player>\` — Another player's stats`,
        `\`${p}roster\` — Full roster, ranked by wins`,
        `\`${p}addwins <player> <amount>\` — (owner) Add wins`,
        `\`${p}addtw <player> <amount>\` — (owner) Add teamwork`,
        "",
        "**Match results**",
        `\`${p}result\` — Post a formatted match result (run it with no text for usage)`,
        "",
        "**VS role** (authorized roles only)",
        `\`${p}vs @members\` — Give the VS role to up to 16 members`,
        `\`${p}vsrm @member\` — Remove the VS role from one member`,
        `\`${p}vsrall\` — Remove the VS role from everyone`,
        "",
        "**Nicknames** (Manage Nicknames)",
        `\`${p}nick @member <nickname>\` — Nick role + nickname`,
        `\`${p}ea @member <nickname>\` — EA role + nickname`,
      ].join("\n"),
      EMBED_COLORS.info,
    );
  },
};
