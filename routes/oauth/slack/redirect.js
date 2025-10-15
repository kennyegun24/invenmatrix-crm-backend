const accountsSchema = require("../../../schemas/accountsSchema");
const organizationSchema = require("../../../schemas/organizationSchema");
const { default: axios } = require("axios");
const express = require("express");
const router = express.Router({ mergeParams: true });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://172.20.10.3:3000";
const provider = "slack";
const SCOPES = ["users:read", "chat:write", "channels:read"];

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  let state = { user_prev_visited_url: "/", orgId: null };
  try {
    state = JSON.parse(req.query.state || "{}");
  } catch (_) {}
  try {
    const safePath =
      typeof state.user_prev_visited_url === "string" &&
      state.user_prev_visited_url.startsWith("/")
        ? state.user_prev_visited_url
        : "/";

    // USE CODE TO GET USER ACCESS TOKEN, REFRESH TOKEN, EXPIRY DATES
    const tokenResponse = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      null,
      {
        params: {
          code,
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          redirect_uri: process.env.SLACK_REDIRECT_URI,
        },
      }
    );
    if (tokenResponse?.data?.ok) {
      const access_token = tokenResponse?.data?.authed_user?.access_token;

      const channelResponse = await axios.get(
        "https://slack.com/api/conversations.list",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      if (channelResponse?.data.ok) {
        const orgId = state?.orgId;
        const channels = channelResponse.data?.channels || [];
        const format_channels = channels.map((e) => ({
          id: e.id,
          name: e.name,
        }));
        if (!state.orgId) {
          return res.redirect(`${FRONTEND_URL}${safePath}`);
        }
        const org = await organizationSchema.findById(state.orgId).lean();
        if (!org) {
          return res.redirect(`${FRONTEND_URL}${safePath}`);
        }
        const update = {
          $set: {
            accessToken: access_token, // always refresh access token
            accounts: format_channels || [],
          },
          $addToSet: { scopes: { $each: SCOPES } }, // avoid duplicates
          $setOnInsert: { organization: orgId, provider },
        };

        await accountsSchema.findOneAndUpdate(
          { organization: state.orgId, provider },
          update,
          { upsert: true, new: true }
        );

        return res.redirect(`${FRONTEND_URL}${safePath}`);
      }
    }
  } catch (error) {
    console.log("Get Google Error:", error);
  }
});

module.exports = router;
