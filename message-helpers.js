const { EmbedBuilder, ChannelType } = require("discord.js");
const _ = require("lodash");

const errorMessage = (message) => {
  return {
    embeds: [new EmbedBuilder().setDescription(message).setColor("#ff0000")],
  };
};

const colorMap = {
  fascist: "#763A35",
  liberal: "334765",
  neutral: "#EAE6B1",
}

const standardEmbed = (header, message, team = "neutral") => {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle(header)
        .setDescription(message)
        .setColor(colorMap[team]),
    ],
  };
};

const policyMap = {
  B: "liberal",
  R: "fascist",
};

const roleLists = {
  liberal: ["liberal","percival","merlin"],
  fascist: ["fascist","morgana","hitler","monarchist"]
}

async function gameStateMessage(message, game) {
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
  const roles = _.range(0, game.players.length).map((i) =>
    !["liberal", "merlin", "percival"].includes(game.players[i].role) &&
    game.gameState.phase === "assassinWait"
      ? `: ${game.players[i].role}`
      : ""
  );

  const emojis = {
    null: "⬛",
    investigate: "🔎",
    election: "🗳️",
    peek: "👀",
    bullet: "🔫",
  };
  const lib_emoji_list = ["⬛", "⬛", "⬛", "⬛", "🕊️"];
  let emoji_list = game.customGameSettings.powers.map((e) => emojis[e]);
  emoji_list.push("💀");

  const embed = new EmbedBuilder()
    .setTitle("Gamestate Update")
    .setDescription(
      `${"🟦".repeat(game.gameState.lib)}${lib_emoji_list
        .slice(game.gameState.lib)
        .join("")}\n${"⭕".repeat(game.gameState.failedGovs)}${"⚫".repeat(
        3 - game.gameState.failedGovs
      )}\n${"🟥".repeat(game.gameState.fas)}${emoji_list
        .slice(game.gameState.fas)
        .join("")}\n\n${game.players
        .map(
          (player) =>
            `${deads[player.seat]}${votes[player.seat]} ${
              player.seat + 1
            }\\. <@${player.id}> ${pres[player.seat]}${chanc[player.seat]}${
              TL[player.seat]
            }${deads[player.seat]}${roles[player.seat]}`
        )
        .join("\n")}`
    )
    .setFooter({ text: `Waiting on: ${game.gameState.phase.slice(0, -4)}` })
    .setColor(colorMap["neutral"]);
  if (message.channel.type === ChannelType.DM) {
    const guild = await message.client.guilds.fetch(game.guild_id);
    const channel = await guild.channels.fetch(game.channel_id);
    await channel.send({ embeds: [embed] });
  } else {
    await message.channel.send({ embeds: [embed] });
  }
}

async function sendDM(message, game, dmHeader, dmText, id, color = "neutral") {
  let player_disc;
  if (message.channel.type === ChannelType.DM) {
    const guild = await message.client.guilds.fetch(game.guild_id);
    player_disc = await guild.members.fetch(`${id}`).catch(() => null);
    if (!player_disc)
      return message.channel.send(errorMessage("User not found:("));
  } else {
    player_disc = await message.guild.members.fetch(`${id}`).catch(() => null);
    if (!player_disc)
      return message.channel.send(errorMessage("User not found:("));
  }
  return await player_disc
    .send(standardEmbed(dmHeader, dmText, color))
    .catch(() => {
      message.channel.send(
        errorMessage(
          "User has DMs closed or has no mutual servers with the bot:("
        )
      );
    });
}

