const mongoose = require("mongoose");
const { PERMISSIONS } = require("../utils/permissions");

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Admin", "Manager"
  description: { type: String },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  permissions: [
    {
      type: String,
      enum: Object.keys(PERMISSIONS),
    },
  ], // e.g., ["can_create_automation", "can_invite_users"]
  is_default: { type: Boolean, default: false }, // default roles like Admin/Member
  color: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Role || mongoose.model("Role", RoleSchema);
