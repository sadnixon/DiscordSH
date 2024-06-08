const { errorMessage, gameStateMessage, advancePres, checkGameEnd, policyMap, standardEmbed } = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    const capitalist_index = current_game.players.findIndex((player) => player.role === "capitalist");

    // Command to give the lobby card to another living player (assuming "lobbyTransfer" phase)
    if (
      current_game.gameState.phase === "radicalizationWait" &&
      message.author.id === current_game.players[capitalist_index].id
    ) {
      const lobbyRecipientId = args[0];
      const lobbyRecipientIndex = current_game.players.findIndex(
        (player) => player.id === lobbyRecipientId && !current_game.gameState.deadPlayers.includes(player.index)
      );

      if (lobbyRecipientIndex !== -1) {
        // Transfer lobby card to the lobbyRecipient
        current_game.players[capitalist_index].hasLobbyCard = false;
        current_game.players[lobbyRecipientIndex].hasLobbyCard = true;
        await sendToChannel(
          message,
          current_game,
          `The capitalist (${message.author.id}) has given the lobby card to <@${lobbyRecipientId}>.`
        );
      } else {
        await sendToChannel(
          message,
          current_game,
          `Invalid lobbyRecipient. Make sure to provide the ID of a living player.`
        );
      }
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "lobbytransfer",
  execute,
};
