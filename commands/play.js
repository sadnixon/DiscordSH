const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  advancePres,
  checkGameEnd,
  policyMap,
  topDeckCheck,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const player_games = await game_info.get("player_games");
  if (message.author.id in player_games) {
    const current_game = await game_info.get(player_games[message.author.id]);
    if (
      args &&
      current_game.gameState.phase === "chancWait" &&
      current_game.gameState.chancellorHand.includes(args[0]) &&
      current_game.players[current_game.gameState.chancellorId].id ===
        message.author.id
    ) {
      current_game.gameState.failedGovs = 0;
      current_game.gameState.chancellorHand.splice(
        current_game.gameState.chancellorHand.indexOf(args[0]),
        1
      );
      current_game.gameState.discard.push(
        current_game.gameState.chancellorHand.pop()
      );
      current_game.gameState.log.enactedPolicy = policyMap[args[0]];
      if (args[0] === "B") {
        current_game.gameState.phase = "nomWait";
        current_game.gameState.lastPresidentId =
          current_game.gameState.presidentId;
        current_game.gameState.lastChancellorId =
          current_game.gameState.chancellorId;
        advancePres(current_game);
        const deckState = current_game.gameState.deck.map((e) => policyMap[e]);
        deckState.reverse();
        current_game.gameState.log.deckState = deckState;
        current_game.logs.push(current_game.gameState.log);
        current_game.gameState.log = {};
        current_game.gameState.lib++;
      } else {
        current_game.gameState.fas++;
        const power_slot =
          current_game.customGameSettings.powers[
            current_game.gameState.fas - 1
          ];

        if (power_slot === null) {
          current_game.gameState.phase = "nomWait";
          current_game.gameState.lastPresidentId =
            current_game.gameState.presidentId;
          current_game.gameState.lastChancellorId =
            current_game.gameState.chancellorId;
          advancePres(current_game);
          const deckState = current_game.gameState.deck.map(
            (e) => policyMap[e]
          );
          deckState.reverse();
          current_game.gameState.log.deckState = deckState;
          current_game.logs.push(current_game.gameState.log);
          current_game.gameState.log = {};
        } else if (power_slot === "investigate") {
          current_game.gameState.phase = "investWait";
          current_game.gameState.log.investigatorId =
            current_game.gameState.presidentId;
        } else if (power_slot === "peek") {
          topDeckCheck(current_game);
          const peek_draw = current_game.gameState.deck.slice(
            current_game.gameState.deck.length - 3
          );
          peek_draw.reverse();
          current_game.gameState.log.policyPeek = peek_draw.map(
            (e) => policyMap[e]
          );
          sendDM(
            message,
            current_game,
            `You have peeked at **${peek_draw.join(
              ""
            )}** in that order (top on the left).`,
            current_game.players[current_game.gameState.presidentId].id
          );
          current_game.gameState.phase = "nomWait";
          current_game.gameState.lastPresidentId =
            current_game.gameState.presidentId;
          current_game.gameState.lastChancellorId =
            current_game.gameState.chancellorId;
          advancePres(current_game);
          const deckState = current_game.gameState.deck.map(
            (e) => policyMap[e]
          );
          deckState.reverse();
          current_game.gameState.log.deckState = deckState;
          current_game.logs.push(current_game.gameState.log);
          current_game.gameState.log = {};
        } else if (power_slot === "election") {
          current_game.gameState.phase = "seWait";
        } else if (power_slot === "bullet") {
          current_game.gameState.phase = "gunWait";
        }
      }
      topDeckCheck(current_game);
      gameStateMessage(message, current_game);
      await game_info.set(current_game.game_id, current_game);
      checkGameEnd(message, current_game);
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
