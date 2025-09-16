const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    plan_name: {
      type: String,
      enum: ["basic", "standard", "pro", "gold"],
      required: true,
    },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "cancelled"],
      default: "active",
    },
    card_ending_number: { type: String }, // store only last 4 digits
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    business_name: { type: String, required: true },
    company_email: { type: String, required: true },
    isDemo: { type: Boolean, default: false },
    fax: { type: String },
    cnotact_person: { type: String },
    company_phone_secondary: { type: String },
    company_phone: { type: String },
    state: { type: String },
    country: { type: String },
    company_address: { type: String },
    company_address_2: { type: String },
    company_address_3: { type: String },
    tax_id: { type: String },
    company_logo: { type: String }, // URL or path
    company_brand_color: { type: String }, // HEX or RGB color code
    company_domain: { type: String },
    subscription_plan: subscriptionPlanSchema,
    industry: { type: String, required: true },
    team_members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // owner or creator
    apis: { type: mongoose.Schema.Types.Mixed }, // flexible object for storing API keys/configs
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    timezone: { type: String, default: "UTC" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);
