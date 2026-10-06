const { PermissionFlagsBits } = require("discord.js");
const { UserFacingError } = require("./errors");

function hasAnyPermission(permissions, permissionFlags) {
  return Boolean(
    permissions &&
      permissionFlags.some((permission) => permissions.has(permission)),
  );
}

function isServerManager(permissions) {
  return hasAnyPermission(permissions, [
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.Administrator,
  ]);
}

function mayUseNicknameCommands(permissions) {
  return hasAnyPermission(permissions, [
    PermissionFlagsBits.ManageNicknames,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.Administrator,
  ]);
}

function hasConfiguredVsRole(member, authorizedRoleIds) {
  return authorizedRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function assertServerManager(interaction) {
  if (!isServerManager(interaction.memberPermissions)) {
    throw new UserFacingError(
      "You need Manage Server or Administrator permission to change this configuration.",
    );
  }
}

function assertNicknameOperator(member) {
  if (!mayUseNicknameCommands(member?.permissions)) {
    throw new UserFacingError(
      "You need Manage Nicknames, Manage Server, or Administrator permission to use this command.",
    );
  }
}

module.exports = {
  assertNicknameOperator,
  assertServerManager,
  hasConfiguredVsRole,
  isServerManager,
  mayUseNicknameCommands,
};