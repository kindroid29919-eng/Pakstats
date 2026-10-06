const { SlashCommandBuilder } = require("discord.js");
const { UserFacingError } = require("../../utils/errors");
const { EMBED_COLORS, commandResult } = require("../../utils/responses");
const {
  applyManagerDefaults,
  formatRole,
  formatSetting,
  getAssignableRole,
  getSubcommand,
} = require("./shared");

const CONFIG_SYSTEMS = {
  vs: {
    label: "VS",
    roleField: "vs_role_id",
  },
  nick: {
    label: "Nick",
    roleField: "nick_role_id",
    prefixField: "nick_prefix",
    suffixField: "nick_suffix",
    prefixProperty: "nickPrefix",
    suffixProperty: "nickSuffix",
  },
  ea: {
    label: "EA",
    roleField: "ea_role_id",
    prefixField: "ea_prefix",
    suffixField: "ea_suffix",
    prefixProperty: "eaPrefix",
    suffixProperty: "eaSuffix",
  },
};

const data = applyManagerDefaults(
  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure Team Pakistan bot roles and nickname formats.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a role and optionally update its nickname format.")
        .addStringOption((option) =>
          option
            .setName("system")
            .setDescription("Which bot feature to configure")
            .setRequired(true)
            .addChoices(
              { name: "VS role", value: "vs" },
              { name: "Nick role and nickname", value: "nick" },
              { name: "EA role and nickname", value: "ea" },
            ),
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role the bot should assign")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("prefix")
            .setDescription("Optional nickname prefix; use clear to remove it")
            .setMaxLength(100),
        )
        .addStringOption((option) =>
          option
            .setName("suffix")
            .setDescription("Optional nickname suffix; use clear to remove it")
            .setMaxLength(100),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("authorize")
        .setDescription("Allow a role to use .vs, .vsrm, and .vsrall.")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role to authorize for VS commands")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deauthorize")
        .setDescription("Remove a role's access to the VS commands.")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role to remove from the VS authorized list")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("authorized")
        .setDescription("Show the roles allowed to use VS commands."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Show all configured roles and nickname formats."),
    ),
);

function readOptionalText(interaction, optionName) {
  const rawValue = interaction.options.getString(optionName);
  if (rawValue === null) return { provided: false, value: null };

  const value = rawValue.trim();
  if (!value || Array.from(value).length > 100) {
    throw new UserFacingError(
      `The ${optionName} must be from 1 to 100 characters, or enter clear.`,
    );
  }
  return {
    provided: true,
    value: value.toLowerCase() === "clear" ? null : value,
  };
}

function authorizedRoleLines(guild, roleIds, maxLength = 2500) {
  const lines = roleIds.map((roleId) => {
    const role = guild.roles.cache.get(roleId);
    return role
      ? `• ${role.name} (<@&${roleId}>)`
      : `• Deleted role (\`${roleId}\`)`;
  });
  if (lines.length === 0) return "No roles are authorized yet.";

  const visible = [];
  let visibleLength = 0;
  for (const line of lines) {
    if (visibleLength + line.length + 1 > maxLength) break;
    visible.push(line);
    visibleLength += line.length + 1;
  }
  const hiddenCount = lines.length - visible.length;
  if (hiddenCount) visible.push(`…and ${hiddenCount} more role(s).`);
  return visible.join("\n");
}

async function setConfiguration(interaction, db) {
  const systemKey = interaction.options.getString("system", true);
  const system = CONFIG_SYSTEMS[systemKey];
  if (!system) {
    throw new UserFacingError(
      "Choose VS, Nick, or EA as the system to configure.",
    );
  }
  const prefix = readOptionalText(interaction, "prefix");
  const suffix = readOptionalText(interaction, "suffix");

  if (systemKey === "vs" && (prefix.provided || suffix.provided)) {
    throw new UserFacingError(
      "VS roles do not use nickname decorations. Choose Nick or EA to set a prefix or suffix.",
    );
  }

  const role = await getAssignableRole(interaction);
  const updates = { [system.roleField]: role.id };
  if (system.prefixField && prefix.provided) {
    updates[system.prefixField] = prefix.value;
  }
  if (system.suffixField && suffix.provided) {
    updates[system.suffixField] = suffix.value;
  }
  db.setFields(interaction.guild.id, updates);

  const config = db.getGuild(interaction.guild.id);
  const description = [
    `✅ **${system.label} settings saved.**`,
    `Role: <@&${role.id}>`,
  ];
  if (system.prefixField) {
    description.push(
      `Prefix: ${formatSetting(config[system.prefixProperty])}`,
      `Suffix: ${formatSetting(config[system.suffixProperty])}`,
      "Only options included in this command were changed. Use `clear` to remove a prefix or suffix.",
    );
  }
  return commandResult(
    "⚙️ Configuration Updated",
    description.join("\n"),
    EMBED_COLORS.success,
  );
}

async function execute(interaction, { db }) {
  const subcommand = getSubcommand(interaction);
  const guildId = interaction.guild.id;

  if (subcommand === "set") {
    return setConfiguration(interaction, db);
  }

  if (subcommand === "authorize") {
    const role = interaction.options.getRole("role", true);
    if (role.id === guildId) {
      throw new UserFacingError(
        "@everyone cannot be authorized to use VS commands.",
      );
    }
    db.authorizeRole(guildId, role.id);
    return commandResult(
      "🔐 VS Access Updated",
      `✅ Authorized **${role.name}** to use .vs, .vsrm, and .vsrall.`,
    );
  }

  if (subcommand === "deauthorize") {
    const role = interaction.options.getRole("role", true);
    const wasAuthorized = db
      .getGuild(guildId)
      .authorizedRoleIds.includes(role.id);
    db.deauthorizeRole(guildId, role.id);
    return commandResult(
      "🔐 VS Access Updated",
      wasAuthorized
        ? `✅ Removed **${role.name}** from the VS authorized-role list.`
        : `**${role.name}** was not authorized.`,
      EMBED_COLORS.info,
    );
  }

  if (subcommand === "authorized") {
    const config = db.getGuild(guildId);
    return commandResult(
      "🔐 VS Authorized Roles",
      `**VS role:** ${formatRole(interaction.guild, config.vsRoleId)}\n**Allowed to use VS commands:**\n${authorizedRoleLines(interaction.guild, config.authorizedRoleIds)}`,
      EMBED_COLORS.info,
    );
  }

  if (subcommand === "show") {
    const config = db.getGuild(guildId);
    const details = [
      `**VS role:** ${formatRole(interaction.guild, config.vsRoleId)}`,
      `**VS authorized roles:**\n${authorizedRoleLines(interaction.guild, config.authorizedRoleIds, 1700)}`,
      `**Nick role:** ${formatRole(interaction.guild, config.nickRoleId)}`,
      `**Nick prefix:** ${formatSetting(config.nickPrefix)}`,
      `**Nick suffix:** ${formatSetting(config.nickSuffix)}`,
      `**EA role:** ${formatRole(interaction.guild, config.eaRoleId)}`,
      `**EA prefix:** ${formatSetting(config.eaPrefix)}`,
      `**EA suffix:** ${formatSetting(config.eaSuffix)}`,
    ];
    return commandResult("⚙️ Current Configuration", details.join("\n"));
  }

  throw new UserFacingError("That configuration option is not supported.");
}

module.exports = { data, execute, readOptionalText };
