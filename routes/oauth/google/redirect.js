const express = require("express");
const { oauth2Client } = require("@/libs/google");
const router = express.Router();
const CryptoJS = require("crypto-js");
const organizationSchema = require("@/schemas/organizationSchema");
const accountsSchema = require("@/schemas/accountsSchema");
const { listUserSheets } = require("@/libs/updateSheet");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://172.20.10.3:3000";
const provider = "google/sheets"; // or pass this via state if you support multiple

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
];

router.get("/callback", async (req, res) => {
  const code = req.query.code;

  // Parse state safely
  let state = { user_prev_visited_url: "/", organizationId: null };
  try {
    state = JSON.parse(req.query.state || "{}");
    console.log(typeof state, "state type");
    console.log(state, "state");
  } catch (_) {}
  const safePath =
    typeof state.user_prev_visited_url === "string" &&
    state.user_prev_visited_url.startsWith("/")
      ? state.user_prev_visited_url
      : "/";

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Encrypt tokens
    const access_token = tokens?.access_token
      ? CryptoJS.AES.encrypt(
          tokens.access_token,
          process.env.CRYPTO_JS_SEC
        ).toString()
      : null;

    const refresh_token = tokens?.refresh_token
      ? CryptoJS.AES.encrypt(
          tokens.refresh_token,
          process.env.CRYPTO_JS_SEC
        ).toString()
      : null;

    // Verify org exists
    if (!state.organizationId) {
      return res.redirect(`${FRONTEND_URL}${safePath}`);
    }
    const org = await organizationSchema.findById(state.organizationId).lean();
    if (!org) {
      return res.redirect(`${FRONTEND_URL}${safePath}`);
    }
    const getSheets = await listUserSheets({
      ...tokens,
      organization: state.organizationId,
    });

    console.log("GET USER SHEETS: ", getSheets);
    // Build upsert doc
    const expiresAt = tokens?.expiry_date
      ? new Date(tokens.expiry_date)
      : tokens?.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : undefined;

    const update = {
      $set: {
        accessToken: access_token, // always refresh access token
        tokenType: tokens?.token_type || "Bearer",
        expiresAt: expiresAt,
        lastLinkedAt: new Date(),
        accounts: getSheets || [],
      },
      $addToSet: { scopes: { $each: SCOPES } }, // avoid duplicates
      $setOnInsert: { organization: state.organizationId, provider },
    };

    // Only overwrite refreshToken if Google actually returned one
    if (refresh_token) {
      update.$set.refreshToken = refresh_token;
    }

    await accountsSchema.findOneAndUpdate(
      { organization: state.organizationId, provider },
      update,
      { upsert: true, new: true }
    );

    return res.redirect(`${FRONTEND_URL}${safePath}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return res.redirect(`${FRONTEND_URL}${safePath}`);
  }
});

module.exports = router;
