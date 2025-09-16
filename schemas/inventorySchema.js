const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const InventorySchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  product_name: { type: String, required: true }, // added
  description: { type: String },
  // cost_price: { type: Number, default: 0 }, // Optional field, can store item worth or special value
  selling_price: { type: Number, required: true }, // added

  variants: [VariantSchema], // e.g. Size, Color // added

  barcode: { type: String, unique: true, sparse: true }, // added

  total_sold: { type: Number, default: 0 },
  in_stock: { type: Number, default: 0 }, // added

  tags: [{ type: String }], // added

  images: {
    type: [String], // Array of strings (URLs/paths)
    validate: {
      validator: function (val) {
        return val.length <= 5;
      },
      message: "You can upload a maximum of 5 images.",
    },
  }, // Store image URLs or file paths // added

  category: { type: String }, // Can also be ref if you later have a Category collection
  supplier_name: { type: String }, // Can also be ref later (Supplier collection) // added
  supplier_info: { type: String }, // added

  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
  }, // added

  location: { type: String }, // Physical storage location // added

  cost_price: { type: Number, default: 0 }, // added
  shipping_time: { type: String }, // e.g. '3-5 days' // added
  shipping_cost: { type: Number, default: 0 }, // added

  profit_margin: { type: Number, default: 0 }, // Can be auto-calculated too if needed

  low_stock_threshold: { type: Number, default: 5 }, // added

  day_purchased: { type: Date, default: Date.now }, // added
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

InventorySchema.pre("save", function (next) {
  this.updated_at = Date.now();

  if (
    this.selling_price != null &&
    this.cost_price != null &&
    this.shipping_cost != null
  ) {
    const shippingCost = this.shipping_cost || 0;
    this.profit_margin = this.selling_price - (this.cost_price + shippingCost);
  }

  next();
});

module.exports =
  mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);
