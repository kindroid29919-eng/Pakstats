const { UserFacingError } = require("../../utils/errors");
const { assertNicknameOperator } = require("../../utils/permissions");
const {
  assertNicknamePermission,
  assertRoleAssignable,
  assertTargetManageable,
  requireConfiguredRole,
} = require("../../utils/roles");
const { buildDisplayNickname } = require("../../utils/nickname");
const {
  getUniqueMentionedUsers,
  resolveMentionedMembers,
  extractNickname,
} = require("../../utils/members");
const { commandResult } = require("../../utils/responses");

module.exports = {
  name: "ea",
  async execute({ message, db, prefix }) {
    assertNicknameOperator(message.member);
    const users = getUniqueMentionedUsers(message);
    if (users.length !== 1) {
      throw new UserFacingError(
        "Mention exactly one member and add a nickname. Example: .ea @member New nickname",
      );
    }

    const config = db.getGuild(message.guild.id);
    const role = await requireConfiguredRole(
      message.guild,
      config.eaRoleId,
      "EA",
    );
    await assertRoleAssignable(message.guild, role);
    const botMember = await assertNicknamePermission(message.guild);
    const [member] = await resolveMentionedMembers(message);
    await assertTargetManageable(message.guild, member, botMember);

    let nickname;
    try {
      nickname = buildDisplayNickname(extractNickname(message, prefix), {
        prefix: config.eaPrefix,
        suffix: config.eaSuffix,
      });
    } catch (error) {
      throw new UserFacingError(error.message);
    }

    const alreadyHadRole = member.roles.cache.has(role.id);
    if (!alreadyHadRole) {
      await member.roles.add(role, `EA role assigned by ${message.author.tag}`);
    }
    try {
      await member.setNickname(
        nickname,
        `Nickname set by ${message.author.tag}`,
      );
    } catch (error) {
      if (!alreadyHadRole) {
        try {
          await member.roles.remove(
            role,
            "Rolled back because the nickname update failed",
          );
        } catch {
          throw new UserFacingError(
            "Discord rejected the nickname update after the EA role was added, and I could not roll the role back. Check the bot's permissions and remove the role manually if needed.",
          );
        }
      }
      throw error;
    }

    return commandResult(
      "✏️ Nickname Changed",
      `✅ ${member} now has the EA role and nickname ${nickname}.`,
    );
  },
};
