const {
  errorMessage,
  gameStateMessage,
  sendDM,
  advancePres,
  policyMap,
  standardEmbed,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);

    if (
      args.length &&
      _.range(0, current_game.players.length).includes(parseInt(args[0]) - 1) &&
      current_game.gameState.presidentId !== parseInt(args[0]) - 1 &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0]) - 1) &&
      !current_game.gameState.invPlayers.includes(parseInt(args[0]) - 1) &&
      current_game.gameState.phase === "bugWait" &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      const selectedPlayer = parseInt(args[0]) - 1;
      const selectedPlayerRole = current_game.players[selectedPlayer].role;
      let buggingResult;

      if (["liberal", "merlin", "percival","centrist"].includes(selectedPlayerRole)) {
        buggingResult = "liberal";
      } else if (["fascist", "hitler", "monarchist","capitalist","morgana"].includes(selectedPlayerRole)) {
        buggingResult = "fascist";
      } else if (["communist","anarchist"].includes(selectedPlayerRole)) {
        buggingResult = "communist";
      } else {
        buggingResult = "unknown"; // Just in case there's an unexpected role
      }

      // Notify the president
      await sendDM(
        message,
        current_game,
        "Bugging Results:",
        `The player <@${
          current_game.players[selectedPlayer].id
        }> in seat **${parseInt(args[0])}** is **${buggingResult}**`,
        message.author.id,
        buggingResult
      );

      // Notify the chancellor
      await sendDM(
        message,
        current_game,
        "Bugging Results:",
        `The player <@${
          current_game.players[selectedPlayer].id
        }> in seat **${parseInt(args[0])}** is **${buggingResult}**`,
        current_game.players[current_game.gameState.chancellorId].id,
        buggingResult
      );

      current_game.gameState.phase = "nomWait";
      current_game.gameState.invPlayers.push(selectedPlayer);
      current_game.gameState.lastPresidentId =
        current_game.gameState.presidentId;
      current_game.gameState.lastChancellorId =
        current_game.gameState.chancellorId;
      current_game.gameState.log.buggingId = selectedPlayer;
      advancePres(current_game);
      const deckState = current_game.gameState.deck.map((e) => policyMap[e]);
      deckState.reverse();
      current_game.gameState.log.deckState = deckState;
      current_game.logs.push(current_game.gameState.log);
      current_game.gameState.log = {};
      await game_info.set(current_game.game_id, current_game);
      await message.channel.send(
        standardEmbed(
          `Bugging made!`,
          `${current_game.gameState.lastPresidentId + 1}. <@${
            message.author.id
          }> bugged ${parseInt(args[0])}. <@${
            current_game.players[selectedPlayer].id
          }>`,
          "communist"
        )
      );
      gameStateMessage(message, current_game);
    } else {
      message.channel.send(errorMessage("Invalid bugging pick!"));
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "bugging",
  aliases: ["bug"],
  execute,
};
