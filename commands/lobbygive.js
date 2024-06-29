const { errorMessage, gameStateMessage, advancePres, checkGameEnd, policyMap, standardEmbed } = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    const capitalist_index = current_game.players.findIndex((player) => player.role === "capitalist");

    console.log(`Capitalist Index: ${capitalist_index}`);

    // Check if the capitalist has already given out the lobby card
    if (current_game.players[capitalist_index].hasGivenLobbyCard) {
      await message.channel.send(
        standardEmbed(
          "Lobby Card Transfer",
          "The capitalist has already given out the lobby card."
        )
      );
      return;
    }

    // Command to give the lobby card to another living player
    if (message.author.id === current_game.players[capitalist_index].id) {
      const lobbyRecipientIndex = parseInt(args[0]) - 1;

      console.log(`Lobby Recipient Index: ${lobbyRecipientIndex}`);
      console.log(`Dead Players: ${JSON.stringify(current_game.gameState.deadPlayers)}`);

      if (lobbyRecipientIndex >= 0 && lobbyRecipientIndex < current_game.players.length && !current_game.gameState.deadPlayers.includes(lobbyRecipientIndex)) {
        // Transfer lobby card to the lobbyRecipient
        current_game.players[capitalist_index].hasLobbyCard = false;
        current_game.players[capitalist_index].hasGivenLobbyCard = true;
        current_game.players[lobbyRecipientIndex].hasLobbyCard = true;

        await game_info.set(channels[message.channel.id], current_game);

        await message.channel.send(
          standardEmbed(
            "Lobby Card Transfer",
            `The capitalist has given the lobby card to <@${current_game.players[lobbyRecipientIndex].id}>.`
          )
        );
      } else {
        await message.channel.send(
          standardEmbed(
            "Invalid Player",
            "Invalid lobby card recipient. Make sure to provide the ID of a living player."
          )
        );
      }
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "lobbygive",
  execute,
};
