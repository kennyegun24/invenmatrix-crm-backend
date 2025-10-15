const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },

    provider: { type: String, required: true }, // e.g. "google", "microsoft", "stripe"

    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date }, // token expiry time

    scope: { type: [String] }, // optional: track granted scopes
    lastUsedAt: { type: Date }, // when automation last used this token

    selected_channel_id: { type: String },
    workspaceId: { type: String },
    workspaceName: { type: String },

    accounts: [
      {
        id: { type: String, required: true }, // account/server/channel id
        name: { type: String, required: true }, // account/server name
        owner: { type: Boolean, default: false }, // true if owned by this user/org
        serverId: { type: String }, // optional: for Discord, Slack, etc.
        channelId: { type: String }, // optional: for Discord, Slack, etc.
      },
    ],
  },
  { timestamps: true }
);

// Automatically update updatedAt on save
TokenSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.Token || mongoose.model("Token", TokenSchema);
