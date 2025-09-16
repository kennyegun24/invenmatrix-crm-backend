const { google } = require("googleapis");
const organizationSchema = require("@/schemas/organizationSchema");
const provider = "google/sheets";

async function getOauthClient(_org) {
  if (!_org || !_org.organization) return null;
  console.log(_org);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials
  oauth2Client.setCredentials({
    access_token: _org.access_token,
    refresh_token: _org.refresh_token, // optional but recommended
    scope: _org.scope?.join ? _org.scope.join(" ") : _org.scope,
    expiry_date: _org.expiry_date
      ? new Date(_org.expires_at).getTime()
      : undefined,
  });

  // Auto-refresh listener
  oauth2Client.on("tokens", async (tokens) => {
    try {
      const update = { $set: { lastLinkedAt: new Date() } };

      if (tokens.access_token) update.$set.accessToken = tokens.access_token;
      if (tokens.refresh_token) update.$set.refreshToken = tokens.refresh_token;
      if (tokens.token_type) update.$set.tokenType = tokens.token_type;
      if (tokens.expiry_date)
        update.$set.expiresAt = new Date(tokens.expiry_date);

      if (tokens.scope) {
        update.$addToSet = { scopes: { $each: tokens.scope.split(" ") } };
      }

      await organizationSchema.updateOne({ _id: _org.organization }, update, {
        upsert: true,
      });
    } catch (err) {
      console.error("Failed to update org tokens:", err);
    }
  });

  return oauth2Client;
}

module.exports = getOauthClient;
