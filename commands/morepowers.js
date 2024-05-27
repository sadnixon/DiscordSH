const { EmbedBuilder} = require("discord.js");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  const embed = new EmbedBuilder().setTitle("Custom Power Commands").addFields(
    {
      name: `COMING SOON!`,
      value: "Custom commands will be implemented Someday.",
    },
  );
  message.channel.send({embeds: [embed]});
}

module.exports = {
  name: "morepowers",
  aliases: ["custompowers"],
  description: "Info on custom power commands",
  execute,
};
