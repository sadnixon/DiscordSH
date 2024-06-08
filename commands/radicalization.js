const {
  errorMessage,
  gameStateMessage,
  sendDM,
  advancePres,
  policyMap,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);

    if (
      args &&
      _.range(0, current_game.players.length).includes(parseInt(args[0]) - 1) &&
      current_game.gameState.presidentId !== parseInt(args[0]) - 1 &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0]) - 1) &&
      !current_game.gameState.invPlayers.includes(parseInt(args[0]) - 1) &&
      current_game.gameState.phase === "radicalizationWait" && // Assuming this is the phase for radicalization
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      const selectedPlayer = parseInt(args[0]) - 1;
      const selectedPlayerRole = current_game.players[selectedPlayer].role;
      let radicalizationResult;

      if (selectedPlayerRole === "communist") {
        // Communists should know they can't radicalize a fellow communist
        message.channel.send(errorMessage("You can't radicalize a fellow communist!"));
        return;
      } else if (["fascist", "hitler", "monarchist"].includes(selectedPlayerRole)) {
        // Fascist-aligned players are not radicalized
        radicalizationResult = "fascist";
      } else if (["liberal", "merlin", "percival"].includes(selectedPlayerRole)) {
        // Liberal-aligned players are converted into communists
        radicalizationResult = "communist";
      } else {
        radicalizationResult = "unknown"; // Just in case there's an unexpected role
      }

      // Notify the communists excluding the recently radicalized one
      const communistsToNotify = current_game.players.filter(
        (player, index) =>
          player.role === "communist" &&
          index !== selectedPlayer &&
          !current_game.gameState.deadPlayers.includes(index)
      );
      communistsToNotify.forEach((communist) => {
        sendDM(
          message,
          current_game,
          `The player <@${current_game.players[selectedPlayer].id}> in seat **${parseInt(args[0])}** has been radicalized and is now **${radicalizationResult}**`,
          communist.id
        );
      });

      // Update game state
      current_game.gameState.phase = "nomWait"; // Assuming this is the phase after radicalization
      current_game.gameState.invPlayers.push(selectedPlayer);
      current_game.gameState.lastPresidentId = current_game.gameState.presidentId;
      current_game.gameState.lastChancellorId = current_game.gameState.chancellorId;
      await game_info.set(current_game.game_id, current_game);
      gameStateMessage(message, current_game);
    } else {
      message.channel.send(errorMessage("Invalid radicalization attempt!"));
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "radicalization",
  aliases: ["rad"],
  execute,
};
