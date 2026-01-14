const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  policyMap,
  synMap,
  handColor,
  sendToChannel,
  standardEmbed,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const player_games = await game_info.get("player_games");
  if (message.author.id in player_games) {
    const current_game = await game_info.get(player_games[message.author.id]);
    if (
      args.length &&
      current_game.gameState.phase === "presWait" &&
      current_game.gameState.presidentHand.includes(synMap(args[0])) &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      current_game.gameState.phase = "chancWait";
      current_game.gameState.discard.push(
        current_game.gameState.presidentHand.splice(
          current_game.gameState.presidentHand.indexOf(synMap(args[0])),
          1
        )[0]
      );
      current_game.gameState.chancellorHand =
        current_game.gameState.presidentHand.splice(0, 2);
      current_game.gameState.log.chancellorHand =
        current_game.gameState.chancellorHand.map((e) => policyMap[e]);
      const dmHeader = `You have been passed **${current_game.gameState.chancellorHand.join(
        ""
      )}**.`;
      let dmText;
      const color = handColor(current_game.gameState.chancellorHand);
      if (
        current_game.gameState.fas >= current_game.customGameSettings.vetoZone
      ) {
        current_game.gameState.phase = "vetoWait";
        dmText =
          "Vote Ja to veto playing either of these policies, or vote Nein to select a policy to play.";
        await sendDM(
          message,
          current_game,
          `You passed your chancellor **${current_game.gameState.chancellorHand.join(
            ""
          )}**.`,
          `Vote Ja to veto playing either of these policies, or vote Nein to allow your chancellor to select a policy.`,
          message.author.id,
          color
        );
      } else {
        dmText = "Please choose a card to play.";
      }
      await sendDM(
        message,
        current_game,
        dmHeader,
        dmText,
        current_game.players[current_game.gameState.chancellorId].id,
        color
      );
      await game_info.set(current_game.game_id, current_game);
      await sendToChannel(
        message,
        current_game,
        standardEmbed(
          `Policy Played!`,
          `${current_game.gameState.presidentId + 1}. <@${
            message.author.id
          }> discarded a policy.`
        )
      );
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
