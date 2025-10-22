const mongoose = require("mongoose");
const { PERMISSIONS } = require("../utils/permissions");

const TeamMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Will be filled once the user accepts the invite or is matched
    },

    fullName: {
      type: String,
      trim: true,
    },

    roles: {
      type: [String],
      validate: {
        validator: function (roles) {
          return Array.isArray(roles) && new Set(roles).size === roles.length;
        },
        message: "Roles must be unique.",
      },
      required: true,
    },

    status: {
      type: String,
      enum: ["invited", "active", "removed"],
      default: "invited",
    },

    invitedAt: {
      type: Date,
      default: Date.now,
    },

    joinedAt: {
      type: Date,
    },

    removedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.TeamMember || mongoose.model("TeamMember", TeamMemberSchema);
