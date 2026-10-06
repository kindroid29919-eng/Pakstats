const { UserFacingError } = require("../../utils/errors");
const { hasConfiguredVsRole } = require("../../utils/permissions");
const {
  assertRoleAssignable,
  requireConfiguredRole,
} = require("../../utils/roles");
const {
  getUniqueMentionedUsers,
  resolveMentionedMembers,
} = require("../../utils/members");
const { commandResult, EMBED_COLORS } = require("../../utils/responses");

module.exports = {
  name: "vsrm",
  async execute({ message, db }) {
    const config = db.getGuild(message.guild.id);
    if (
      !message.member ||
      !hasConfiguredVsRole(message.member, config.authorizedRoleIds)
    ) {
      throw new UserFacingError(
        "You are not authorized to use .vsrm. This command uses the roles authorized with /config authorize.",
      );
    }
    const role = await requireConfiguredRole(
      message.guild,
      config.vsRoleId,
      "VS",
    );
    await assertRoleAssignable(message.guild, role);

    const users = getUniqueMentionedUsers(message);
    if (users.length !== 1) {
      throw new UserFacingError(
        "Mention exactly one member. Example: .vsrm @member",
      );
    }

    const [member] = await resolveMentionedMembers(message);
    if (!member.roles.cache.has(role.id)) {
      return commandResult(
        "🏷️ VS Role",
        `${member} does not currently have the VS role.`,
        EMBED_COLORS.info,
      );
    }

    await member.roles.remove(role, `VS role removed by ${message.author.tag}`);
    return commandResult(
      "🏷️ Role Removed",
      `✅ Removed the VS role from ${member} (${member.user.username}).`,
    );
  },
};
