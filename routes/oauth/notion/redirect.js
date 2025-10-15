const express = require("express");
const { default: axios } = require("axios");
const organizationSchema = require("../../../schemas/organizationSchema");
const accountsSchema = require("../../../schemas/accountsSchema");
const getNotionDatabases = require("./getNotionDatabases");
const router = express.Router({ mergeParams: true });

const provider = "notion";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  let parsedState = {};

  try {
    parsedState = JSON.parse(state || "{}");
  } catch (_) {}

  const { orgId, user_prev_visited_url = "/" } = parsedState;
  const safePath = user_prev_visited_url.startsWith("/")
    ? user_prev_visited_url
    : "/";

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.NOTION_REDIRECT_URI,
      },
      {
        auth: {
          username: process.env.NOTION_CLIENT_ID,
          password: process.env.NOTION_CLIENT_SECRET,
        },
      }
    );
    console.log("TOKEN RESPONSE: ", tokenResponse.data);

    const {
      access_token,
      refresh_token,
      bot_id,
      workspace_id,
      workspace_name,
    } = tokenResponse.data;

    if (!access_token) throw new Error("Failed to get Notion access token");
    const databases = await getNotionDatabases(access_token);
    const format_databases = databases.map((e) => ({
      id: e?.id,
      name: e?.title[0].plain_text,
    }));
    // console.log(format_databases);
    // DATA FROM DATABASES: ID, TITLE
    // DATA TO STORE IN DB... ACCESS TOKEN, REFRESH TOKEN, PROVIDER, EXPIRES AT, ORGID
    // Fetch basic workspace info
    const org = await organizationSchema.findById(orgId).lean();
    if (!org) return res.redirect(`${FRONTEND_URL}${safePath}`);

    const update = {
      $set: {
        accessToken: access_token,
        workspaceId: workspace_id,
        workspaceName: workspace_name,
        lastLinkedAt: new Date(),
        refresh_token,
        accounts: format_databases,
      },
      $setOnInsert: { organization: orgId, provider },
    };

    await accountsSchema.findOneAndUpdate(
      { organization: orgId, provider },
      update,
      { upsert: true, new: true }
    );
    return res.redirect(`${FRONTEND_URL}${safePath}`);
  } catch (error) {
    console.error("Notion OAuth Error:", error.response?.data || error);
    return res.redirect(`${FRONTEND_URL}${safePath}`);
  }
});

module.exports = router;
