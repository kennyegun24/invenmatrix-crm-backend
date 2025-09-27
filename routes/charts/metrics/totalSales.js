// routes/sales.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const demoOrgMiddleware = require("../../../demoOrgMiddleware");
const orderSchema = require("../../../schemas/orderSchema");
const customerSchema = require("../../../schemas/customerSchema");

// GET all-time total revenue for an organization
router.get("/:orgId/total_sales", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;
    // console.log(orgId, "total_sales_org_id");
    const result = await orderSchema.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(orgId),
          "payment.status": "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total.grand_total" },
        },
      },
    ]);
    const orders = await orderSchema.find({
      organization: orgId,
      "payment.status": "paid",
    });
    // console.log(orders, "result");
    res.json({
      totalRevenue: result.length ? result[0].totalRevenue : 0,
    });
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/:orgId/sales_conversion", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;

    const totalCustomers = await customerSchema.countDocuments({
      organization: orgId,
    });
    const totalOrders = await orderSchema.countDocuments({
      organization: orgId,
      "payment.status": "paid",
    });
    // console.log(totalCustomers, "total customers");
    // console.log(totalOrders, "total orders");
    const conversionRate =
      totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    return res.json({ conversionRate: conversionRate || 0 });
  } catch (error) {}
});

module.exports = router;
