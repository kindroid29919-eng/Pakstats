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
const { EMBED_COLORS, commandResult } = require("../../utils/responses");

module.exports = {
  name: "vs",
  async execute({ message, db }) {
    const config = db.getGuild(message.guild.id);
    if (
      !message.member ||
      !hasConfiguredVsRole(message.member, config.authorizedRoleIds)
    ) {
      throw new UserFacingError(
        "You are not authorized to use .vs. A server manager must authorize one of your roles with /config authorize.",
      );
    }

    const users = getUniqueMentionedUsers(message);
    if (users.length === 0) {
      throw new UserFacingError(
        "Mention 1–16 server members. Example: .vs @member",
      );
    }
    if (users.length > 16) {
      throw new UserFacingError(
        "You can assign the VS role to at most 16 members at once.",
      );
    }

    const role = await requireConfiguredRole(
      message.guild,
      config.vsRoleId,
      "VS",
    );
    await assertRoleAssignable(message.guild, role);
    const members = await resolveMentionedMembers(message);
    const assigned = [];
    const alreadyHadRole = [];
    const failed = [];

    for (const member of members) {
      const label = `${member} (${member.user.username})`;
      try {
        if (member.roles.cache.has(role.id)) {
          alreadyHadRole.push(label);
          continue;
        }
        await member.roles.add(
          role,
          `VS role assigned by ${message.author.tag}`,
        );
        assigned.push(label);
      } catch {
        failed.push(label);
      }
    }

    const sections = [];
    if (assigned.length) {
      sections.push(`✅ Assigned to: ${assigned.join(", ")}`);
    }
    if (alreadyHadRole.length) {
      sections.push(`ℹ️ Already had the VS role: ${alreadyHadRole.join(", ")}`);
    }
    if (failed.length) {
      sections.push(
        `⚠️ Could not assign the role to: ${failed.join(", ")}. Check the bot's Manage Roles permission and role position.`,
      );
    }
    return commandResult(
      "🏷️ Role Assignment Results",
      sections.join("\n\n"),
      failed.length ? EMBED_COLORS.warning : EMBED_COLORS.success,
    );
  },
};
