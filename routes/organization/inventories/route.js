const express = require("express");
const router = express.Router({ mergeParams: true });
// const Inventory = require("@schemas/inventorySchema");

const Inventory = require("../../../schemas/inventorySchema");
const { error, success } = require("../../../utils/apiResponse");
const mongoose = require("mongoose");
const authMiddleware = require("../../../middleware");

// CREATE NEW INVENTORY
router.post("/", authMiddleware, async (req, res) => {
  const { orgId } = req.params;
  console.log(req.body);
  console.log(orgId);
  const uid = req?.user?.uid;
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("start session");
  try {
    const {
      product_name,
      product_desc: description,
      supplier_name,
      supplier_info,
      day_purchased,
      product_images: images,
      status,
      tags,
      location,
      cost_price,
      selling_price,
      shipping_cost,
      shipping_time,
      stock_level: in_stock,
      category,
      barcode,
      low_stock_threshold,
      variants,
    } = req.body?.data;

    if (!product_name || !selling_price || !orgId) {
      console.log("missing params1");
      await session.abortTransaction();
      console.log("missing params2");
      return error(
        res,
        "product_name, selling_price, and organization are required",
        400
      );
    }
    console.log("params complete");
    const newInventory = new Inventory({
      product_name,
      selling_price,
      cost_price,
      in_stock,
      variants,
      barcode,
      tags,
      images,
      description,
      status,
      low_stock_threshold,
      category,
      supplier_name,
      supplier_info,
      day_purchased,
      location,
      shipping_time,
      shipping_cost,
      organization: orgId,
    });
    console.log("new inventory");

    await newInventory.save({ session });
    console.log("save inventory");
    await session.commitTransaction();
    console.log("commit transaction");
    session.endSession();
    console.log("saved");

    return success(res, "Inventory created successfully", 201, newInventory);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Inventory creation error:", err);
    return error(res, "Internal server error", 500);
  } finally {
    session.endSession(); // always close session
  }
});

router.get("/", async (req, res) => {
  try {
    console.log("fetch inventories");
    const { orgId } = req.params;
    const { category } = req.query;
    const query = { organization: orgId };
    if (
      category !== null &&
      category !== "null" &&
      category !== undefined &&
      category !== "All"
    ) {
      query.category = category;
      console.log(category, "category");
      console.log(typeof category);
    }
    console.log(category);
    const inventories = await Inventory.find(query).lean();
    console.log(inventories);
    // if (inventories.length > 0) {
    return success(res, "Inventories fetched successfully", 200, inventories);
    // }

    // return error(res, "No inventories found", 404);
  } catch (err) {
    console.log(err);
    return error(res, "Something went wrong", 500);
  }
});

router.get("/:productId", async (req, res) => {
  try {
    console.log("fetch inventories");
    const { orgId, productId } = req.params;

    const inventories = await Inventory.findOne({
      organization: orgId,
      _id: productId,
    }).lean();
    console.log(inventories);

    return success(res, "Inventories fetched successfully", 200, inventories);
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

module.exports = router;
