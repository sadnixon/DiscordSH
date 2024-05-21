//const sheet = require("../sheet");
const { errorMessage, shuffleArray } = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (!(message.channel.id in channels)) {
    const game_id = message.channel.id.toString() + "_" + Date.now().toString();
    channels[message.channel.id] = game_id;
    const game_data = {
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
      game_id: game_id,
      guild_id: message.guild.id,
      channel_id: message.channel.id,
      gameState: {
        lib: 0,
        fas: 0,
        failedGovs: 0,
        specialElected: -1,
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
        invPlayers: [],
        hitlerElected: false,
        hitlerDead: false,
        log: {},
      },
    };
    await game_info.set(game_id, game_data);
    await game_info.set("game_channels", channels);
  }
  message.channel.send("Game Made!");
}

module.exports = {
  name: "creategame",
  aliases: [],
  execute,
};
