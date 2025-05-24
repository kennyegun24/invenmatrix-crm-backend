const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FolderSchema = new Schema(
  {
    folder_name: {
      type: String,
      required: true,
      trim: true,
    },

    ancestors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Folder",
      },
    ],

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    // Who created this folder
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    inventory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Inventory",
        unique: true, // Ensure unique products
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Folder || mongoose.model("Folder", FolderSchema);
