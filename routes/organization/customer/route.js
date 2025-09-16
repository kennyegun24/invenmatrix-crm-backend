// routes/customers.js
const express = require("express");
const mongoose = require("mongoose");
const Customer = require("../../../schemas/customerSchema"); // adjust path if needed

const router = express.Router({ mergeParams: true });

// POST /customers - create a new customer
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orgId } = req.params;
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

router.get("/", async (req, res) => {
  try {
    const { orgId } = req.params;
    console.log(
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni dolores recusandae, quas distinctio autem unde nulla praesentium obcaecati corporis, sit est! Nulla fugiat esse quam quidem natus aperiam saepe quo."
    );

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const customers = await Customer.find({ organization: orgId });

    res.status(200).json({
      success: true,
      data: customers,
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
