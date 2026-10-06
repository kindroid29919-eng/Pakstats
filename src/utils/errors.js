class UserFacingError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserFacingError";
  }
}

function describeDiscordError(error) {
  const code = Number(error?.code);
  const status = Number(error?.status);

  if (code === 10007) return "That user is no longer a member of this server.";
  if (code === 10011) return "That role no longer exists. Update the server configuration.";
  if (code === 50001 || status === 403) {
    return "The bot cannot access that server member or role. Check its permissions and role hierarchy.";
  }
  if (code === 50013) {
    return "The bot lacks permission for that change, or its highest role is not high enough.";
  }
  if (code === 30013) return "That member already has the maximum number of roles.";
  if (code === 50035) return "Discord rejected that value. Check the nickname and try again.";
  if (status === 429) return "Discord is rate-limiting the request. Please try again shortly.";

  return "Discord could not complete that request. Check the bot's permissions and try again.";
}

module.exports = { UserFacingError, describeDiscordError };