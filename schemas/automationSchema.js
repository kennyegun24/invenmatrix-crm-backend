const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Node ID
  type: { type: String, required: true }, // trigger, condition, recipient
  targetId: { type: String },
  condition: { type: Number },
  condition_type: {
    type: String,
    enums: [
      // "STOCK_LEVEL_BELOW",
      // "PRODUCT_CATEGORY_MATCH",
      "NEW_PRODUCT_ADDED",
      // "ORDER_VALUE_ABOVE",
      "OUT_OF_STOCK",
      // "EXPIRY_DATE_APPROACHING",
      "SUPPLIER_MATCH",
      "PROFIT_MARGIN_BELOW",
      "CUSTOMER_TYPE_MATCH",
      // "FOLDER_MATCH",
    ],
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {
    body: { type: String, default: "" },
    description: { type: String, default: "" },
    label: { type: String, default: "" },
    icon: { type: String, default: "" },
  },
});

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true }, // node id
  target: { type: String, required: true }, // node id
  animated: { type: Boolean, default: false },
});

const flowSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Optional: name of the flow
  description: { type: String, required: true }, // Optional: description of the flow
  nodes: [nodeSchema], // Array of nodes
  recentRun: { type: Date },
  edges: [edgeSchema],
  activated: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
});

// Update `updatedAt` automatically
flowSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Flow = mongoose.models.Flow || mongoose.model("Flow", flowSchema);

module.exports = Flow;
