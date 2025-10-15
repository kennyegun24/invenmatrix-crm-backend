const express = require("express");
const { getGoogleAuthURL } = require("../../../libs/google");
const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { orgId } = await req?.params;
    let USER_PREV_VISITED_URL;
    const { user_prev_visited_url = "/" } = await req.query;
    USER_PREV_VISITED_URL = user_prev_visited_url || "/";
    const SCOPES = ["users:read", "chat:write", "channels:read"];
    const state = JSON.stringify({
      orgId,
      user_prev_visited_url: USER_PREV_VISITED_URL,
    });

    res.redirect(
      `https://slack.com/oauth/v2/authorize?client_id=${
        process.env.SLACK_CLIENT_ID
      }&user_scope=${encodeURIComponent(
        SCOPES.join(",")
      )}&redirect_uri=${encodeURIComponent(
        process.env.SLACK_REDIRECT_URI
      )}&state=${encodeURIComponent(state)}`
    );
  } catch (error) {
    console.log("Get Google Error:", error);
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log("CODE: ", code);
    console.log("STATE: ", state);
  } catch (error) {
    console.log("Get Google Error:", error);
  }
});

module.exports = router;
