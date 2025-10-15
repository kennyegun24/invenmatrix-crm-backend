// routes/ORDER.js
const express = require("express");
const mongoose = require("mongoose");
const orderSchema = require("../../../schemas/orderSchema");
const inventorySchema = require("../../../schemas/inventorySchema");
const customerSchema = require("../../../schemas/customerSchema");
const demoOrgMiddleware = require("../../../demoOrgMiddleware");
const { success, error } = require("../../../utils/apiResponse");

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

router.get("/", demoOrgMiddleware, async (req, res) => {
  try {
    const orgId = req.orgId;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search?.trim() || "";
    console.log(search);
    // Build pipeline
    const pipeline = [
      { $match: { organization: new mongoose.Types.ObjectId(orgId) } },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer_info",
        },
      },
      {
        $unwind: {
          path: "$customer_info",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Add search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "items.product_name": { $regex: search, $options: "i" } },
            { "customer_info.first_name": { $regex: search, $options: "i" } },
            { "customer_info.last_name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Facet for both data & total
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              status: 1,
              createdAt: 1,
              grand_total: "$total.grand_total",
              paid_at: "$payment.paid_at",
              customer_name: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$customer_info.first_name", ""] },
                      " ",
                      { $ifNull: ["$customer_info.last_name", ""] },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    });

    const result = await orderSchema.aggregate(pipeline);

    const orders = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    return success(res, "All orders", 200, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

router.get("/best-sellers", demoOrgMiddleware, async (req, res) => {
  const orgId = req.orgId;

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  try {
    const matchStage = {
      organization: new mongoose.Types.ObjectId(orgId),
    };
    const topProducts = await orderSchema.aggregate([
      { $match: matchStage },
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
          _id: "$items.product",
          product_name: { $first: "$items.product_name" },
          total_quantity: { $sum: "$items.quantity" },
          total_sales: { $sum: "$items.total" },
          expenses: {
            $sum: {
              $multiply: ["$items.quantity", "$productDetails.cost_price"],
            },
          },
        },
      },
      { $sort: { total_quantity: -1 } }, // sort by quantity sold
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);
    const countPipeline = [
      { $match: matchStage },
      { $unwind: "$items" },
      { $group: { _id: "$items.product" } },
      { $count: "total" },
    ];
    const countResult = await orderSchema.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return success(res, "All orders", 200, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      top_products: topProducts,
    });
  } catch (err) {
    console.log(err);
    return error(res, "Something went wrong", 500);
  }
});
module.exports = router;
