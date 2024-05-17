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
  const lib_cutoffs = [0, 1, 2, 3, 4, 7];
  const cutoffs = [0, 1, 3, 6, 8, 10, 12];

  const embed = new Discord.MessageEmbed()
    .setTitle("Gamestate Update")
    .setDescription(
      `${"🟦".repeat(game.gameState.lib)}${"⬛⬛⬛⬛🕊️".slice(
        lib_cutoffs[game.gameState.lib]
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

async function checkGameEnd(message, game) {
  if (
    !(
      game.gameState.lib === 5 ||
      game.gameState.fas === 6 ||
      game.gameState.hitlerElected ||
      game.gameState.hitlerDead
    )
  ) {
    return;
  }
  let end_method;
  if (game.gameState.lib === 5) {
    end_method = "Five liberal policies were enacted! Liberals win!";
  } else if (game.gameState.fas === 6) {
    end_method = "Six fascist policies were enacted! Fascists win!";
  } else if (game.gameState.hitlerElected) {
    end_method = "Hitler was elected Chancellor! Fascists win!";
  } else if (game.gameState.hitlerDead) {
    end_method = "Hitler was executed! Liberals win!";
  }
  const deads = _.range(0, game.players.length).map((i) =>
    game.gameState.deadPlayers.includes(i) ? "~~" : ""
  );
  let guild;
  let channel;
  if (message.channel.type === "dm") {
    guild = await client.guilds.cache.get(game.guild_id);
    channel = await guild.channels.cache.get(game.channel_id);
  } else {
    guild = await message.guild;
    channel = await message.channel;
  }
  const embed = new Discord.MessageEmbed()
    .setTitle(end_method)
    .setDescription(
      `${game.players
        .map(
          (player) =>
            `${deads[player.seat]}${player.seat}\\. <@${player.id}>:${
              deads[player.seat]
            } ${player.role}`
        )
        .join("\n")}`
    )
    .setFooter("GG everybody!");
  channel.send(embed);
  const player_games = await game_info.get("player_games");
  for (let i = 0; i < game.players.length; i++) {
    let result;
    if (game.gameState.lib === 5 || game.gameState.hitlerDead) {
      result = game.players[i].role === "liberal" ? "won!" : "lost.";
    } else if (game.gameState.fas === 6 || game.gameState.hitlerElected) {
      result = game.players[i].role === "liberal" ? "lost." : "won!";
    }
    sendDM(
      message,
      game,
      `**${end_method}** Since your role is **${game.players[i].role}**, you ${result}`,
      game.players[i].id
    );
    delete player_games[game.players[i].id];
  }
  game.gameState.phase = "done";
  const channels = await game_info.get("game_channels");
  delete channels[game.channel_id];
  await game_info.set("game_channels", channels);
  await game_info.set("player_games", player_games);
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

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

module.exports = {
  errorMessage,
  shuffleArray,
  sendDM,
  gameStateMessage,
  advancePres,
  checkGameEnd,
};
