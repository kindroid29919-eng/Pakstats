const test = require("node:test");
const assert = require("node:assert/strict");
const { slashCommands } = require("./index");

test("configuration commands serialize as one manager-only /config command", () => {
  const serialized = slashCommands.map(({ data }) => data.toJSON());
  const byName = new Map(serialized.map((command) => [command.name, command]));

  assert.deepEqual([...byName.keys()], ["config"]);
  const config = byName.get("config");
  assert.deepEqual(
    config.options.map((option) => option.name),
    ["set", "authorize", "deauthorize", "authorized", "show"],
  );
  const set = config.options[0];
  assert.deepEqual(
    set.options.map((option) => option.name),
    ["system", "role", "prefix", "suffix"],
  );
  assert.deepEqual(
    set.options.map((option) => option.required ?? false),
    [true, true, false, false],
  );
  assert.deepEqual(
    set.options[0].choices.map((choice) => choice.value),
    ["vs", "nick", "ea"],
  );
  assert.equal(set.options[1].type, 8);
  assert.equal(set.options[2].max_length, 100);
  assert.equal(set.options[3].max_length, 100);
  assert.ok(serialized.every((command) => command.default_member_permissions));
});
