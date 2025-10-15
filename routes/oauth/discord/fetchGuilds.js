const { default: axios } = require("axios");

async function fetchGuilds(token_type, access_token) {
  const guildsResp = await axios.get(
    "https://discord.com/api/users/@me/guilds",
    {
      headers: { Authorization: `${token_type} ${access_token}` },
    }
  );

  return await guildsResp.data;
}

module.exports = fetchGuilds;
