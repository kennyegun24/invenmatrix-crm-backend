const { default: mongoose } = require("mongoose");

const InvitationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  roles: [{ type: String }],
  inviteToken: { type: String, required: true }, // for secure invite links
  status: {
    type: String,
    enum: ["pending", "accepted", "expired"],
    default: "pending",
  },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Invitation || mongoose.model("Invitation", InvitationSchema);
