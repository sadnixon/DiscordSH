const {
  errorMessage,
  gameStateMessage,
  sendDM,
  advancePres,
  checkGameEnd,
  policyMap,
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
      current_game.gameState.phase === "nomWait" &&
      current_game.players[anarchist_index].id === message.author.id &&
      !current_game.gameState.anarchistShot
    ) {
      current_game.gameState.deadPlayers.push(parseInt(args[0]) - 1);
      current_game.gameState.phase = "nomWait";
      current_game.gameState.anarchistShot = true;

      if (parseInt(args[0]) - 1 === hitler_index) {
        // If the killed player is Hitler, perform actions accordingly
        current_game.gameState.hitlerDead = true;
        if (current_game.customGameSettings.avalon)
          current_game.gameState.phase = "assassinWait";
      }

      if (parseInt(args[0]) - 1 === capitalist_index) {
        // If the killed player is the capitalist, enter radicalizationWait
        current_game.gameState.phase = "radicalizationWait";
      }

      current_game.gameState.log.execution = parseInt(args[0]) - 1;
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
  name: "anarchistgun",
  execute,
};
