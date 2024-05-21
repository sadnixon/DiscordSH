//const sheet = require("../sheet");
const { errorMessage, shuffleArray } = require("../message-helpers");

async function execute(message, args, user) {
  const channels = await game_info.get("game_channels");
  if (!(message.channel.id in channels)) {
    let playerCount;
    if (args && args[0]) {
      playerCount = parseInt(args[0], 10); // Get player count from command arguments
    } else {
      // If no player count is specified, prompt the user to provide it
      message.channel.send("Please specify the number of players (between 5 and 10).");
      return;
    }
    
    if (isNaN(playerCount) || playerCount < 5 || playerCount > 10) {
      message.channel.send(errorMessage("Invalid player count. Please specify a number between 5 and 10."));
      return;
    }

    const games = await game_info.get("games");
    const game_id = message.channel.id.toString() + "_" + Date.now().toString();
    channels[message.channel.id] = game_id;

    if (playerCount === 5 || playerCount === 6) {
      powers = [null, null, "peek", "bullet", "bullet"];
    } else if (playerCount === 9 || playerCount === 10) {
      powers = ["investigate", "investigate", "election", "bullet", "bullet"];
    } else {
      powers = ["investigate", "investigate", "election", "bullet", "bullet"];
    }

    games[game_id] = {
      customGameSettings: {
        deckState: { lib: 6, fas: 11 },
        trackState: { lib: 0, fas: 0 },
        powers: powers,
        enabled: false,
        hitlerZone: 3,
        vetoZone: 5,
        fascistCount: Math.floor((playerCount - 1) / 2),
        hitKnowsFas: playerCount < 7,
      },
      gameSetting: {
        rebalance6p: playerCount === 6,
        rebalance7p: playerCount === 7,
        rebalance9p: playerCount === 9,
        casualGame: true,
      },
      players: [],
      logs: [],
      player_ids: {},
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
          7: null,
          8: null,
          9: null,
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
    for (let i = 0; i < playerCount; i++) {
      games[game_id].gameState.votes[i] = null;
    }
    
    await game_info.set("game_channels", channels);
    await game_info.set("games", games);

    message.channel.send(`Game created for ${playerCount} players!`);
  } else {
    message.channel.send(errorMessage("A game already exists in this channel!"));
  }
}

module.exports = {
  name: "creategame",
  aliases: [],
  execute,
};
