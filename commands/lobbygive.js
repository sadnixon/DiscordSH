const {
  errorMessage,
  standardEmbed,
  sendToChannel,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const player_games = await game_info.get("player_games");
  if (message.author.id in player_games) {
    const current_game = await game_info.get(player_games[message.author.id]);
    const capitalist_index = current_game.players.findIndex(
      (player) => player.role === "capitalist"
    );

    // Check if the capitalist has already given out the lobby card
    if (current_game.players[capitalist_index].hasGivenLobbyCard) {
      return await message.channel.send(
        errorMessage("The capitalist has already given out the lobby card.")
      );
    }

    // Command to give the lobby card to another living player
    if (message.author.id === current_game.players[capitalist_index].id) {
      const lobbyRecipientIndex = parseInt(args[0]) - 1;

      if (
        lobbyRecipientIndex >= 0 &&
        lobbyRecipientIndex < current_game.players.length &&
        !current_game.gameState.deadPlayers.includes(lobbyRecipientIndex)
      ) {
        // Transfer lobby card to the lobbyRecipient
        current_game.players[capitalist_index].hasLobbyCard = false;
        current_game.players[capitalist_index].hasGivenLobbyCard = true;
        current_game.players[lobbyRecipientIndex].hasLobbyCard = true;

        await game_info.set(current_game.game_id, current_game);

        await sendToChannel(
          message,
          current_game,
          standardEmbed(
            "Lobby Card Transfer",
            `The capitalist has given the lobby card to <@${current_game.players[lobbyRecipientIndex].id}>.`
          )
        );
      } else {
        await message.channel.send(
          errorMessage(
            "Invalid lobby card recipient. Make sure to provide the ID of a living player."
          )
        );
      }
    }
  } else {
    message.channel.send(errorMessage("Player not in game!"));
  }
}

module.exports = {
  name: "lobbygive",
  execute,
};
