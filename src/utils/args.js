// Returns everything after the command word, keeping internal newlines
// (needed by the multi-line .result command).
function getCommandBody(message, prefix) {
  return message.content
    .slice(prefix.length)
    .trim()
    .replace(/^\S+/u, "")
    .trim();
}

function splitArgs(body) {
  return body ? body.split(/\s+/u) : [];
}

module.exports = { getCommandBody, splitArgs };
