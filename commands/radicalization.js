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
      current_game.gameState.phase === "radicalizationWait"
    ) {
      const selectedPlayerIndex = parseInt(args[0]) - 1;
      const selectedPlayer = current_game.players[selectedPlayerIndex];

      if (!selectedPlayer) {
        message.channel.send(errorMessage("Selected player not found!"));
        return;
      }

      const selectedPlayerRole = selectedPlayer.role;
      let radicalizationResult;

      if (selectedPlayerRole === "communist" || selectedPlayerRole === "anarchist") {
        message.channel.send(errorMessage("You can't radicalize a fellow communist!"));
        return;
      } else if (["fascist", "hitler", "monarchist", "capitalist", "morgana"].includes(selectedPlayerRole)) {
        radicalizationResult = "fascist";
      } else if (["liberal", "merlin", "percival", "centrist"].includes(selectedPlayerRole)) {
        radicalizationResult = "communist";
        // Update the role of the radicalized player to communist
        selectedPlayer.role = "communist";
      } else {
        radicalizationResult = "unknown"; // Just in case there's an unexpected role
      }

      // Notify the communists
      const communistsToNotify = current_game.players.filter(
        (player, index) =>
          player.role === "communist" &&
          index !== selectedPlayerIndex &&
          !current_game.gameState.deadPlayers.includes(index)
      );
      for (const communist of communistsToNotify) {
        await sendDM(
          message,
          current_game,
          "Radicalization Results:",
          `The player <@${selectedPlayer.id}> in seat **${parseInt(args[0])}** has been radicalized and is now **${radicalizationResult}**`,
          communist.id,
          radicalizationResult
        );
      }

      // Notify the radicalized player if they were liberal and are now communist
      if (radicalizationResult === "communist") {
        await sendDM(
          message,
          current_game,
          "You have been radicalized!",
          `You have been radicalized and are now a **communist**`,
          selectedPlayer.id,
          radicalizationResult
        );
      }

      // Update game state
      current_game.gameState.phase = "nomWait";
      current_game.gameState.invPlayers.push(selectedPlayerIndex);
      current_game.gameState.lastPresidentId = current_game.gameState.presidentId;
      current_game.gameState.lastChancellorId = current_game.gameState.chancellorId;
      current_game.gameState.log.radicalizationId = selectedPlayerIndex;
      advancePres(current_game);
      const deckState = current_game.gameState.deck.map((e) => policyMap[e]);
      deckState.reverse();
      current_game.gameState.log.deckState = deckState;
      current_game.logs.push(current_game.gameState.log);
      current_game.gameState.log = {};
      await game_info.set(current_game.game_id, current_game);
      await message.channel.send(
        standardEmbed(
          `Radicalization made!`,
          `The communists have radicalized one player.`,
          "communist"
        )
      );
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
