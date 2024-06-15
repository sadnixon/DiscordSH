const {
  errorMessage,
  gameStateMessage,
  sendDM,
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
    const anarchist_index = current_game.players.findIndex(
      (player) => player.role === "anarchist"
    );

    if (
      args &&
      _.range(0, current_game.players.length).includes(parseInt(args[0]) - 1) &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0]) - 1) &&
      current_game.gameState.phase === "confessionWait"
    ) {
      const executedPlayerIndex = parseInt(args[0]) - 1;
      const executedPlayerRole = current_game.players[executedPlayerIndex].role;
      current_game.gameState.deadPlayers.push(executedPlayerIndex);
      current_game.gameState.phase = "nomWait";

      if (executedPlayerIndex === hitler_index) {
        // If the killed player is Hitler, perform actions accordingly
        current_game.gameState.hitlerDead = true;
        if (current_game.customGameSettings.avalon)
          current_game.gameState.phase = "assassinWait";
      }

      if (executedPlayerIndex === capitalist_index) {
        // If the killed player is the capitalist, enter radicalizationWait
        current_game.gameState.phase = "radicalizationWait";
      }

      current_game.gameState.log.execution = executedPlayerIndex;
      const deckState = current_game.gameState.deck.map((e) => policyMap[e]);
      deckState.reverse();
      current_game.gameState.log.deckState = deckState;
      current_game.logs.push(current_game.gameState.log);
      current_game.gameState.log = {};

      // Determine the alignment of the executed player
      const alignmentMap = {
        communist: "communist",
        anarchist: "communist",
        liberal: "liberal",
        capitalist: "liberal",
        percival: "liberal",
        merlin: "liberal",
        centrist: "liberal",
        hitler: "fascist",
        fascist: "fascist",
        monarchist: "fascist",
        morgana: "fascist"
      };

      const executedPlayerAlignment = alignmentMap[executedPlayerRole] || "unknown";

      // Announce the executed player's alignment in the chat
      message.channel.send(
        standardEmbed(
          `Confession made!`,
          `The player in seat **${executedPlayerIndex + 1}** was **${executedPlayerAlignment}**!`,
          "communist"
        )
      );

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
  name: "confession",
  execute,
};
