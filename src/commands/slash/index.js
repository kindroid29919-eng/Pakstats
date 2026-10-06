const config = require("./config");

const slashCommands = [config];

module.exports = {
  slashCommands,
  slashCommandMap: new Map(
    slashCommands.map((command) => [command.data.name, command]),
  ),
};
