// bot.js
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // if you need to read message content (not necessary for sending)
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);
});

// helper: fetch channels in a guild (returns array or throws)
async function fetchTextChannelsInGuild(guildId) {
  // Ensure the bot can fetch the guild
  const guild = await client.guilds.fetch(guildId); // may throw if bot is not in guild
  const channels = await guild.channels.fetch(); // returns a Collection
  // text channels are type 0 (GUILD_TEXT). Filter for text and viewable
  const textChannels = channels
    .filter((ch) => ch && ch.isTextBased() && ch.type === 0) // 0 = GUILD_TEXT
    .map((ch) => ({ id: ch.id, name: ch.name, nsfw: ch.nsfw }));

  return textChannels;
}

async function sendMessageToChannel(channelId, content) {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) throw new Error("Invalid channel");
  await channel.send({ content });
}

// Export client and helpers
module.exports = { client, fetchTextChannelsInGuild, sendMessageToChannel };
