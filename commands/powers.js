const { EmbedBuilder} = require("discord.js");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  const embed = new EmbedBuilder().setTitle("Power Commands").addFields(
    {
      name: `${PREFIX}invest [seat number]`,
      value: "As president, you can use this power to find someone's alignment as long as they have not been investigated before.",
    },
    {
      name: `${PREFIX}se [seat number]`,
      value: "As president, you can use this power to select the next president.",
    },
    {
      name: `${PREFIX}gun [seat number]`,
      value: "As president, you can use this power to kill another player and remove them from the game.",
    },
  );
  message.channel.send({embeds: [embed]});
}

module.exports = {
  name: "powers",
  aliases: [],
  description: "Info on fascist power commands",
  execute,
};
