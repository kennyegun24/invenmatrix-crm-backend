// routes/ORDER.js
const express = require("express");
const mongoose = require("mongoose");
const orderSchema = require("../../../schemas/orderSchema");
const inventorySchema = require("../../../schemas/inventorySchema");
const customerSchema = require("../../../schemas/customerSchema");

const router = express.Router({ mergeParams: true });

// POST /ORDER - create a new ORDER
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orgId } = req.params;
    const orderData = req.body;

    const order = new orderSchema({ ...orderData, organization: orgId });

    // Decrease stock levels in the same transaction
    const bulkOps = orderData?.items?.map((item) => ({
      updateOne: {
        filter: { _id: item?.product, organization: orgId },
        update: {
          $inc: { in_stock: -item?.quantity, total_sold: item?.quantity },
        },
      },
    }));

    await customerSchema.findByIdAndUpdate(
      orderData?.customer,
      {
        $inc: {
          total_orders: 1,
          total_spent: Number(orderData?.total?.grand_total) || 0,
        },
      },
      { session }
    );

    if (bulkOps.length > 0) {
      await inventorySchema.bulkWrite(bulkOps, { session });
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});

module.exports = router;
