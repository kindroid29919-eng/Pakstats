const { createAddStatCommand } = require("./addStat");

module.exports = createAddStatCommand({
  name: "addtw",
  field: "tw",
  label: "TW",
  dbMethod: "addTW",
});
