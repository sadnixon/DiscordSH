const { errorMessage, shuffleArray } = require("../message-helpers");

async function execute(message, args, user) {
    const channels = await game_info.get("game_channels");
    console.log(channels);
    if (message.channel.id in channels) {
        const games = await game_info.get("games");
        const current_game = games[channels[message.channel.id]];
        console.log(current_game.players.map((player) => player.id));
        if (!current_game.players.map((player) => player.id).includes(message.author.id)) {
            current_game.players.push({id: message.author.id});
            if (current_game.players.length === 7) {
                current_game.players = shuffleArray(current_game.players);
                const roles = shuffleArray(["liberal","liberal","liberal","liberal","fascist","fascist","hitler"]);
                for (let i = 0; i < 7; i++) {
                  current_game.players[i].role = roles[i];
                  current_game.players[i].seat = i;
                }
            }
            console.log(current_game);
            console.log(games);
            await game_info.set("games", games);
        } else {
            message.channel.send(errorMessage("Already joined game!"));
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
