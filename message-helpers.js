const Discord = require("discord.js");
const _ = require("lodash");

const errorMessage = (message) => {
  return new Discord.MessageEmbed().setDescription(message).setColor("#ff0000");
};

const gameStateMessage = (message, game) => {
  const deads = _.range(0, 7).map((i) =>
    game.gameState.deadPlayers.includes(i) ? "~~" : ""
  );
  const pres = _.range(0, 7).map((i) =>
    game.gameState.presidentId === i ? "(P)" : ""
  );
  const chanc = _.range(0, 7).map((i) =>
    game.gameState.chancellorId === i ? "(C)" : ""
  );
  const TL = _.range(0, 7).map((i) =>
    game.gameState.lastPresidentId === i ||
    game.gameState.lastChancellorId === i
      ? "(TL)"
      : ""
  );
  const embed = new Discord.MessageEmbed()
    .setTitle("Gamestate Update")
    .setDescription(
      `${"🟦".repeat(game.gameState.lib)}${"⬛".repeat(
        5 - game.gameState.lib
      )}\n${"⭕".repeat(game.gameState.failedGovs)}${"⚫".repeat(
        3 - game.gameState.failedGovs
      )}\n${"🟥".repeat(game.gameState.fas)}${"⬛🔎🗳️🔫🔫⬛".slice(
        game.gameState.fas
      )}\n\n${game.players
        .map(
          (player) =>
            `${deads[player.seat]}${player.seat}. <@${player.id}> ${
              pres[player.seat]
            }${chanc[player.seat]} ${TL[player.seat]}${deads[player.seat]}`
        )
        .join("\n")}`
    )
    .setFooter(`Waiting on: ${game.gameState.phase.slice(0, -4)}`);
  message.channel.send(embed);
};

async function sendDM(message, dmText, id) {
  const player_disc = await message.guild.members
    .fetch(`${id}`)
    .catch(() => null);
  if (!player_disc) return message.channel.send("User not found:(");
  await player_disc.send(dmText).catch(() => {
    message.channel.send(
      "User has DMs closed or has no mutual servers with the bot:("
    );
  });
}

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
};
