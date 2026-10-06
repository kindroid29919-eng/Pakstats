const DISCORD_NICKNAME_LIMIT = 32;

function cleanNamePart(value) {
  return (value ?? "").replace(/\s+/gu, " ").trim();
}

function characterCount(value) {
  return Array.from(value).length;
}

function buildDisplayNickname(baseName, { prefix, suffix }) {
  const base = cleanNamePart(baseName);
  if (!base) {
    throw new Error("Enter a nickname after the member mention.");
  }

  const cleanPrefix = cleanNamePart(prefix);
  const cleanSuffix = cleanNamePart(suffix);
  const decorations = [cleanPrefix, cleanSuffix].filter(Boolean);
  const separatorCount = decorations.length;
  const decorationLength =
    characterCount(cleanPrefix) + characterCount(cleanSuffix) + separatorCount;
  const remainingLength = DISCORD_NICKNAME_LIMIT - decorationLength;

  if (remainingLength < 1) {
    throw new Error(
      "The configured prefix and suffix leave no room for a nickname. Shorten or clear one of them.",
    );
  }

  const shortenedBase = Array.from(base).slice(0, remainingLength).join("");
  return [cleanPrefix, shortenedBase, cleanSuffix].filter(Boolean).join(" ");
}

module.exports = {
  DISCORD_NICKNAME_LIMIT,
  buildDisplayNickname,
  characterCount,
};