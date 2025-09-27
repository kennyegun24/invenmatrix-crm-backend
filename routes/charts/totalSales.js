const demoOrgMiddleware = require("@/demoOrgMiddleware");
const customerSchema = require("@/schemas/customerSchema");
const orderSchema = require("@/schemas/orderSchema");
const countries = require("@/utils/countries");
const { generateDateRange } = require("@/utils/generateDateRange");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const monthNames = new Intl.DateTimeFormat("en-US", { month: "short" });

// GET sales graph data
router.get("/:orgId/sales-graph", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;
    const { type, startDate, endDate, year } = req.query;
    // --- Date filters ---
    let start, end;

    if (type?.toLowerCase() === "yearly") {
      if (year) {
        // User picked a specific year
        start = new Date(Number(year), 0, 1, 0, 0, 0, 0); // Jan 1
        end = new Date(Number(year), 11, 31, 23, 59, 59, 999); // Dec 31
      } else {
        // Default: past 12 months
        end = new Date();
        start = new Date(end);
        start.setMonth(end.getMonth() - 11, 1); // 12 months ago
        start.setHours(0, 0, 0, 0);
      }
    } else if (startDate && endDate) {
      // Custom range
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: current month
      end = new Date();
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    }
    // console.log(req.query);
    let matchStage = {
      organization: new mongoose.Types.ObjectId(orgId),
      "payment.status": "paid",
      // 'payment.paid_at':
      "payment.paid_at": { $gte: start, $lte: end },
    };

    // matchStage.payment.paid_at = { $gte: start, $lte: end };

    // --- Grouping ---
    let groupStage;
    let sortStage;

    if (type?.toLowerCase() === "yearly") {
      groupStage = {
        _id: {
          year: { $year: "$payment.paid_at" },
          month: { $month: "$payment.paid_at" },
        },
        totalRevenue: { $sum: "$total.grand_total" },
      };
      sortStage = { "_id.year": 1, "_id.month": 1 };
    } else {
      groupStage = {
        _id: {
          year: { $year: "$payment.paid_at" },
          month: { $month: "$payment.paid_at" },
          day: { $dayOfMonth: "$payment.paid_at" },
        },
        totalRevenue: { $sum: "$total.grand_total" },
      };
      sortStage = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
    }

    const rawResult = await orderSchema.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: sortStage },
    ]);

    // --- Fill missing days/months with 0 ---
    const dateRange = generateDateRange(
      start,
      end,
      type?.toLowerCase() === "yearly" ? "yearly" : "daily"
    );

    const result = dateRange.map((d) => {
      const found = rawResult.find((r) =>
        type?.toLowerCase() === "yearly"
          ? r._id.year === d.year && r._id.month === d.month
          : r._id.year === d.year &&
            r._id.month === d.month &&
            r._id.day === d.day
      );

      const date = new Date(d.year, d.month - 1);
      let entry = {
        year: d.year,
        total: found ? found.totalRevenue : 0,
      };

      if (type?.toLowerCase() === "yearly") {
        entry.month = monthNames.format(date); // Jan, Feb, ...
      } else {
        entry.day = d.day;
      }

      return entry;
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching sales graph:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET sales by region
router.get(
  "/:orgId/sales-by-continent",
  demoOrgMiddleware,
  async (req, res) => {
    try {
      const { continent } = req.query; // e.g., ?continent=Africa
      const orgId = req.orgId;
      // console.log(orgId, "orgId");
      const organizationId = new mongoose.Types.ObjectId(orgId);
      // console.log(organizationId, "Organization id");
      if (!continent) {
        return res.status(400).json({ message: "Continent is required" });
      }

      // Find all countries in that continent
      const allowedCountries = Object.keys(countries).filter(
        (country) =>
          countries[country].toLowerCase() === continent.toLowerCase()
      );
      // console.log(allowedCountries, "allow countries");
      if (!allowedCountries.length) {
        return res.json({
          continent,
          totalSales: 0,
          totalOrders: 0,
        });
      }

      // Step 2: Find customers in those countries
      const customers = await customerSchema
        .find({
          "billing_address.country": { $in: allowedCountries },
          organization: organizationId,
        })
        .select("_id");
      // console.log(customers, "customers");
      if (!customers.length) {
        return res.json({
          continent,
          totalSales: 0,
          totalOrders: 0,
        });
      }

      // Step 3: Find orders from those customers
      const orders = await orderSchema.find({
        customer: { $in: customers.map((c) => c._id) },
        "payment.status": "paid",
        organization: organizationId,
      });

      const totalSales = orders.reduce(
        (acc, order) => acc + (order.total?.grand_total || 0),
        0
      );
      const totalOrders = orders.length;

      res.json({
        continent,
        totalSales,
        totalOrders,
      });
    } catch (error) {
      console.error("Error fetching sales by continent:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
