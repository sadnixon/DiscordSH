const { errorMessage, gameStateMessage, standardEmbed } = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  console.log(`Channels: ${JSON.stringify(channels)}`); // Log channels data
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    console.log(`Current game: ${JSON.stringify(current_game)}`); // Log current game data
    const playerIndex = current_game.players.findIndex((player) => player.id === message.author.id);

    if (playerIndex === -1) {
      await message.channel.send(errorMessage("You are not part of this game."));
      console.log(`Player with ID ${message.author.id} is not part of the game.`); // Log player not found
      return;
    }

    if (!current_game.players[playerIndex].hasLobbyCard) {
      await message.channel.send(errorMessage("You do not have a lobby card to use."));
      console.log(`Player with ID ${message.author.id} does not have a lobby card.`); // Log player without lobby card
      return;
    }

    if (current_game.players[playerIndex].usedLobbyCard) {
      await message.channel.send(errorMessage("You have already used your lobby card."));
      console.log(`Player with ID ${message.author.id} has already used their lobby card.`); // Log player already used lobby card
      return;
    }

    current_game.players[playerIndex].usedLobbyCard = true;
    current_game.players[playerIndex].extraVotes = 2;

    await game_info.set(channels[message.channel.id], current_game);

    await message.channel.send(
      standardEmbed(
        "Lobby Power Activated",
        `<@${message.author.id}> has activated their lobby power for one election.`
      )
    );
    console.log(`Player with ID ${message.author.id} activated lobby power.`); // Log lobby power activation
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
    console.log(`No game found in channel ${message.channel.id}.`); // Log no game in channel
  }
}

module.exports = {
  name: "lobby",
  execute,
};
