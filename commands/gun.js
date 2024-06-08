const {
  errorMessage,
  gameStateMessage,
  advancePres,
  checkGameEnd,
  policyMap,
  standardEmbed,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    const hitler_index = current_game.players.findIndex(
      (player) => player.role === "hitler"
    );
    const capitalist_index = current_game.players.findIndex(
      (player) => player.role === "capitalist"
    );
    if (
      args.length &&
      _.range(0, current_game.players.length).includes(parseInt(args[0]) - 1) &&
      current_game.gameState.presidentId !== parseInt(args[0]) - 1 &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0]) - 1) &&
      current_game.gameState.phase === "gunWait" &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      current_game.gameState.deadPlayers.push(parseInt(args[0]) - 1);
      current_game.gameState.phase = "nomWait";
      if (parseInt(args[0]) - 1 === hitler_index) {
        current_game.gameState.hitlerDead = true;
        if (current_game.customGameSettings.avalon)
          current_game.gameState.phase = "assassinWait";
      } else if (parseInt(args[0]) - 1 === capitalist_index) {
        current_game.gameState.phase = "radicalizationWait";
      }
      current_game.gameState.lastPresidentId =
        current_game.gameState.presidentId;
      current_game.gameState.lastChancellorId =
        current_game.gameState.chancellorId;
      current_game.gameState.log.execution = parseInt(args[0]) - 1;
      advancePres(current_game);
      if (current_game.gameState.phase !== "assassinWait") {
        const deckState = current_game.gameState.deck.map((e) => policyMap[e]);
        deckState.reverse();
        current_game.gameState.log.deckState = deckState;
        current_game.logs.push(current_game.gameState.log);
        current_game.gameState.log = {};
      }
      await game_info.set(current_game.game_id, current_game);
      await message.channel.send(
        standardEmbed(
          `Shot made!`,
          `${current_game.gameState.lastPresidentId + 1}. <@${
            message.author.id
          }> shot ${parseInt(args[0])}. <@${
            current_game.players[parseInt(args[0]) - 1].id
          }>`,
          "fascist"
        )
      );
      gameStateMessage(message, current_game);
      checkGameEnd(message, current_game);
    } else if (
      args.length &&
      _.range(0, current_game.players.length).includes(parseInt(args[0]) - 1) &&
      !["hitler", "monarchist", "morgana", "fascist"].includes(
        current_game.players[parseInt(args[0]) - 1].role
      ) &&
      current_game.gameState.phase === "assassinWait" &&
      current_game.players[hitler_index].id === message.author.id
    ) {
      current_game.gameState.assassinatedPlayer = parseInt(args[0]) - 1;
      current_game.gameState.log.assassination = parseInt(args[0]) - 1;
      current_game.gameState.deadPlayers = [parseInt(args[0]) - 1];

      const deckState = current_game.gameState.deck.map((e) => policyMap[e]);
      deckState.reverse();
      current_game.gameState.log.deckState = deckState;
      current_game.logs.push(current_game.gameState.log);
      current_game.gameState.log = {};
      await game_info.set(current_game.game_id, current_game);
      gameStateMessage(message, current_game);
      checkGameEnd(message, current_game);
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
