// routes/customers.js
const express = require("express");
const mongoose = require("mongoose");
const Customer = require("../../../schemas/customerSchema"); // adjust path if needed
const demoOrgMiddleware = require("../../../demoOrgMiddleware");
const { success } = require("../../../utils/apiResponse");

const router = express.Router({ mergeParams: true });

// POST /customers - create a new customer
router.post("/", demoOrgMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orgId } = req.orgId;
    const customerData = req.body;
    console.log(customerData);
    console.log(orgId);

    const customer = new Customer({ ...customerData, organization: orgId });

    // Save customer inside transaction
    await customer.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
});

router.get("/", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search?.trim() || "";

    // Build query
    const query = { organization: orgId };
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
      ];
    }

    // Run queries
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    return success(res, "All customers", 200, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
});

module.exports = router;
