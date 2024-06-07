const { EmbedBuilder} = require("discord.js");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  const embed = new EmbedBuilder().setTitle("Game Modes").addFields(
    {
      name: "Avalon Secret Hitler",
      value: `Adds Merlin, a liberal who knows all the facists. If the liberals get a win condition, Hitler can attempt to assassinate Merlin and win. Use \`${PREFIX}creategame [game size] avalon\` to play.`,
    },
    {
      name: "Avalon Secret Hitler with Percival",
      value: `Adds Percival, a liberal who knows that Merlin is one of two players, and Morgana, a fascist who appears as a possible Merlin to Percival. Use \`${PREFIX}creategame [game size] avalon percival\` to play.`,
    },
    {
      name: "Monarchist Secret Hitler",
      value: `Adds Monarchist, a fascist who is opposed to Hitler; they win when Hitler is shot and lose when Hitler is elected. Use \`${PREFIX}creategame [game size] monarchist\` to play.`,
    },
    {
      name: "Communist Secret Hitler",
      value: `COMING SOON!`,
    },
  );
  message.channel.send({embeds: [embed]});
}

module.exports = {
  name: "moregames",
  aliases: ["modes"],
  description: "Info on special game modes",
  execute,
};
