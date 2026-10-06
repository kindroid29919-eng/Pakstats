const { PermissionFlagsBits } = require("discord.js");
const { UserFacingError } = require("./errors");

async function getBotMember(guild) {
  if (guild.members.me) return guild.members.me;
  try {
    return await guild.members.fetchMe();
  } catch {
    throw new UserFacingError(
      "I could not verify my server permissions. Check that the bot is still a member of this server.",
    );
  }
}

async function getGuildRole(guild, roleId) {
  if (!roleId) return null;
  const cached = guild.roles.cache.get(roleId);
  if (cached) return cached;
  try {
    return await guild.roles.fetch(roleId);
  } catch {
    return null;
  }
}

async function requireConfiguredRole(guild, roleId, systemName) {
  if (!roleId) {
    throw new UserFacingError(
      `${systemName} is not configured yet. Ask a server manager to set its role with the matching configuration command.`,
    );
  }

  const role = await getGuildRole(guild, roleId);
  if (!role) {
    throw new UserFacingError(
      `The configured ${systemName} role no longer exists. A server manager must set it again.`,
    );
  }
  return role;
}

async function assertRoleAssignable(guild, role) {
  if (!role || role.id === guild.id || role.managed) {
    throw new UserFacingError(
      "Choose a regular server role that the bot can assign; @everyone and managed roles are not assignable.",
    );
  }

  const botMember = await getBotMember(guild);
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new UserFacingError(
      "I need the Manage Roles permission before I can give or remove that role.",
    );
  }

  if (botMember.roles.highest.comparePositionTo(role) <= 0) {
    throw new UserFacingError(
      "Move my highest role above the configured role in Server Settings → Roles, then try again.",
    );
  }
}

async function assertNicknamePermission(guild) {
  const botMember = await getBotMember(guild);
  if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    throw new UserFacingError(
      "I need the Manage Nicknames permission before I can change server nicknames.",
    );
  }
  return botMember;
}

async function assertTargetManageable(guild, targetMember, botMember) {
  if (targetMember.id === guild.ownerId) {
    throw new UserFacingError("Discord does not allow the bot to edit the server owner.");
  }
  if (targetMember.id === botMember.id) {
    throw new UserFacingError("The bot cannot apply this operation to itself.");
  }
  if (botMember.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
    throw new UserFacingError(
      "My highest role must be above the target member's highest role to manage them.",
    );
  }
}

function assertCanManageMembers(guild) {
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new UserFacingError("I need the Manage Roles permission to change roles.");
  }
}

module.exports = {
  assertCanManageMembers,
  assertNicknamePermission,
  assertRoleAssignable,
  assertTargetManageable,
  getBotMember,
  getGuildRole,
  requireConfiguredRole,
};