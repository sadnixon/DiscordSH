const { EmbedBuilder} = require("discord.js");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  const embed = new EmbedBuilder().setTitle("Commands").addFields(
    {
      name: `${PREFIX}creategame [number of players] [variants]`,
      value: "This creates the lobby. You must choose what kind of game it is, i.e. !creategame 7 avalon.",
    },
    {
      name: `${PREFIX}join`,
      value: "After creating a game you can have players join it till it fills.",
    },
    {
      name: `${PREFIX}pick [seat number]`,
      value: "As president you decide who your chancellor is.",
    },
    {
      name: `${PREFIX}vote [ja/nein]`,
      value: "This decides if you are voting ja or nein for the current government. Should be DM'd to the bot as voting is private.",
    },
    {
      name: `${PREFIX}discard [L/F]`,
      value: "As president you can discard one card and give the other two to your chancellor. Should be DM'd to the bot as discarding is private.",
    },
    {
      name: `${PREFIX}play [L/F]`,
      value: "As chancellor you can play one of two cards you were given by your president.",
    },
    {
      name: `${PREFIX}veto [ja/nein]`,
      value: "As president or chancellor during a Veto Zone government, you can choose to veto both possible policies if you both submit Ja.",
    },
    {
      name: `${PREFIX}powers`,
      value: "Shows you the commands for fascist powers.",
    },
    {
      name: `${PREFIX}morepowers`,
      value: "Shows you the commands for custom powers.",
    },
    {
      name: `${PREFIX}moregames`,
      value: "Shows you what other gamemodes of variant Secret Hitler are available on the bot.",
    },
    {
      name: `${PREFIX}info|help`,
      value: "Show this help message",
    }
  );
  message.channel.send({embeds: [embed]});
}

module.exports = {
  name: "info",
  aliases: ["help"],
  description: "Info on Commands",
  execute,
};
