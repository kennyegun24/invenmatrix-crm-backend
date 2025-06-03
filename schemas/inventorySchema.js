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

  product_name: { type: String, required: true },
  description: { type: String },
  value: { type: Number, default: 0 }, // Optional field, can store item worth or special value
  selling_price: { type: Number, required: true },

  variants: [VariantSchema], // e.g. Size, Color

  barcode: { type: String, unique: true, sparse: true },

  total_sold: { type: Number, default: 0 },
  in_stock: { type: Number, default: 0 },

  tags: [{ type: String }],

  images: [{ type: String }], // Store image URLs or file paths

  category: { type: String }, // Can also be ref if you later have a Category collection
  supplier: { type: String }, // Can also be ref later (Supplier collection)

  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
  },

  location: { type: String }, // Physical storage location

  cost_price: { type: Number, default: 0 },
  shipping_time: { type: String }, // e.g. '3-5 days'
  shipping_cost: { type: Number, default: 0 },

  profit_margin: { type: Number, default: 0 }, // Can be auto-calculated too if needed

  low_stock_threshold: { type: Number, default: 5 },

  day_purchased: { type: Date, default: Date.now },
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
