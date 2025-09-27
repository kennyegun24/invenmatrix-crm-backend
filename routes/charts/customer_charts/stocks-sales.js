const { default: mongoose } = require("mongoose");
const demoOrgMiddleware = require("../../../demoOrgMiddleware");
const orderSchema = require("../../../schemas/orderSchema");
const express = require("express");
const inventorySchema = require("@/schemas/inventorySchema");
const customerSchema = require("@/schemas/customerSchema");
const stockMovementSchema = require("@/schemas/stockMovementSchema");

const router = express.Router();

router.get(
  "/:orgId/yearly-stock-vs-sales",
  demoOrgMiddleware,
  async (req, res) => {
    try {
      const orgId = req.orgId;
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      const start = new Date(Number(year), 0, 1, 0, 0, 0, 0); // Jan 1
      const end = new Date(Number(year), 11, 31, 23, 59, 59, 999); // Dec 31

      // --- 1. Sales aggregation (paid only) ---
      const sales = await orderSchema.aggregate([
        {
          $match: {
            organization: new mongoose.Types.ObjectId(orgId),
            "payment.status": "paid",
            "payment.paid_at": { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$payment.paid_at" },
              month: { $month: "$payment.paid_at" },
            },
            totalSales: { $sum: "$total.grand_total" },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      // --- 2. Stock movement aggregation ---
      const stockMovements = await stockMovementSchema.aggregate([
        {
          $match: {
            organization: new mongoose.Types.ObjectId(orgId),
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            netMovement: {
              $sum: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$type", "sale"] },
                      then: { $multiply: ["$quantity", -1] },
                    },
                    { case: { $eq: ["$type", "return"] }, then: "$quantity" },
                    { case: { $eq: ["$type", "restock"] }, then: "$quantity" },
                    {
                      case: { $eq: ["$type", "adjustment"] },
                      then: "$quantity",
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      // --- 3. Convert monthly movements -> cumulative closing stock ---
      let cumulativeStock = 0;
      const stockWithClosing = stockMovements.map((m) => {
        cumulativeStock += m.netMovement;
        return {
          month: m._id.month,
          year: m._id.year,
          closingStock: cumulativeStock,
        };
      });

      // --- 4. Merge sales + stock into final dataset (fill missing months with 0) ---
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const result = months.map((m) => {
        const s = sales.find((x) => x._id.month === m);
        const st = stockWithClosing.find((x) => x.month === m);
        return {
          month: new Date(Number(year), m - 1).toLocaleString("default", {
            month: "short",
          }),
          totalSales: s ? s.totalSales : 0,
          closingStock: st ? st.closingStock : cumulativeStock, // if missing, use last known stock
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching yearly stock vs sales:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// GET /:orgId/customer-sources
router.get("/:orgId/customer-sources", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;

    const sources = await customerSchema.aggregate([
      { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(
      sources.map((s) => ({ source: s._id || "Unknown", count: s.count }))
    );
  } catch (error) {
    console.error("Error fetching customer sources:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
