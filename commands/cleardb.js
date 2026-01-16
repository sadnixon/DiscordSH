const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    await game_info.clear();

    await game_info.set("game_channels", {});

    await game_info.set("player_games", {});

    await game_info.set("games", {});

    message.channel.send("All database info has been cleared.");
  }
}

module.exports = {
  name: "cleardb",
  aliases: [],
  execute,
};
