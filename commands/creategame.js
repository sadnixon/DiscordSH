//const sheet = require("../sheet");
const { errorMessage, shuffleArray } = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  console.log(channels);
  if (!(message.channel.id in channels)) {
    const games = await game_info.get("games");
    const game_id = message.channel.id.toString() + "_" + Date.now().toString();
    channels[message.channel.id] = game_id;
    games[game_id] = {
      customGameSettings: {
        deckState: { lib: 6, fas: 11 },
        trackState: { lib: 0, fas: 0 },
        powers: [null, "investigate", "election", "bullet", "bullet"],
        enabled: false,
        hitlerZone: 3,
        vetoZone: 5,
        fascistCount: 2,
        hitKnowsFas: false,
      },
      gameSetting: {
        rebalance6p: false,
        rebalance7p: false,
        rebalance9p: false,
        casualGame: true,
      },
      players: [],
      logs: [],
      player_ids: {},
      gameState: {
        lib: 0,
        fas: 0,
        failedGovs: 0,
        deck: shuffleArray([
          "R", "R", "R", "R",
          "R", "R", "R", "R",
          "R", "R", "R", "B",
          "B", "B", "B", "B",
          "B",
        ]),
        discard: [],
        presidentId: -1,
        chancellorId: -1,
        lastPresidentId: -1,
        lastChancellorId: -1,
        presidentHand: [],
        chancellorHand: [],
        votes: {
          0: null,
          1: null,
          2: null,
          3: null,
          4: null,
          5: null,
          6: null,
        },
        presidentVeto: null,
        chancellorVeto: null,
        phase: "joinWait",
        deadPlayers: [],
        hitlerElected: false,
        hitlerDead: false,
        log: {},
      },
    };
    //const roles = shuffleArray(["liberal","liberal","liberal","liberal","fascist","fascist","hitler"]);
    //for (let i = 0; i < 7; i++) {
    //  games[game_id]["players"].push({"role": roles[i], "seat": i});
    //}
    console.log(games[game_id]);
    await game_info.set("game_channels", channels);
    await game_info.set("games", games);
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
