const test = require("node:test");
const assert = require("node:assert/strict");
const { createDatabase } = require("./database");

test("updates a role and optional nickname decorations together", () => {
  const db = createDatabase(":memory:");

  try {
    db.setFields("guild-a", {
      nick_role_id: "member-role",
      nick_prefix: "PAK • ",
      nick_suffix: " ♛",
    });

    assert.deepEqual(db.getGuild("guild-a"), {
      guildId: "guild-a",
      vsRoleId: null,
      authorizedRoleIds: [],
      nickRoleId: "member-role",
      nickPrefix: "PAK • ",
      nickSuffix: " ♛",
      eaRoleId: null,
      eaPrefix: null,
      eaSuffix: null,
    });
  } finally {
    db.close();
  }
});
