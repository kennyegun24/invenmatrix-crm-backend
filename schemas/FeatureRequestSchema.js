const mongoose = require("mongoose");

const featureRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    tags: [String],
    status: {
      type: String,
      enum: [
        "pending",
        "reviewing",
        "approved",
        "in_progress",
        "implemented",
        "rejected",
      ],
      default: "pending",
    },
    category: {
      type: String,
      enum: [
        "UI/UX",
        "Performance",
        "Automation",
        "Analytics",
        "Integrations",
        "Charts",
        "Team Management",
        "Exports",
        "Inventory",
        "Folders",
        "Inventory Management",
        "Other",
      ],
      default: "Other",
    },

    // DYNAMIC
    votes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          unique: true,
        },
        votedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    linkedFeature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeatureAnnouncement", // link to implemented feature
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeatureRequest", featureRequestSchema);
