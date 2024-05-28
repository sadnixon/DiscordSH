const { MessageActivityType } = require("discord.js");
const {
  errorMessage,
  standardEmbed,
} = require("../message-helpers");
const _ = require("lodash");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);
    let void_threshold;
    if (
      current_game.players
        .map((player) => player.id)
        .includes(message.author.id)
    ) {
      if (current_game.gameState.phase === "joinWait") {
        void_threshold = Math.ceil(current_game.players.length / 2);
      } else {
        void_threshold =
          current_game.playerCount -
          current_game.customGameSettings.fascistCount +
          1;
      }
      if (!current_game.voidVotes.includes(message.author.id)) {
        if (args && args[0] === "all") {
          const seats_num = current_game.players.filter(
            (e) => e.id === message.author.id
          ).length;
          for (let i = 0; i < seats_num; i++) {
            current_game.voidVotes.push(message.author.id);
          }
        } else {
          current_game.voidVotes.push(message.author.id);
        }

        await game_info.set(current_game.game_id, current_game);
        if (current_game.voidVotes.length >= void_threshold) {
          const player_games = await game_info.get("player_games");
          for (let i = 0; i < current_game.players.length; i++) {
            delete player_games[current_game.players[i].id];
          }
          const channels = await game_info.get("game_channels");
          delete channels[current_game.channel_id];
          await game_info.set("game_channels", channels);
          await game_info.set("player_games", player_games);
          await game_info.delete(current_game.game_id);
          await message.channel.send(
            standardEmbed(
              `Void Threshold has been reached! Game VOIDED.`,
              `<@${message.author.id}> has voted to void game.`
            )
          );
        } else {
          await message.channel.send(
            standardEmbed(
              `Votes to void: ${current_game.voidVotes.length}/${void_threshold}`,
              `<@${message.author.id}> has voted to void game.`
            )
          );
        }
      } else {
        const not_user = (player) => {
          player !== message.author.id;
        };
        current_game.voidVotes = current_game.voidVotes.filter(not_user);
        await game_info.set(current_game.game_id, current_game);
        await message.channel.send(
          standardEmbed(
            `Votes to void: ${current_game.voidVotes.length}/${void_threshold}`,
            `<@${message.author.id}> has removed their vote to void game.`
          )
        );
      }
    } else {
      message.channel.send(errorMessage("Not in game!"));
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

module.exports = {
  name: "void",
  aliases: [],
  execute,
};
