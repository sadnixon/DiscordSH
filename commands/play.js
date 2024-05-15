const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const player_games = await game_info.get("player_games");
  if (message.author.id in player_games) {
    const games = await game_info.get("games");
    const current_game = games[player_games[message.author.id]];
    if (
      args &&
      current_game.gameState.phase === "chancWait" &&
      current_game.gameState.chancellorHand.includes(args[0]) &&
      current_game.players[current_game.gameState.chancellorId].id ===
        message.author.id
    ) {
      console.log(current_game.gameState);
      current_game.gameState.chancellorHand.splice(
        current_game.gameState.chancellorHand.indexOf(args[0]),
        1
      );
      current_game.gameState.discard.push(
        current_game.gameState.chancellorHand.pop()
      );
      if (args[0] === "B") {
        current_game.gameState.phase = "nomWait";
        current_game.gameState.lastPresidentId =
          current_game.gameState.presidentId;
        current_game.gameState.lastChancellorId =
          current_game.gameState.chancellorId;
        current_game.gameState.presidentId =
          (current_game.gameState.presidentId + 1) % 7;
        while (
          current_game.gameState.deadPlayers.includes(
            current_game.gameState.presidentId
          )
        ) {
          current_game.gameState.presidentId =
            (current_game.gameState.presidentId + 1) % 7;
        }
        current_game.gameState.chancellorId = -1;
        current_game.gameState.lib++;
        //GOTTA IMPLEMENT GAME ENDING STUFF HERE EVENTUALLY
      } else {
        current_game.gameState.fas++;
        if (current_game.gameState.fas === 2) {
          current_game.gameState.phase = "investWait";
        } else if (current_game.gameState.fas === 3) {
          current_game.gameState.phase = "seWait";
        } else if ([4, 5].includes(current_game.gameState.fas)) {
          current_game.gameState.phase = "gunWait";
        }
        //GOTTA IMPLEMENT GAME ENDING STUFF HERE EVENTUALLY
      }
      console.log(current_game.gameState);
      gameStateMessage(message, current_game);
      await game_info.set("games", games);
    } else {
      message.channel.send(errorMessage("Invalid play pick!"));
    }
  } else {
    message.channel.send(errorMessage("Player not in game!"));
  }
}

module.exports = {
  name: "play",
  aliases: [],
  execute,
};
