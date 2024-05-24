const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  roleListConstructor,
} = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const current_game = await game_info.get(channels[message.channel.id]);

    if (
      current_game.gameState.phase === "joinWait" &&
      !current_game.players
        .map((player) => player.id)
        .includes(message.author.id)
    ) {
      if (args && args[0] === "test") {
        for (let i = 0; i < current_game.playerCount; i++) {
          current_game.players.push({ id: message.author.id });
        }
      } else {
        current_game.players.push({ id: message.author.id });
      }

      const player_games = await game_info.get("player_games");
      player_games[message.author.id] = channels[message.channel.id];
      game_info.set("player_games", player_games);

      if (current_game.players.length === current_game.playerCount) {
        current_game.gameState.phase = "nomWait";
        current_game.gameState.presidentId = 0;
        await game_info.set(current_game.game_id, current_game);
        current_game.players = shuffleArray(current_game.players);

        const roles = roleListConstructor(current_game);

        for (let i = 0; i < current_game.playerCount; i++) {
          current_game.players[i].role = roles[i];
          current_game.players[i].seat = i;
          current_game.player_ids[current_game.players[i].id] = i;
          await sendDM(
            message,
            current_game,
            `Your seat is **${i + 1}** and your role is **${roles[i]}**`,
            current_game.players[i].id
          );
        }

        await notifyRoles(message, current_game, roles);

        gameStateMessage(message, current_game);
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
  for (let i = 0; i < current_game.playerCount; i++) {
    const player = current_game.players[i];
    if (
      ["fascist", "morgana"].includes(roles[i]) ||
      (roles[i] === "hitler" && current_game.customGameSettings.hitKnowsFas)
    ) {
      for (let j = 0; j < current_game.playerCount; j++) {
        if (i !== j && ["fascist", "hitler", "morgana"].includes(roles[j])) {
          await sendDM(
            message,
            current_game,
            `The player <@${current_game.players[j].id}> in seat **${
              current_game.players[j].seat + 1
            }** is **${roles[j]}**.`,
            current_game.players[i].id
          );
        } else if (i !== j && roles[j] === "monarchist") {
          await sendDM(
            message,
            current_game,
            `The player <@${current_game.players[j].id}> in seat **${
              current_game.players[j].seat + 1
            }** is **fascist**.`,
            current_game.players[i].id
          );
        }
      }
    } else if (roles[i] === "merlin") {
      for (let j = 0; j < current_game.playerCount; j++) {
        if (["fascist", "monarchist", "hitler", "morgana"].includes(roles[j])) {
          await sendDM(
            message,
            current_game,
            `The player <@${current_game.players[j].id}> in seat **${
              current_game.players[j].seat + 1
            }** is **fascist**.`,
            current_game.players[i].id
          );
        }
      }
    } else if (roles[i] === "monarchist") {
      for (let j = 0; j < current_game.playerCount; j++) {
        if (i !== j && ["fascist", "morgana"].includes(roles[j])) {
          await sendDM(
            message,
            current_game,
            `The player <@${current_game.players[j].id}> in seat **${
              current_game.players[j].seat + 1
            }** is **fascist**.`,
            current_game.players[i].id
          );
        }
      }
    } else if (roles[i] === "percival") {
      for (let j = 0; j < current_game.playerCount; j++) {
        if (
          i !== j &&
          (["merlin", "morgana"].includes(roles[j]) ||
            (current_game.playerCount < 7 && roles[j] === "monarchist"))
        ) {
          await sendDM(
            message,
            current_game,
            `The player <@${current_game.players[j].id}> in seat **${
              current_game.players[j].seat + 1
            }** could be **merlin**.`,
            current_game.players[i].id
          );
        }
      }
    }
  }
}

module.exports = {
  name: "join",
  aliases: [],
  execute,
};
