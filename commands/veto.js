const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  advancePres,
  checkGameEnd,
  policyMap,
  reshuffleCheck,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const player_games = await game_info.get("player_games");
  if (message.author.id in player_games) {
    const current_game = await game_info.get(player_games[message.author.id]);
    if (
      args &&
      ["ja", "nein"].includes(args[0].toLowerCase()) &&
      current_game.gameState.phase === "vetoWait" &&
      [
        current_game.players[current_game.gameState.presidentId].id,
        current_game.players[current_game.gameState.chancellorId].id,
      ].includes(message.author.id)
    ) {
      let vote_index = current_game.player_ids[message.author.id];
      if (
        args.length > 1 &&
        current_game.players[parseInt(args[1]) - 1].id === message.author.id
      ) {
        if (
          [
            current_game.gameState.presidentId,
            current_game.gameState.chancellorId,
          ].includes(parseInt(args[1]) - 1)
        ) {
          vote_index = parseInt(args[1] - 1);
        } else {
          if (
            current_game.players[current_game.gameState.presidentId].id ==
            message.author.id
          ) {
            vote_index = current_game.gameState.presidentId;
          } else {
            vote_index = current_game.gameState.chancellorId;
          }
        }
      }
      if (
        ![
          current_game.gameState.presidentId,
          current_game.gameState.chancellorId,
        ].includes(vote_index)
      ) {
        return message.channel.send(errorMessage("You can't veto this!"));
      }
      if (args[0].toLowerCase() === "ja") {
        vote_index === current_game.gameState.presidentId
          ? (current_game.gameState.presidentVeto = true)
          : (current_game.gameState.chancellorVeto = true);
      } else {
        vote_index === current_game.gameState.presidentId
          ? (current_game.gameState.presidentVeto = false)
          : (current_game.gameState.chancellorVeto = false);
      }
      console.log(current_game.gameState);
      if (
        current_game.gameState.presidentVeto !== null &&
        current_game.gameState.chancellorVeto !== null
      ) {
        current_game.gameState.votes[current_game.gameState.presidentId] =
          current_game.gameState.presidentVeto;
        current_game.gameState.votes[current_game.gameState.chancellorId] =
          current_game.gameState.chancellorVeto;
        current_game.gameState.log.presidentVeto =
          current_game.gameState.presidentVeto;
        current_game.gameState.log.chancellorVeto =
          current_game.gameState.chancellorVeto;
        if (
          current_game.gameState.presidentVeto &&
          current_game.gameState.chancellorVeto
        ) {
          current_game.gameState.phase = "nomWait";
          current_game.gameState.discard.concat(
            current_game.gameState.chancellorHand.splice(0, 2)
          );
          current_game.gameState.failedGovs++;
          advancePres(current_game);
          if (current_game.gameState.failedGovs > 2) {
            current_game.gameState.failedGovs = 0;
            current_game.gameState.topDecks++;
            if (
              !(
                current_game.gameSetting.noTopdecking &&
                current_game.gameState.topDecks ===
                  current_game.gameSetting.noTopdecking
              )
            ) {
              if (current_game.gameState.deck.length === 0) {
                current_game.gameState.deck = shuffleArray(
                  current_game.gameState.deck.concat(
                    current_game.gameState.discard
                  )
                );
                current_game.gameState.discard = [];
              }
              const top_deck = current_game.gameState.deck.pop();
              current_game.gameState.log.enactedPolicy = policyMap[top_deck];
              if (top_deck === "B") {
                current_game.gameState.lib++;
                if (
                  current_game.customGameSettings.avalon &&
                  current_game.gameState.lib === 5
                )
                  current_game.gameState.phase = "assassinWait";
              } else {
                current_game.gameState.fas++;
              }
              current_game.gameState.lastPresidentId = -1;
              current_game.gameState.lastChancellorId = -1;
              reshuffleCheck(current_game);
            }
          }
          if (current_game.gameState.phase !== "assassinWait") {
            const deckState = current_game.gameState.deck.map(
              (e) => policyMap[e]
            );
            deckState.reverse();
            current_game.gameState.log.deckState = deckState;
            current_game.logs.push(current_game.gameState.log);
            current_game.gameState.log = {};
          }
        } else {
          current_game.gameState.phase = "chancWait";
          const color = current_game.gameState.chancellorHand.includes("B")
            ? current_game.gameState.chancellorHand.includes("R")
              ? "neutral"
              : "liberal"
            : "fascist";
          sendDM(
            message,
            current_game,
            `You have been passed **${current_game.gameState.chancellorHand.join(
              ""
            )}**.`,
            "Please choose a card to play.",
            current_game.players[current_game.gameState.chancellorId].id,
            color
          );
        }
        gameStateMessage(message, current_game);
        current_game.gameState.votes = Array(current_game.playerCount).fill(
          null
        );
        current_game.gameState.presidentVeto = null;
        current_game.gameState.chancellorVeto = null;
        checkGameEnd(message, current_game);
      }
      await game_info.set(current_game.game_id, current_game);
    } else {
      message.channel.send(errorMessage("Invalid veto pick!"));
    }
  } else {
    message.channel.send(errorMessage("Player not in game!"));
  }
}

module.exports = {
  name: "veto",
  aliases: [],
  execute,
};
