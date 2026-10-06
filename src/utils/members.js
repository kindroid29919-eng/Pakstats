const { UserFacingError } = require("./errors");

function getUniqueMentionedUsers(message) {
  return [...message.mentions.users.values()];
}

async function resolveMentionedMembers(message) {
  const users = getUniqueMentionedUsers(message);
  const resolved = [];
  const missing = [];

  for (const user of users) {
    try {
      const member = await message.guild.members.fetch(user.id);
      if (member) resolved.push(member);
      else missing.push(user.id);
    } catch (error) {
      if (Number(error?.code) === 10007 || Number(error?.status) === 404) {
        missing.push(user.id);
        continue;
      }
      throw error;
    }
  }

  if (missing.length) {
    throw new UserFacingError(
      `These mentions are not current members of this server: ${missing
        .map((id) => `<@${id}>`)
        .join(", ")}`,
    );
  }

  return resolved;
}

function extractNickname(message, prefix) {
  const body = message.content.slice(prefix.length).replace(/^\S+\s*/u, "");
  const nickname = body.replace(/<@!?\d+>/gu, "").trim();
  if (!nickname) {
    throw new UserFacingError(
      `Add a nickname after the member mention. Example: ${prefix}${message.content
        .slice(prefix.length)
        .trim()
        .split(/\s+/u)[0]} @member New nickname`,
    );
  }
  return nickname;
}

module.exports = {
  extractNickname,
  getUniqueMentionedUsers,
  resolveMentionedMembers,
};