const { errorMessage, shuffleArray, sendDM, gameStateMessage } = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (message.channel.id in channels) {
    const games = await game_info.get("games");
    const current_game = games[channels[message.channel.id]];
    if (
      current_game.gameState.phase === "joinWait" &&
      !current_game.players
        .map((player) => player.id)
        .includes(message.author.id)
    ) {
      if (args && args[0] === "test") {
        for (let i = 0; i < 7; i++) {
          current_game.players.push({ id: message.author.id });
        }
      } else {
        current_game.players.push({ id: message.author.id });
      }
      if (current_game.players.length === 7) {
        current_game.gameState.phase = "nomWait";
        current_game.gameState.presidentId = 0;
        await game_info.set("games", games);
        current_game.players = shuffleArray(current_game.players);
        const roles = shuffleArray([
          "liberal",
          "liberal",
          "liberal",
          "liberal",
          "fascist",
          "fascist",
          "hitler",
        ]);
        for (let i = 0; i < 7; i++) {
          current_game.players[i].role = roles[i];
          current_game.players[i].seat = i;
          sendDM(
            message,
            `Your seat is **${i}** and your role is **${roles[i]}**`,
            current_game.players[i].id
          );
          if (roles[i] === "fascist") {
            for (let j = 0; j < 7; j++) {
              if (i !== j && roles[j] !== "liberal") {
                sendDM(
                  message,
                  `The player <@${current_game.players[j].id}> in seat **${j}** is **${roles[j]}**`,
                  current_game.players[i].id
                );
              }
            }
          }
        }
        gameStateMessage(message,current_game);
      }
      await game_info.set("games", games);
    } else {
      if ( current_game.gameState.phase !== "joinWait" ) {
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
