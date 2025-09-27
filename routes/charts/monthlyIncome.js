const { default: mongoose } = require("mongoose");
const demoOrgMiddleware = require("../../demoOrgMiddleware");
const orderSchema = require("../../schemas/orderSchema");
const express = require("express");

const router = express.Router();

router.get("/:orgId/daily-income", demoOrgMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query; // month: 1–12, year: 2025
    const orgId = req.orgId;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }
    // console.log(month, year);
    // Convert month/year into start and end date
    const startDate = new Date(year, month - 1, 1); // e.g., 2025-08-01
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // e.g., 2025-08-31 23:59:59

    // Query all paid orders within that range
    const orders = await orderSchema.find({
      organization: orgId,
      "payment.status": "paid",
      "payment.paid_at": { $gte: startDate, $lte: endDate },
    });

    // Group by day
    const dailyTotals = {};

    orders.forEach((order) => {
      const day = new Date(order?.payment.paid_at).getDate(); // 1–31
      const total = order.total?.grand_total || 0;
      dailyTotals[day] = (dailyTotals[day] || 0) + total;
    });

    // Ensure all days are included, even with 0 sales
    const daysInMonth = new Date(year, month, 0).getDate(); // e.g., 31 for August
    const result = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      total: dailyTotals[i + 1] || 0,
    }));

    res.json({
      month,
      year,
      dailyIncome: result,
    });
  } catch (error) {
    console.error("Error fetching daily income:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /charts/revenue-expenses?year=2025&month=8
router.get("/:orgId/revenue-expenses", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId; // ✅ fix: use params, not req.orgId
    const { year, month } = req.query; // month = 1-12

    if (!year || !month) {
      return res.status(400).json({ error: "year and month are required" });
    }

    const metrics = await orderSchema.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(orgId),
          "payment.paid_at": {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1), // start of next month
          },
          "payment.status": "paid",
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "inventories",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$payment.paid_at" } },
          revenue: { $sum: "$total.grand_total" },
          expenses: {
            $sum: {
              $multiply: ["$items.quantity", "$productDetails.cost_price"],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          revenue: 1,
          expenses: 1,
          profit: { $subtract: ["$revenue", "$expenses"] },
        },
      },
      { $sort: { day: 1 } }, // ✅ order days for chart
    ]);
    // console.log(metrics);
    // // Fill missing days with 0 values (useful for charts)
    // const daysInMonth = new Date(year, month, 0).getDate(); // last day of month
    // const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    //   const day = i + 1;
    //   const found = metrics.find((m) => m.day === day);
    //   return found || { day, revenue: 0, expenses: 0, profit: 0 };
    // });

    res.json(metrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /charts/items-sold?year=2025
router.get("/:orgId/items-sold", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "year is required" });
    }

    const itemsSold = await orderSchema.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(orgId),
          "payment.paid_at": {
            $gte: new Date(year, 0, 1), // Jan 1
            $lt: new Date(+year + 1, 0, 1), // Next year Jan 1
          },
          "payment.status": "paid",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: { month: { $month: "$payment.paid_at" } },
          items_sold: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month", // 1-12
          items_sold: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // ✅ Fill missing months
    const filledData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1; // 1-12
      const found = itemsSold.find((m) => m.month === month);
      return {
        month,
        items_sold: found ? found.items_sold : 0,
      };
    });

    res.json(filledData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:orgId/top-products", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;
    const { year, month } = req.query;

    if (!year) {
      return res.status(400).json({ error: "year is required" });
    }

    // Build date range
    const startDate = month
      ? new Date(year, month - 1, 1) // month start
      : new Date(year, 0, 1); // Jan 1
    const endDate = month
      ? new Date(year, month, 1) // next month
      : new Date(+year + 1, 0, 1); // next year Jan 1

    const topProducts = await orderSchema.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(orgId),
          "payment.paid_at": { $gte: startDate, $lt: endDate },
          "payment.status": "paid",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          product_name: { $first: "$items.product_name" },
          total_quantity: { $sum: "$items.quantity" },
          total_sales: { $sum: "$items.total" },
        },
      },
      { $sort: { total_quantity: -1 } }, // sort by quantity sold
      { $limit: 5 }, // only top 5
    ]);

    res.json(topProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// router.get("/:orgId/top-products", demoOrgMiddleware, async (req, res) => {});

module.exports = router;
