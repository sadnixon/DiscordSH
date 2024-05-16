const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  advancePres,
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
      let vote_index = current_game.player_ids[message.author.id];
      if (
        args.length > 1 &&
        _.range(0, current_game.players.length).includes(parseInt(args[1])) &&
        !current_game.gameState.deadPlayers.includes(parseInt(args[1])) &&
        current_game.players[parseInt(args[1])].id === message.author.id
      ) {
        vote_index = parseInt(args[1]);
      }
      if (current_game.gameState.deadPlayers.includes(vote_index))
        return message.channel.send(errorMessage("You are dead!"));
      if (args[0].toLowerCase() === "ja") {
        current_game.gameState.votes[vote_index] = true;
      } else {
        current_game.gameState.votes[vote_index] = false;
      }

      const vote_list = _.range(0, current_game.players.length).map(
        (i) => current_game.gameState.votes[i]
      );

      if (
        vote_list.filter((e) => e !== null).length ===
        current_game.players.length - current_game.gameState.deadPlayers.length
      ) {
        current_game.gameState.log.votes = vote_list;
        current_game.gameState.log.presidentId =
          current_game.gameState.presidentId;
        current_game.gameState.log.chancellorId =
          current_game.gameState.chancellorId;
        if (
          vote_list.filter((e) => e).length >
          vote_list.filter((e) => e !== null).length / 2
        ) {
          //current_game.gameState.failedGovs = 0;
          current_game.gameState.phase = "presWait";
          for (let i = 0; i < 3; i++) {
            current_game.gameState.presidentHand.push(
              current_game.gameState.deck.pop()
            );
          }
          sendDM(
            message,
            current_game,
            `You have drawn **${current_game.gameState.presidentHand.join(
              ""
            )}**. Please choose a card to discard.`,
            current_game.players[current_game.gameState.presidentId].id
          );
        } else {
          current_game.gameState.phase = "nomWait";
          current_game.gameState.failedGovs++;
          advancePres(current_game);
          if (current_game.gameState.failedGovs > 2) {
            current_game.gameState.failedGovs = 0;
            const top_deck = current_game.gameState.deck.pop();
            if (top_deck === "B") {
              current_game.gameState.lib++;
            } else {
              current_game.gameState.fas++;
            }
            current_game.gameState.lastPresidentId = -1;
            current_game.gameState.lastChancellorId = -1;
            if (current_game.gameState.deck.length < 3) {
              current_game.gameState.deck = shuffleArray(
                current_game.gameState.deck.concat(
                  current_game.gameState.discard
                )
              );
              current_game.gameState.discard = [];
            }
            //GOTTA IMPLEMENT GAME ENDING STUFF HERE EVENTUALLY
          }
        }
        gameStateMessage(message, current_game);
        for (let i = 0; i < current_game.players.length; i++) {
          current_game.gameState.votes[i] = null;
        }
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
