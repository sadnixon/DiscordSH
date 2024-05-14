//const sheet = require("../sheet");
const { shuffleArray } = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  console.log(channels);
  if (!(message.channel.id in channels)) {
    const games = await game_info.get("games");
    const game_id = message.channel.id.toString()+"_"+Date.now().toString();
    channels[message.channel.id] = game_id;
    games[game_id] = {
      "customGameSettings": {
        "deckState": { "lib": 6, "fas": 11 },
        "trackState": { "lib": 0, "fas": 0 },
        "powers": [null, "investigate", "election", "bullet", "bullet"],
        "enabled": false,
        "hitlerZone": 3,
        "vetoZone": 5,
        "fascistCount": 2,
        "hitKnowsFas": false,
      },
      "gameSetting": {
        "rebalance6p": false,
        "rebalance7p": false,
        "rebalance9p": false,
        "casualGame": true,
      },
      "players": [],
      "logs": [],
      "gameState": {
        "lib": 0,
        "fas": 0,
        "failedGovs": 0,
        "deck": shuffleArray(["R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R",
        "B","B","B","B","B","B"]),
        "discard": [],
        "deadPlayers": [],
        "hitlerElected": false,
        "hitlerDead": false,
      }
    };
    console.log(games[game_id]);
    await game_info.set("game_channels",channels);
    await game_info.set("games",games);
  }
  //console.log(await game_info.get("game_channels"));
  //console.log(await game_info.get("games"));
  message.channel.send("Game Made!");
}

module.exports = {
  name: "creategame",
  aliases: [],
  execute,
};
