const express = require("express");
const router = express.Router({ mergeParams: true });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI;

router.get("/", async (req, res) => {
  const { orgId } = req.params;
  let USER_PREV_VISITED_URL;
  const { user_prev_visited_url = "/" } = await req.query;
  USER_PREV_VISITED_URL = user_prev_visited_url || "/";
  console.log("NOTION REDIRECT: ", NOTION_REDIRECT_URI);
  const state = JSON.stringify({
    orgId,
    user_prev_visited_url: USER_PREV_VISITED_URL,
  });

  const authURL = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
    NOTION_REDIRECT_URI
  )}&state=${encodeURIComponent(state)}`;

  res.redirect(authURL);
});

module.exports = router;
