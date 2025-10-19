const mongoose = require("mongoose");

const featureAnnouncementSchema = new mongoose.Schema(
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
    image: {
      type: String, // optional banner or screenshot
    },
    tags: [String], // e.g. ["automation", "dashboard", "team roles"]
    version: String, // optional (for versioned releases)
    releaseDate: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // platform dev/admin
      required: true,
    },

    likes: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        likedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    relatedRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeatureRequest", // Link to user-suggested feature(s)
      },
    ],

    releaseStage: {
      type: String,
      enum: ["coming_soon", "beta", "released", "deprecated"],
      default: "coming_soon",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "FeatureAnnouncement",
  featureAnnouncementSchema
);
