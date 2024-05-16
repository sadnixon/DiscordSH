const Discord = require("discord.js");
const _ = require("lodash");

const errorMessage = (message) => {
  return new Discord.MessageEmbed().setDescription(message).setColor("#ff0000");
};

const gameStateMessage = (message, game) => {
  const deads = _.range(0, game.players.length).map((i) =>
    game.gameState.deadPlayers.includes(i) ? "~~" : ""
  );
  const pres = _.range(0, game.players.length).map((i) =>
    game.gameState.presidentId === i ? "(P)" : ""
  );
  const chanc = _.range(0, game.players.length).map((i) =>
    game.gameState.chancellorId === i ? "(C)" : ""
  );
  var TL;
  if (game.players.length - game.gameState.deadPlayers.length > 5) {
    TL = _.range(0, game.players.length).map((i) =>
      game.gameState.lastPresidentId === i ||
      game.gameState.lastChancellorId === i
        ? "(TL)"
        : ""
    );
  } else {
    TL = _.range(0, game.players.length).map((i) =>
      game.gameState.lastChancellorId === i ? "(TL)" : ""
    );
  }
  const votes = _.range(0, game.players.length).map((i) =>
    game.gameState.votes[i]
      ? "Ja"
      : game.gameState.votes[i] === false
      ? "Nein"
      : ""
  );
  const cutoffs = [0, 1, 3, 6, 8, 10, 12];

  const embed = new Discord.MessageEmbed()
    .setTitle("Gamestate Update")
    .setDescription(
      `${"🟦".repeat(game.gameState.lib)}${"⬛⬛⬛⬛🕊️".slice(
        game.gameState.lib
      )}\n${"⭕".repeat(game.gameState.failedGovs)}${"⚫".repeat(
        3 - game.gameState.failedGovs
      )}\n${"🟥".repeat(game.gameState.fas)}${"⬛🔎🗳️🔫🔫💀".slice(
        cutoffs[game.gameState.fas]
      )}\n\n${game.players
        .map(
          (player) =>
            `${deads[player.seat]}${votes[player.seat]} ${player.seat}\\. <@${
              player.id
            }> ${pres[player.seat]}${chanc[player.seat]}${TL[player.seat]}${
              deads[player.seat]
            }`
        )
        .join("\n")}`
    )
    .setFooter(`Waiting on: ${game.gameState.phase.slice(0, -4)}`);
  if (message.channel.type === "dm") {
    const guild = client.guilds.cache.get(game.guild_id);
    const channel = guild.channels.cache.get(game.channel_id);
    channel.send(embed);
  } else {
    message.channel.send(embed);
  }
};

async function sendDM(message, game, dmText, id) {
  let player_disc;
  if (message.channel.type === "dm") {
    const guild = await client.guilds.cache.get(game.guild_id);
    player_disc = await guild.members.fetch(`${id}`).catch(() => null);
    if (!player_disc) return message.channel.send("User not found:(");
  } else {
    player_disc = await message.guild.members.fetch(`${id}`).catch(() => null);
    if (!player_disc) return message.channel.send("User not found:(");
  }
  await player_disc.send(dmText).catch(() => {
    message.channel.send(
      "User has DMs closed or has no mutual servers with the bot:("
    );
  });
}

const advancePres = (game) => {
  if (game.gameState.specialElected > -1) {
    game.gameState.presidentId =
      (game.gameState.specialElected + 1) % game.players.length;
    game.gameState.specialElected = -1;
  } else {
    game.gameState.presidentId =
      (game.gameState.presidentId + 1) % game.players.length;
  }
  while (game.gameState.deadPlayers.includes(game.gameState.presidentId)) {
    game.gameState.presidentId =
      (game.gameState.presidentId + 1) % game.players.length;
  }
  game.gameState.chancellorId = -1;
};

const rank = (competitorList, column, secondary = false, limit = 10) => {
  // assume competitorList is sorted by column
  // returns rank of each competitor (i and j have the same rank if i[column] === j[column])
  const ranks = [];
  let lastRank = 1;
  let lastScore = -1;
  let lastSecondary = -1;
  let reachedLimit = false;
  competitorList.forEach((p, i) => {
    if (reachedLimit) {
      return;
    }
    if (p[column] !== lastScore) {
      lastRank = i + 1;
      if (lastRank > limit) {
        reachedLimit = true;
        return;
      }
    } else if (p[secondary] !== lastSecondary) {
      lastRank = i + 1;
      if (lastRank > limit) {
        reachedLimit = true;
        return;
      }
    }
    ranks.push(lastRank);
    lastScore = p[column];
    lastSecondary = p[secondary];
  });
  return ranks;
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

const roundToThirds = (points) => {
  return +(Math.round(points * 12) / 12).toFixed(2);
};

module.exports = {
  errorMessage,
  rank,
  roundToThirds,
  shuffleArray,
  sendDM,
  gameStateMessage,
  advancePres,
};
