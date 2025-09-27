const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    date: { type: Date },
    type: {
      type: String,
      enum: ["sale", "restock", "return", "adjustment"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // Example: sale = -5, restock = +10
    },
  },
  { timestamps: true } // createdAt & updatedAt
);

module.exports =
  mongoose.models.StockMovement ||
  mongoose.model("StockMovement", stockMovementSchema);
