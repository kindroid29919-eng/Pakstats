const { PermissionFlagsBits } = require("discord.js");
const { UserFacingError } = require("../../utils/errors");
const { assertServerManager } = require("../../utils/permissions");
const { assertRoleAssignable } = require("../../utils/roles");

function getSubcommand(interaction) {
  assertServerManager(interaction);
  if (!interaction.inGuild() || !interaction.guild) {
    throw new UserFacingError("This configuration command can only be used in a server.");
  }
  return interaction.options.getSubcommand();
}

async function getAssignableRole(interaction) {
  const role = interaction.options.getRole("role", true);
  await assertRoleAssignable(interaction.guild, role);
  return role;
}

function applyManagerDefaults(command) {
  return command.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
}

function readConfiguredText(interaction) {
  const value = interaction.options.getString("value", true).trim();
  if (!value || Array.from(value).length > 100) {
    throw new UserFacingError("Use a value from 1 to 100 characters, or enter clear.");
  }
  return value.toLowerCase() === "clear" ? null : value;
}

function formatRole(guild, roleId) {
  if (!roleId) return "Not set";
  const role = guild.roles.cache.get(roleId);
  return role ? `${role.name} (<@&${role.id}>)` : "Deleted role";
}

function formatSetting(value) {
  return value == null ? "Not set" : `\`${value}\``;
}

module.exports = {
  applyManagerDefaults,
  formatRole,
  formatSetting,
  getAssignableRole,
  getSubcommand,
  readConfiguredText,
};