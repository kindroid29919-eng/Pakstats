const { UserFacingError } = require("../../utils/errors");
const {
  assertRoleAssignable,
  requireConfiguredRole,
} = require("../../utils/roles");
const { hasConfiguredVsRole } = require("../../utils/permissions");
const {
  EMBED_COLORS,
  commandResult,
  createBotEmbed,
} = require("../../utils/responses");

async function runPool(items, workerCount, worker) {
  let next = 0;
  const workers = Array.from(
    { length: Math.min(workerCount, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        await worker(items[index]);
      }
    },
  );
  await Promise.all(workers);
}

module.exports = {
  name: "vsrall",
  async execute({ message, db }) {
    const config = db.getGuild(message.guild.id);
    if (
      !message.member ||
      !hasConfiguredVsRole(message.member, config.authorizedRoleIds)
    ) {
      throw new UserFacingError(
        "You are not authorized to use .vsrall. This command uses the roles authorized with /config authorize.",
      );
    }

    const role = await requireConfiguredRole(
      message.guild,
      config.vsRoleId,
      "VS",
    );
    await assertRoleAssignable(message.guild, role);

    let members;
    try {
      // Fetch the complete member list; the role-member cache alone may be incomplete.
      members = await message.guild.members.fetch();
    } catch (error) {
      if (Number(error?.code) === 50001 || Number(error?.status) === 403) {
        throw new UserFacingError(
          "I could not fetch the server member list. Enable the Server Members Intent in the Developer Portal and ensure the bot can access this server.",
        );
      }
      throw error;
    }

    const targets = [...members.values()].filter((member) =>
      member.roles.cache.has(role.id),
    );
    if (targets.length === 0) {
      return commandResult(
        "🧹 VS Role Cleanup",
        "No server members currently have the VS role.",
        EMBED_COLORS.info,
      );
    }

    const progress = await message.reply({
      embeds: [
        createBotEmbed(
          message.client,
          commandResult(
            "🧹 VS Role Cleanup",
            `Removing the VS role from ${targets.length} member(s)…`,
            EMBED_COLORS.info,
          ),
        ),
      ],
      allowedMentions: { parse: [], repliedUser: false },
    });
    let removed = 0;
    let failed = 0;

    await runPool(targets, 2, async (member) => {
      try {
        await member.roles.remove(
          role,
          `VS role cleared by ${message.author.tag}`,
        );
        removed += 1;
      } catch {
        failed += 1;
      }
    });

    const result = commandResult(
      "🧹 VS Role Cleanup Complete",
      `✅ Removed: ${removed}\n⚠️ Failed: ${failed}`,
      failed ? EMBED_COLORS.warning : EMBED_COLORS.success,
    );
    await progress.edit({
      embeds: [createBotEmbed(message.client, result)],
      allowedMentions: { parse: [] },
    });
    return null;
  },
};
