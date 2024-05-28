const {
  errorMessage,
  sendDM,
  gameStateMessage,
  advancePres,
  checkGameEnd,
  policyMap,
  reshuffleCheck,
  standardEmbed,
  sendToChannel,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const player_games = await game_info.get("player_games");
  if (message.author.id in player_games) {
    const current_game = await game_info.get(player_games[message.author.id]);
    if (
      args.length &&
      ["ja", "nein"].includes(args[0].toLowerCase()) &&
      current_game.gameState.phase === "voteWait"
    ) {
      let vote_index = current_game.player_ids[message.author.id];
      let voting_all = false;
      if (
        args.length > 1 &&
        _.range(0, current_game.players.length).includes(
          parseInt(args[1]) - 1
        ) &&
        !current_game.gameState.deadPlayers.includes(parseInt(args[1]) - 1) &&
        current_game.players[parseInt(args[1]) - 1].id === message.author.id
      ) {
        vote_index = parseInt(args[1]) - 1;
      } else if (
        args.length > 1 &&
        args[1].toLowerCase() === "all" &&
        current_game.players
          .map((e) => e.id)
          .every((e) => e === message.author.id)
      ) {
        voting_all = true;
      }
      if (current_game.gameState.deadPlayers.includes(vote_index))
        return message.channel.send(errorMessage("You are dead!"));

      if (voting_all) {
        for (i = 0; i < current_game.players.length; i++) {
          if (!current_game.gameState.deadPlayers.includes(i)) {
            current_game.gameState.votes[i] =
              args[0].toLowerCase() === "ja" ? true : false;
          }
        }
      } else {
        current_game.gameState.votes[vote_index] =
          args[0].toLowerCase() === "ja" ? true : false;
      }

      const vote_list = _.range(0, current_game.players.length).map(
        (i) => current_game.gameState.votes[i]
      );

      if (
        vote_list.filter((e) => e !== null).length ===
        current_game.players.length - current_game.gameState.deadPlayers.length
      ) {
        await sendToChannel(
          message,
          current_game,
          standardEmbed(
            `All players have voted!`,
            `${vote_index + 1}. <@${message.author.id}> has voted.`
          )
        );
        current_game.gameState.log.votes = vote_list;
        current_game.gameState.log.presidentId =
          current_game.gameState.presidentId;
        current_game.gameState.log.chancellorId =
          current_game.gameState.chancellorId;
        if (
          vote_list.filter((e) => e).length >
          vote_list.filter((e) => e !== null).length / 2
        ) {
          if (
            current_game.gameState.fas >=
              current_game.customGameSettings.hitlerZone &&
            current_game.players[current_game.gameState.chancellorId].role ===
              "hitler"
          ) {
            current_game.gameState.hitlerElected = true;
            const deckState = current_game.gameState.deck.map(
              (e) => policyMap[e]
            );
            deckState.reverse();
            current_game.gameState.log.deckState = deckState;
            current_game.logs.push(current_game.gameState.log);
            current_game.gameState.log = {};
          }
          current_game.gameState.phase = "presWait";
          for (let i = 0; i < 3; i++) {
            current_game.gameState.presidentHand.push(
              current_game.gameState.deck.pop()
            );
          }
          current_game.gameState.log.presidentHand =
            current_game.gameState.presidentHand.map((e) => policyMap[e]);
          const color = current_game.gameState.presidentHand.includes("B")
            ? current_game.gameState.presidentHand.includes("R")
              ? "neutral"
              : "liberal"
            : "fascist";
          sendDM(
            message,
            current_game,
            `You have drawn **${current_game.gameState.presidentHand.join(
              ""
            )}**.`,
            "Please choose a card to discard.",
            current_game.players[current_game.gameState.presidentId].id,
            color
          );
        } else {
          current_game.gameState.phase = "nomWait";
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
        }
        gameStateMessage(message, current_game);
        current_game.gameState.votes = Array(current_game.playerCount).fill(
          null
        );
        checkGameEnd(message, current_game);
      } else {
        await sendToChannel(
          message,
          current_game,
          standardEmbed(
            `Votes: ${vote_list.filter((e) => e !== null).length}/${
              current_game.players.length -
              current_game.gameState.deadPlayers.length
            }`,
            `${vote_index + 1}. <@${message.author.id}> has voted.`
          )
        );
      }
      await game_info.set(current_game.game_id, current_game);
    } else if (current_game.gameState.phase === "voteWait") {
      let vote_index = current_game.player_ids[message.author.id];
      if (current_game.gameState.deadPlayers.includes(vote_index))
        return message.channel.send(errorMessage("You are dead!"));
      current_game.gameState.votes[vote_index] = null;
      const vote_list = _.range(0, current_game.players.length).map(
        (i) => current_game.gameState.votes[i]
      );
      await game_info.set(current_game.game_id, current_game);
      await sendToChannel(
        message,
        current_game,
        standardEmbed(
          `Votes: ${vote_list.filter((e) => e !== null).length}/${
            current_game.players.length -
            current_game.gameState.deadPlayers.length
          }`,
          `${vote_index + 1}. <@${message.author.id}> has unvoted.`
        )
      );
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
