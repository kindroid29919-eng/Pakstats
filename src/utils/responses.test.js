const test = require("node:test");
const assert = require("node:assert/strict");
const { EMBED_COLORS, commandResult, createBotEmbed } = require("./responses");

test("bot embeds share the Team Pakistan author, footer, and success color", () => {
  const embed = createBotEmbed(
    {
      user: {
        username: "Team Pakistan",
        displayAvatarURL: () => "https://example.com/bot-avatar.png",
      },
    },
    commandResult("🏷️ Role Assignment Results", "✅ Assigned to: @member"),
  ).toJSON();

  assert.equal(embed.color, EMBED_COLORS.success);
  assert.equal(embed.author.name, "Team Pakistan");
  assert.equal(embed.author.icon_url, "https://example.com/bot-avatar.png");
  assert.equal(embed.title, "🏷️ Role Assignment Results");
  assert.equal(embed.footer.text, "Managing Team Pak • Made by ahxdr07");
  assert.ok(embed.timestamp);
});

test("embed results can use a separate warning color", () => {
  const embed = createBotEmbed(
    null,
    commandResult(
      "⚠️ Command failed",
      "Discord rejected the operation.",
      EMBED_COLORS.error,
    ),
  ).toJSON();

  assert.equal(embed.color, EMBED_COLORS.error);
});
