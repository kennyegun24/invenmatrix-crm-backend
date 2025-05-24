const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postal_code: { type: String },
  },
  { _id: false }
); // No separate _id for embedded address

const customerSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email_address: { type: String, lowercase: true, trim: true },
    phone_number: { type: String },

    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },

    billing_address: addressSchema,

    tax_number: { type: String },
    notes: { type: String },

    total_spent: { type: Number, default: 0 }, // Sum of orders
    total_orders: { type: Number, default: 0 }, // Count of orders

    tags: [
      {
        type: String,
        enum: [
          "VIP",
          "FREQUENT",
          "WHOLESALE",
          "NEW",
          "RESELLER",
          "BLACKLISTED",
        ],
      },
    ], // E.g., ["VIP", "FREQUENT"]

    preferred_payment_method: { type: String },

    last_order_at: { type: Date },

    source: { type: String }, // E.g., "Website", "POS", "Imported"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
