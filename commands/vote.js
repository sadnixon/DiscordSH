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
      ["ja", "nein"].includes(args[0].toLowerCase()) &&
      current_game.gameState.phase === "voteWait"
    ) {
      let voteIndex = current_game.player_ids[message.author.id];
      if (
        args.length > 1 &&
        _.range(0, current_game.players.length).includes(parseInt(args[1])) &&
        !current_game.gameState.deadPlayers.includes(parseInt(args[1])) &&
        current_game.players[parseInt(args[1])].id === message.author.id
      ) {
        voteIndex = parseInt(args[1]);
      }
      if (args[0].toLowerCase() === "ja") {
        current_game.gameState.votes[voteIndex] = true;
      } else {
        current_game.gameState.votes[voteIndex] = false;
      }

      const voteList = _.range(0, current_game.players.length).map(
        (i) => current_game.gameState.votes[i]
      );

      if (
        voteList.filter((e) => e !== null).length ===
        current_game.players.length + current_game.gameState.deadPlayers.length
      ) {
        if (
          voteList.filter((e) => e).length >
          voteList.filter((e) => e !== null).length / 2
        ) {
          current_game.gameState.phase = "presWait";
        } else {
          current_game.gameState.phase = "nomWait";
          current_game.gameState.failedGovs++;
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
        }
        gameStateMessage(message, current_game);
      }
      await game_info.set("games", games);
    } else {
      message.channel.send(errorMessage("Invalid vote pick!"));
    }
  } else {
    message.channel.send(errorMessage("Player not in game!"));
  }
}

module.exports = {
  name: "vote",
  aliases: [],
  execute,
};
