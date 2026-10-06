const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DISCORD_NICKNAME_LIMIT,
  buildDisplayNickname,
  characterCount,
} = require("./nickname");

test("applies an optional prefix and suffix with one separator", () => {
  assert.equal(
    buildDisplayNickname("Ahad", { prefix: "FL |", suffix: "EZ" }),
    "FL | Ahad EZ",
  );
  assert.equal(buildDisplayNickname("Ahad", { prefix: null, suffix: "EZ" }), "Ahad EZ");
  assert.equal(buildDisplayNickname("Ahad", { prefix: "FL |", suffix: null }), "FL | Ahad");
  assert.equal(buildDisplayNickname("Ahad", { prefix: null, suffix: null }), "Ahad");
});

test("truncates the nickname base to Discord's 32-character limit", () => {
  const nickname = buildDisplayNickname("x".repeat(60), {
    prefix: "FL |",
    suffix: "EZ",
  });
  assert.equal(characterCount(nickname), DISCORD_NICKNAME_LIMIT);
  assert.ok(nickname.startsWith("FL | "));
  assert.ok(nickname.endsWith(" EZ"));
});

test("counts Unicode code points and rejects decorations that leave no nickname room", () => {
  const nickname = buildDisplayNickname("Ahad".repeat(30), {
    prefix: "✨",
    suffix: "✓",
  });
  assert.equal(characterCount(nickname), DISCORD_NICKNAME_LIMIT);
  assert.throws(
    () => buildDisplayNickname("Name", { prefix: "x".repeat(31), suffix: "y" }),
    /leave no room/u,
  );
});