async function checkGameEnd(message, game) {
  if (
    !(
      (game.gameState.lib === 5 && !game.customGameSettings.avalon) ||
      game.gameState.fas === 6 ||
      game.gameState.hitlerElected ||
      (game.gameState.hitlerDead && !game.customGameSettings.avalon) ||
      game.gameState.assassinatedPlayer > -1 ||
      (game.gameSetting.noTopdecking &&
        game.gameState.topDecks === game.gameSetting.noTopdecking)
    )
  ) {
    return;
  }
  let end_method;
  let winning_players;
  if (game.gameState.lib === 5) {
    if (game.customGameSettings.avalon) {
      if (game.players[game.gameState.assassinatedPlayer].role === "merlin") {
        end_method =
          "Five liberal policies were enacted, but Merlin was assassinated! Fascists win!";
        winning_players = ["fascist", "morgana", "monarchist", "hitler"];
      } else {
        end_method =
          "Five liberal policies were enacted, and Merlin survived! Liberals win!";
        winning_players = ["liberal", "percival", "merlin"];
      }
    } else {
      end_method = "Five liberal policies were enacted! Liberals win!";
      winning_players = ["liberal"];
    }
  } else if (game.gameState.fas === 6) {
    end_method = "Six fascist policies were enacted! Fascists win!";
    winning_players = ["fascist", "morgana", "monarchist", "hitler"];
  } else if (game.gameState.hitlerElected) {
    end_method = "Hitler was elected Chancellor! Fascists win!";
    winning_players = ["fascist", "morgana", "hitler"];
  } else if (game.gameState.hitlerDead) {
    if (game.customGameSettings.avalon) {
      if (game.players[game.gameState.assassinatedPlayer].role === "merlin") {
        end_method =
          "Hitler was executed, but Merlin was assassinated! Fascists win!";
        winning_players = ["fascist", "morgana", "monarchist", "hitler"];
      } else {
        end_method = "Hitler was executed, and Merlin survived! Liberals win!";
        winning_players = ["liberal", "percival", "merlin", "monarchist"];
      }
    } else {
      end_method = "Hitler was executed! Liberals win!";
      winning_players = ["liberal", "monarchist"];
    }
  } else if (game.gameState.topDecks === game.gameSetting.noTopdecking) {
    end_method = "The Hammer has been failed! Fascists win!";
    winning_players = ["fascist", "morgana", "monarchist", "hitler"];
  }
  const winning_team = ["fascist", "morgana", "monarchist", "hitler"].some(
    (e) => winning_players.includes(e)
  )
    ? "fascist"
    : "liberal";

  const deads = _.range(0, game.players.length).map((i) =>
    game.gameState.deadPlayers.includes(i) ? "~~" : ""
  );
  let guild;
  let channel;
  if (message.channel.type === ChannelType.DM) {
    guild = await message.client.guilds.fetch(game.guild_id);
    channel = await guild.channels.fetch(game.channel_id);
  } else {
    guild = await message.guild;
    channel = await message.channel;
  }
  const embed = new EmbedBuilder()
    .setTitle(end_method)
    .setDescription(
      `${game.players
        .map(
          (player) =>
            `${deads[player.seat]}${player.seat + 1}\\. <@${player.id}>:${
              deads[player.seat]
            } ${player.role}`
        )
        .join("\n")}`
    )
    .setFooter({ text: "GG everybody!" })
    .setColor(colorMap[winning_team]);
  channel.send({ embeds: [embed] });
  const player_games = await game_info.get("player_games");
  for (let i = 0; i < game.players.length; i++) {
    let result = winning_players.includes(game.players[i].role)
      ? "won!"
      : "lost.";
    sendDM(
      message,
      game,
      `**${end_method}**`,
      `Since your role is **${game.players[i].role}**, you ${result}`,
      game.players[i].id,
      winning_team
    );
    delete player_games[game.players[i].id];
  }
  game.gameState.phase = "done";
  console.log(game.logs);
  const channels = await game_info.get("game_channels");
  delete channels[game.channel_id];
  await game_info.set("game_channels", channels);
  await game_info.set("player_games", player_games);
  delete game.gameState;
  const games = await game_info.get("games");
  games[game.game_id] = game;
  await game_info.set("games", games);
  await game_info.delete(game.game_id);
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

const roleListConstructor = (game) => {
  const roleConfigs = {
    5: ["liberal", "hitler"],
    6: ["liberal", "liberal", "hitler"],
    7: ["liberal", "liberal", "hitler"],
    8: ["liberal", "liberal", "liberal", "hitler"],
    9: ["liberal", "liberal", "liberal", "fascist", "hitler"],
    10: ["liberal", "liberal", "liberal", "liberal", "fascist", "hitler"],
  };

  const secondLiberal =
    game.customGameSettings.avalon && game.gameSetting.avalonSH.withPercival
      ? "percival"
      : "liberal";
  const secondFascist =
    game.customGameSettings.avalon && game.gameSetting.avalonSH.withPercival
      ? "morgana"
      : "fascist";
  if (game.customGameSettings.monarchist && game.customGameSettings.avalon) {
    if (game.playerCount < 7) {
      roleConfigs[game.playerCount].push("merlin", secondLiberal, "monarchist");
    } else {
      roleConfigs[game.playerCount].push(
        "merlin",
        secondLiberal,
        "monarchist",
        secondFascist
      );
    }
  } else if (game.customGameSettings.monarchist) {
    if (game.playerCount < 7) {
      roleConfigs[game.playerCount].push("liberal", "liberal", "monarchist");
    } else {
      roleConfigs[game.playerCount].push(
        "liberal",
        "liberal",
        "monarchist",
        "fascist"
      );
    }
  } else if (game.customGameSettings.avalon) {
    if (game.playerCount < 7) {
      roleConfigs[game.playerCount].push(
        "merlin",
        secondLiberal,
        secondFascist
      );
    } else {
      roleConfigs[game.playerCount].push(
        "merlin",
        secondLiberal,
        "fascist",
        secondFascist
      );
    }
  } else {
    if (game.playerCount < 7) {
      roleConfigs[game.playerCount].push("liberal", "liberal", "fascist");
    } else {
      roleConfigs[game.playerCount].push(
        "liberal",
        "liberal",
        "fascist",
        "fascist"
      );
    }
  }

  return shuffleArray(roleConfigs[game.playerCount]);
};

const reshuffleCheck = (game) => {
  if (game.gameState.deck.length < 3) {
    game.gameState.deck = shuffleArray(
      game.gameState.deck.concat(game.gameState.discard)
    );
    game.gameState.discard = [];
  }
};

module.exports = {
  errorMessage,
  standardEmbed,
  shuffleArray,
  sendDM,
  gameStateMessage,
  advancePres,
  checkGameEnd,
  reshuffleCheck,
  policyMap,
  roleLists,
  roleListConstructor,
};
