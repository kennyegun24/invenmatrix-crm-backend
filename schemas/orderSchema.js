const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }, // price * quantity
    variant: { type: String }, // e.g., size, color
  },
  { _id: false }
);

const totalSchema = new mongoose.Schema(
  {
    sub_total: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String }, // e.g., card, paypal, bank_transfer
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transaction_id: { type: String },
    paid_at: { type: Date },
  },
  { _id: false }
);

const fulfilmentSchema = new mongoose.Schema(
  {
    shipped_at: { type: Date },
    delivered_at: { type: Date },
    tracking_number: { type: String },
  },
  { _id: false }
);

const sourceSchema = new mongoose.Schema(
  {
    platform: { type: String }, // e.g., Shopify, Amazon, Website
    order_id: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [itemSchema],
    total: totalSchema,
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending",
    },
    payment: paymentSchema,
    fulfilment: fulfilmentSchema,
    source: sourceSchema,
    notes: { type: String },
    cancelled_at: { type: Date },
    returned_at: { type: Date },
    refunded_at: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
