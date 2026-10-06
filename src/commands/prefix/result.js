const { UserFacingError } = require("../../utils/errors");
const { getCommandBody } = require("../../utils/args");
const { parseVsInput, buildVsMessage } = require("../../stats/vsBuilder");

// Formerly "pak vs". Renamed to .result so that .vs can stay the VS-role command.
module.exports = {
  name: "result",
  async execute({ message, prefix, db }) {
    const rawText = getCommandBody(message, prefix);

    if (!rawText) {
      await message.reply({
        content: [
          "Usage:",
          "```",
          `${prefix}result`,
          "teams: Pakistan vs Japan",
          "score: 4-6",
          "cup: Asian Cup Federation",
          "number: 725",
          "Zekey ps sr",
          "Ahad sgr sc",
          "mvp: Ahad",
          "note: I play with tests and carry",
          "```",
          "`number:` is only needed the first time — after that it auto-increments.",
          '`cup:` is optional and defaults to "Friendly Vs".',
        ].join("\n"),
        allowedMentions: { parse: [], repliedUser: false },
      });
      return null;
    }

    const parsed = parseVsInput(rawText);
    if (parsed.error) throw new UserFacingError(parsed.error);

    let vsNumber;
    if (parsed.explicitNumber !== null) {
      vsNumber = parsed.explicitNumber;
    } else {
      const current = db.getVsCounter();
      if (current === null) {
        throw new UserFacingError(
          `No Vs number has been set yet. Include \`number: 725\` once to start the sequence — future results will auto-increment from there.`,
        );
      }
      vsNumber = current + 1;
    }
    db.setVsCounter(vsNumber);

    if (parsed.warnings && parsed.warnings.length > 0) {
      await message.channel.send({
        content: `⚠️ ${parsed.warnings.join("\n⚠️ ")}`,
        allowedMentions: { parse: [] },
      });
    }

    // Explicitly allow the @everyone mention so the ping actually fires
    // (requires the bot's "Mention @everyone" permission in the channel).
    await message.channel.send({
      content: buildVsMessage(parsed, vsNumber),
      allowedMentions: { parse: ["everyone"] },
    });
    return null;
  },
};
