const {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
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
      let playerCount;
      if (args && args[0] === "test") {
        playerCount = 7; // For testing purposes
      } else {
        playerCount = parseInt(args[0], 10); // Get player count from command arguments
      }
      
      if (isNaN(playerCount) || playerCount < 5 || playerCount > 10) {
        message.channel.send(errorMessage("Invalid player count. Please specify a number between 5 and 10."));
        return;
      }

      for (let i = 0; i < playerCount; i++) {
        current_game.players.push({ id: message.author.id });
      }
      
      const player_games = await game_info.get("player_games");
      player_games[message.author.id] = channels[message.channel.id];
      game_info.set("player_games", player_games);
      
      if ([5, 6, 7, 8, 9, 10].includes(playerCount)) {
        current_game.gameState.phase = "nomWait";
        current_game.gameState.presidentId = 0;
        await game_info.set(current_game.game_id, current_game);
        current_game.players = shuffleArray(current_game.players);
        
        const roleConfigs = {
          5: ["liberal", "liberal", "liberal", "fascist", "hitler"],
          6: ["liberal", "liberal", "liberal", "liberal", "fascist", "hitler"],
          7: ["liberal", "liberal", "liberal", "liberal", "fascist", "fascist", "hitler"],
          8: ["liberal", "liberal", "liberal", "liberal", "liberal", "fascist", "fascist", "hitler"],
          9: ["liberal", "liberal", "liberal", "liberal", "liberal", "fascist", "fascist", "fascist", "hitler"],
          10: ["liberal", "liberal", "liberal", "liberal", "liberal", "liberal", "fascist", "fascist", "fascist", "hitler"]
        };
        
        const roles = shuffleArray(roleConfigs[playerCount]);
        
        for (let i = 0; i < playerCount; i++) {
          current_game.players[i].role = roles[i];
          current_game.players[i].seat = i;
          current_game.player_ids[current_game.players[i].id] = i;
          sendDM(
            message,
            current_game,
            `Your seat is **${i}** and your role is **${roles[i]}**`,
            current_game.players[i].id
          );
          
          if (roles[i] === "fascist") {
            for (let j = 0; j < playerCount; j++) {
              if (i !== j && roles[j] !== "liberal") {
                sendDM(
                  message,
                  current_game,
                  `The player <@${current_game.players[j].id}> in seat **${j}** is **${roles[j]}**`,
                  current_game.players[i].id
                );
              }
            }
          }
        }
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

module.exports = {
  name: "join",
  aliases: [],
  execute,
};
