const test = require("node:test");
const assert = require("node:assert/strict");
const { hasConfiguredVsRole } = require("./permissions");

test("VS access requires at least one explicitly authorized member role", () => {
  const member = {
    roles: {
      cache: {
        has: (roleId) => roleId === "moderator-role",
      },
    },
  };
  assert.equal(hasConfiguredVsRole(member, ["moderator-role"]), true);
  assert.equal(hasConfiguredVsRole(member, ["another-role"]), false);
  assert.equal(hasConfiguredVsRole(member, []), false);
});