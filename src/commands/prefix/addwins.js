const { createAddStatCommand } = require("./addStat");

module.exports = createAddStatCommand({
  name: "addwins",
  field: "wins",
  label: "Wins",
  dbMethod: "addWins",
});
