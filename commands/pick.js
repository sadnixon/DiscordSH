const {
  errorMessage,
  gameStateMessage,
  standardEmbed,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    let termlocked = [
      current_game.gameState.presidentId,
      current_game.gameState.lastChancellorId,
    ];
    if (
      current_game.players.length - current_game.gameState.deadPlayers.length >
      5
    ) {
      termlocked.push(current_game.gameState.lastPresidentId);
    }
    if (
      args.length &&
      _.range(0, current_game.players.length).includes(parseInt(args[0]) - 1) &&
      !termlocked.includes(parseInt(args[0]) - 1) &&
      !current_game.gameState.deadPlayers.includes(parseInt(args[0]) - 1) &&
      current_game.gameState.phase === "nomWait" &&
      current_game.players[current_game.gameState.presidentId].id ===
        message.author.id
    ) {
      current_game.gameState.chancellorId = parseInt(args[0]) - 1;
      current_game.gameState.phase = "voteWait";
      await game_info.set(current_game.game_id, current_game);
      await message.channel.send(
        standardEmbed(
          `Chancellor pick made!`,
          `${current_game.gameState.presidentId + 1}. <@${
            message.author.id
          }> picked ${current_game.gameState.chancellorId + 1}. <@${
            current_game.players[current_game.gameState.chancellorId].id
          }> as Chancellor`
        )
      );
      gameStateMessage(message, current_game);
    } else {
      message.channel.send(errorMessage("Invalid chancellor pick!"));
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "pick",
  aliases: [],
  execute,
};
