const { Schema, default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email_address: { type: String, required: true, unique: true },
    image: { type: String },
    organizations: [
      {
        organization: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Organization",
          required: true,
        },
        role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
        joined_at: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["active", "suspended"],
          default: "active",
        },
      },
    ],
    // user_name: { type: String, unique: true },
    phone_number: { type: String },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    email_confirm: { type: Boolean, default: false },
    email_confirm_code: { type: String },
    email_confirm_expiry: { type: Date },
    last_login: { type: Date },
    password_updated_at: { type: Date },
    push_notifications: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Push_Notification",
    },
    email_notifications: { type: Boolean, default: true },
    uid: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
