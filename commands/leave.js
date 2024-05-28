const {
  errorMessage,
  standardEmbed,
  roleLists,
} = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    if (
      current_game.gameState.phase === "joinWait" &&
      current_game.players
        .map((player) => player.id)
        .includes(message.author.id)
    ) {
      current_game.players = current_game.players.filter(
        (e) => e.id !== message.author.id
      );
      const player_games = await game_info.get("player_games");
      delete player_games[message.author.id];
      await game_info.set("player_games", player_games);
      await game_info.set(current_game.game_id, current_game);
      await message.channel.send(
        standardEmbed(
          `Seats filled: ${current_game.players.length}/${current_game.playerCount}`,
          `<@${message.author.id}> has left the game...`
        )
      );
    } else {
      if (current_game.gameState.phase !== "joinWait") {
        message.channel.send(errorMessage("Game already started!"));
      } else {
        message.channel.send(errorMessage("Not in game!"));
      }
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "leave",
  aliases: [],
  execute,
};
