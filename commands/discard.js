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
      current_game.gameState.phase === "presWait" &&
      current_game.gameState.presidentHand.includes(args[0]) &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      current_game.gameState.phase = "chancWait";
      current_game.gameState.discard.push(
        current_game.gameState.presidentHand.splice(
          current_game.gameState.presidentHand.indexOf(args[0]),
          1
        )[0]
      );
      current_game.gameState.chancellorHand =
        current_game.gameState.presidentHand.splice(0, 2);
      sendDM(
        message,
        current_game,
        `You have been passed **${current_game.gameState.chancellorHand.join(
          ""
        )}**. Please choose a card to play.`,
        current_game.players[current_game.gameState.chancellorId].id
      );
      await game_info.set("games", games);
    } else {
      message.channel.send(errorMessage("Invalid discard pick!"));
    }
  } else {
    message.channel.send(errorMessage("Player not in game!"));
  }
}

module.exports = {
  name: "discard",
  aliases: ["disc"],
  execute,
};
