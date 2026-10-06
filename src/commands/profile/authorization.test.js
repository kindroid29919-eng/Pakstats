const test = require("node:test");
const assert = require("node:assert/strict");
const vs = require("./vs");
const vsrm = require("./vsrm");
const vsrall = require("./vsrall");

for (const command of [vs, vsrm, vsrall]) {
  test(`.${command.name} denies callers without an authorized VS role`, async () => {
    const message = {
      guild: { id: "guild-id" },
      member: { roles: { cache: { has: () => false } } },
    };
    const db = {
      getGuild: () => ({
        authorizedRoleIds: ["staff-role"],
        vsRoleId: "vs-role",
      }),
    };

    await assert.rejects(command.execute({ message, db }), /not authorized/u);
  });
}

for (const targetCase of [
  { name: "server owner", memberId: "owner-id", ownerId: "owner-id" },
  {
    name: "member above the bot",
    memberId: "senior-id",
    ownerId: "different-owner-id",
  },
]) {
  test(`.vs attempts role changes for the ${targetCase.name}`, async () => {
    const role = { id: "vs-role", managed: false };
    let roleAddCalls = 0;
    const target = {
      id: targetCase.memberId,
      user: { username: targetCase.name },
      roles: {
        cache: { has: () => false },
        add: async () => {
          roleAddCalls += 1;
          throw Object.assign(new Error("Discord refused the role update"), {
            code: 50013,
          });
        },
      },
    };
    const message = {
      guild: {
        id: "guild-id",
        ownerId: targetCase.ownerId,
        roles: { cache: new Map([[role.id, role]]) },
        members: {
          me: {
            id: "bot-id",
            permissions: { has: () => true },
            roles: { highest: { comparePositionTo: () => 1 } },
          },
          fetch: async () => target,
        },
      },
      member: {
        roles: { cache: { has: (roleId) => roleId === "staff-role" } },
      },
      mentions: { users: new Map([[target.id, { id: target.id }]]) },
      author: { tag: "authorized-moderator" },
    };
    const db = {
      getGuild: () => ({
        authorizedRoleIds: ["staff-role"],
        vsRoleId: role.id,
      }),
    };

    const result = await vs.execute({ message, db });

    assert.equal(roleAddCalls, 1);
    assert.match(result.description, /Could not assign/u);
  });
}
