const express = require("express");
const { getGoogleAuthURL } = require("../../../libs/google");
const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { orgId } = await req?.params;
    let USER_PREV_VISITED_URL;
    const { user_prev_visited_url = "/" } = await req.query;
    USER_PREV_VISITED_URL = user_prev_visited_url || "/";
    const url = await getGoogleAuthURL({
      user_prev_visited_url: user_prev_visited_url,
      organizationId: orgId,
    });
    res.redirect(url);
  } catch (error) {
    console.log("Get Google Error:", error);
  }
});

module.exports = router;
