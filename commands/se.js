const {
  errorMessage,
  gameStateMessage,
  sendDM,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const games = await game_info.get("games");
    const current_game = games[channels[message.channel.id]];
    if (
      args &&
      _.range(0, current_game.players.length).includes(parseInt(args[0])) &&
      current_game.gameState.presidentId !== parseInt(args[0]) &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0])) &&
      current_game.gameState.phase === "seWait" &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      current_game.gameState.phase = "nomWait";
      current_game.gameState.specialElected = true;
      current_game.gameState.lastPresidentId =
        current_game.gameState.presidentId;
      current_game.gameState.lastChancellorId =
        current_game.gameState.chancellorId;
      current_game.gameState.presidentId = parseInt(args[0]);
      current_game.gameState.chancellorId = -1;
      await game_info.set("games", games);
      gameStateMessage(message, current_game);
    } else {
      message.channel.send(errorMessage("Invalid SE pick!"));
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "se",
  aliases: ["specialelection"],
  execute,
};
