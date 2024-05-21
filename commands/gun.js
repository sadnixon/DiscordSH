const {
  errorMessage,
  gameStateMessage,
  sendDM,
  advancePres,
  checkGameEnd,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);

    if (
      args &&
      _.range(0, current_game.players.length).includes(parseInt(args[0])) &&
      current_game.gameState.presidentId !== parseInt(args[0]) &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0])) &&
      current_game.gameState.phase === "gunWait" &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      current_game.gameState.deadPlayers.push(parseInt(args[0]));
      if (current_game.players[parseInt(args[0])].role === "hitler") {
        current_game.gameState.hitlerDead = true;
      }
      //GOTTA IMPLEMENT GAME ENDING STUFF HERE
      current_game.gameState.phase = "nomWait";
      current_game.gameState.lastPresidentId =
        current_game.gameState.presidentId;
      current_game.gameState.lastChancellorId =
        current_game.gameState.chancellorId;
      advancePres(current_game);
      await game_info.set(current_game.game_id, current_game);
      gameStateMessage(message, current_game);
      checkGameEnd(message,current_game);
    } else {
      message.channel.send(errorMessage("Invalid execution pick!"));
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "gun",
  aliases: ["execute"],
  execute,
};
