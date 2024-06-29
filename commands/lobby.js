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
    const playerIndex = current_game.players.findIndex(
      (player) => player.id === message.author.id
    );

    if (playerIndex === -1) {
      await message.channel.send(
        errorMessage("You are not part of this game.")
      );
      return;
    }

    if (!current_game.players[playerIndex].hasLobbyCard) {
      await message.channel.send(
        errorMessage("You do not have a lobby card to use.")
      );
      return;
    }

    // Check if the lobby card has not been used
    if (!current_game.gameState.lobbyUsed) {
      current_game.gameState.lobbyUsed = true;
      current_game.players[playerIndex].usedLobbyCard = true;
      current_game.players[playerIndex].extraVotes = 2;

      await game_info.set(current_game.game_id, current_game);

      await sendToChannel(
        message,
        current_game,
        standardEmbed(
          "Lobby Power Activated",
          `<@${message.author.id}> has activated their lobby power for one election.`
        )
      );
    } else {
      await message.channel.send(
        errorMessage("You have already used your lobby card.")
      );
    }
  } else {
    message.channel.send(errorMessage("Player not in game!"));
  }
}

module.exports = {
  name: "lobby",
  execute,
};
