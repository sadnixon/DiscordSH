const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  roleListConstructor,
  standardEmbed,
  roleLists,
} = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);

    if (
      current_game.gameState.phase === "joinWait" &&
      !(
        current_game.players
          .map((player) => player.id)
          .includes(message.author.id) && !(args.length && args[0] === "test")
      )
    ) {
      if (args.length && args[0] === "test") {
        const seats_num =
          current_game.playerCount - current_game.players.length;
        for (let i = 0; i < seats_num; i++) {
          current_game.players.push({ id: message.author.id });
        }
      } else {
        current_game.players.push({ id: message.author.id });
      }

      const player_games = await game_info.get("player_games");
      player_games[message.author.id] = channels[message.channel.id];
      await game_info.set("player_games", player_games);

      if (current_game.players.length === current_game.playerCount) {
        current_game.gameState.phase = "nomWait";
        current_game.gameState.presidentId = 0;
        await game_info.set(current_game.game_id, current_game);

        await message.channel.send(
          standardEmbed(
            `Game full... Starting momentarily...`,
            `<@${message.author.id}> has joined the game!`
          )
        );

        current_game.players = shuffleArray(current_game.players);

        const roles = roleListConstructor(current_game);

        for (let i = 0; i < current_game.playerCount; i++) {
          current_game.players[i].role = roles[i];
          current_game.players[i].seat = i;
          current_game.player_ids[current_game.players[i].id] = i;
        }

        await notifyRoles(message, current_game, roles);

        gameStateMessage(message, current_game);
      } else {
        await message.channel.send(
          standardEmbed(
            `Seats filled: ${current_game.players.length}/${current_game.playerCount}`,
            `<@${message.author.id}> has joined the game!`
          )
        );
      }
      await game_info.set(current_game.game_id, current_game);
    } else {
      if (current_game.gameState.phase !== "joinWait") {
        message.channel.send(errorMessage("Game already started!"));
      } else {
        message.channel.send(errorMessage("Already joined game!"));
      }
    }
  } else {
    message.channel.send(errorMessage("No game in this channel!"));
  }
}

async function notifyRoles(message, current_game, roles) {
  let player_message;
  for (let i = 0; i < current_game.playerCount; i++) {
    player_message = `Your seat is **${i + 1}** and your role is **${
      roles[i]
    }**`;
    if (
      ["fascist", "morgana"].includes(roles[i]) ||
      (roles[i] === "hitler" && current_game.customGameSettings.hitKnowsFas)
    ) {
      player_message += "\n\n**Role Notifications:**";
      for (let j = 0; j < current_game.playerCount; j++) {
        if (i !== j && ["fascist", "hitler", "morgana"].includes(roles[j])) {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${current_game.players[j].seat + 1}** is **${
            roles[j]
          }**.`;
        } else if (i !== j && roles[j] === "monarchist") {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${current_game.players[j].seat + 1}** is **fascist**.`;
        }
      }
    } else if (roles[i] === "merlin") {
      player_message += "\n\n**Role Notifications:**";
      for (let j = 0; j < current_game.playerCount; j++) {
        if (["fascist", "monarchist", "hitler", "morgana"].includes(roles[j])) {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${current_game.players[j].seat + 1}** is **fascist**.`;
        }
      }
    } else if (roles[i] === "monarchist") {
      player_message += "\n\n**Role Notifications:**";
      for (let j = 0; j < current_game.playerCount; j++) {
        if (i !== j && ["fascist", "morgana"].includes(roles[j])) {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${current_game.players[j].seat + 1}** is **fascist**.`;
        }
      }
    } else if (roles[i] === "percival") {
      player_message += "\n\n**Role Notifications:**";
      for (let j = 0; j < current_game.playerCount; j++) {
        if (
          i !== j &&
          (["merlin", "morgana"].includes(roles[j]) ||
            (current_game.playerCount < 7 && roles[j] === "monarchist"))
        ) {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${
            current_game.players[j].seat + 1
          }** could be **merlin**.`;
        }
      }
    } else if (roles[i] === "centrist") {
      player_message += "\n\n**Role Notifications:**";
      for (let j = 0; j < current_game.playerCount; j++) {
        if (i !== j && roles[j] === "centrist") {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${current_game.players[j].seat + 1}** is **centrist**.`;
        }
      }
    } else if (roles[i] === "communist") {
      player_message += "\n\n**Role Notifications:**";
      for (let j = 0; j < current_game.playerCount; j++) {
        if (i !== j && (roles[j] === "communist" || roles[j] === "anarchist")) {
          player_message += `\nThe player <@${
            current_game.players[j].id
          }> in seat **${current_game.players[j].seat + 1}** is **${
            roles[j]
          }**.`;
        }
      }
    }
    await sendDM(
      message,
      current_game,
      "Role Assignment:",
      player_message,
      current_game.players[i].id,
      roleLists.liberal.includes(roles[i])
        ? "liberal"
        : roleLists.communist.includes(roles[i])
        ? "communist"
        : "fascist"
    );
  }
}

module.exports = {
  name: "join",
  aliases: [],
  execute,
};
