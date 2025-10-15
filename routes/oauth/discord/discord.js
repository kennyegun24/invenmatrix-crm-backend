const express = require("express");
const axios = require("axios");
const organizationSchema = require("../../../schemas/organizationSchema");
const accountsSchema = require("../../../schemas/accountsSchema");
// const { saveOrgDiscordMapping, getOrgDiscordMapping } = require("./db");
const CryptoJS = require("crypto-js");
const fetchGuilds = require("./fetchGuilds");

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const provider = "discord"; // or pass this via state if you support multiple
const SCOPES = "identity guilds";
/**
 * Step 1: Redirect user to Discord OAuth (identify + guilds)
 * We accept an optional `returnUrl` query param and store it in `state`.
 */
router.get("/", async (req, res) => {
  const returnUrl = req.query.returnUrl || "/";
  const orgId = req?.query.orgId;
  console.log(orgId);
  const state = Buffer.from(
    JSON.stringify({ returnUrl, organizationId: orgId })
  ).toString("base64"); // short encoding
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

/**
 * Step 2: OAuth callback - exchange code for token, fetch user and guilds, save in session
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state
    ? JSON.parse(Buffer.from(req.query.state, "base64").toString())
    : { returnUrl: "/", organizationId: "" };

  if (!code) return res.status(400).send("No code provided");
  const safePath =
    typeof state.returnUrl === "string" && state.returnUrl.startsWith("/")
      ? state.returnUrl
      : "/";
  try {
    // exchange code for token
    const tokenResp = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, token_type, expires_in } = tokenResp.data;

    // fetch user profile
    const userResp = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `${token_type} ${access_token}` },
    });

    // fetch user's guilds
    const guildsResp = await fetchGuilds(token_type, access_token);

    const _access_token = access_token
      ? CryptoJS.AES.encrypt(access_token, process.env.CRYPTO_JS_SEC).toString()
      : null;

    if (!state.organizationId) {
      console.log("no org id");
      return res.redirect(`${FRONTEND_URL}${safePath}`);
    }

    const org = await organizationSchema.findById(state.organizationId).lean();
    if (!org) {
      console.log("no org");
      return res.redirect(`${FRONTEND_URL}${safePath}`);
    }
    console.log("there org");
    // Build upsert doc
    const expiresAt = expires_in
      ? new Date(expires_in)
      : expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : undefined;

    const update = {
      $set: {
        accessToken: _access_token, // always refresh access token
        tokenType: token_type || "Bearer",
        expiresAt: expiresAt,
        lastLinkedAt: new Date(),
        accounts: guildsResp || [],
      },
      $addToSet: { scopes: { $each: SCOPES } }, // avoid duplicates
      $setOnInsert: { organization: state.organizationId, provider },
    };

    await accountsSchema.findOneAndUpdate(
      {
        organization: state.organizationId,
        provider,
      },
      update,
      { upsert: true, new: true }
    );

    // Redirect back to frontend (you can encode state.returnUrl)
    const returnUrl = state.returnUrl || "/";
    return res.redirect(`${FRONTEND_URL}${returnUrl}`);
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    return res.redirect(`${FRONTEND_URL}/auth/error`);
  }
});

/**
 * Step 4: Invite bot link generator
 * If bot not in guild, frontend can call this or just redirect user to the URL.
 * We construct an invite link that pre-selects the guild and required permissions.
 */
router.get("/api/invite/:guildId", (req, res) => {
  const guildId = req.params.guildId;
  const permissions = "2048"; // e.g., SEND_MESSAGES (you may change)
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    scope: "bot%20applications.commands",
    permissions,
    guild_id: guildId,
    disable_guild_select: "true",
  });

  // Redirect user to Discord invite (or send link to frontend)
  return res.json({
    inviteUrl: `https://discord.com/oauth2/authorize?${params.toString()}`,
  });
});

/**
 * Step 5: After bot is in guild, list available text channels (uses bot client)
 * Frontend calls this and user picks a channel ID.
 */
router.get("/api/guilds/:guildId/channels", async (req, res) => {
  const guildId = req.params.guildId;

  try {
    // This uses the bot client
    const channels = await fetchTextChannelsInGuild(guildId); // returns array of { id, name }
    return res.json(channels);
  } catch (err) {
    console.error("fetch channels error:", err);
    // If bot is not in the guild, discord.js fetch will throw
    return res
      .status(400)
      .json({ error: "Bot not in guild or insufficient permissions" });
  }
});

/**
 * Step 3: Endpoint to get the logged-in user's guilds and whether bot is present
 * Frontend calls this to show list of guilds to user.
 */
// router.get("/api/my/guilds", async (req, res) => {
//   if (!req.session.discordUser)
//     return res.status(401).json({ error: "Not authenticated" });

//   try {
//     const userGuilds = req.session.discordUser.guilds; // from OAuth
//     // Get list of guild IDs where bot is present
//     const botGuilds = botClient.guilds.cache.map((g) => g.id); // cached guilds
//     // If missing some guilds in cache, you can fetch individually but it could be rate-limited.

//     const result = userGuilds.map((g) => ({
//       id: g.id,
//       name: g.name,
//       // hint: you can check admin perms from the guild entry if needed (`g.permissions`)
//       botIn: botGuilds.includes(g.id),
//       permissions: g.permissions,
//       icon: g.icon,
//     }));

//     return res.json(result);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Failed to load guilds" });
//   }
// });

/**
 * Step 6: Save selected channel mapping (SaaS org/user -> guild + channel)
 * Replace `orgId` with your SaaS org/user identifier.
 */
// router.post("/api/org/:orgId/link", async (req, res) => {
//   const { orgId } = req.params;
//   const { guildId, channelId } = req.body;
//   if (!guildId || !channelId)
//     return res.status(400).json({ error: "guildId and channelId required" });

//   // NOTE: validate that bot is in guild and channel exists
//   try {
//     await fetchTextChannelsInGuild(guildId); // ensures bot in guild and can fetch channels
//     // Save mapping to DB (placeholder)
//     saveOrgDiscordMapping(orgId, { guildId, channelId });
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error(err);
//     return res
//       .status(400)
//       .json({ error: "Validation failed. Bot may not be in guild." });
//   }
// });

/**
 * Example: Endpoint to trigger sending a message for an org (used by automation)
 */
// router.post("/api/org/:orgId/notify", async (req, res) => {
//   const { orgId } = req.params;
//   const { message } = req.body;
//   if (!message) return res.status(400).json({ error: "message required" });

//   const mapping = getOrgDiscordMapping(orgId);
//   if (!mapping)
//     return res.status(404).json({ error: "No Discord mapping for this org" });

//   try {
//     await sendMessageToChannel(mapping.channelId, message);
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error("send message error:", err);
//     return res.status(500).json({ error: "Failed to send message" });
//   }
// });

module.exports = router;
