const express = require("express");
const router = express.Router({ mergeParams: true });
// const Inventory = require("@schemas/inventorySchema");
// const { error, success } = require("@/utils/apiResponse");

const Inventory = require("../../../schemas/inventorySchema");
const { error, success } = require("../../../utils/apiResponse");
const mongoose = require("mongoose");
const authMiddleware = require("../../../middleware");

// CREATE NEW INVENTORY
router.post("/", authMiddleware, async (req, res) => {
  const { orgId } = req.params;
  console.log(req.body);
  const uid = req?.user?.uid;
  return success(res, "", 200, "");
  // try {
  //   const {
  //     product_name,
  //     selling_price,
  //     cost_price,
  //     in_stock,
  //     variants,
  //     barcode,
  //     tags,
  //     product_image,
  //     description,
  //     category,
  //     supplier,
  //     location,
  //     shipping_time,
  //     shipping_cost,
  //     organization,
  //   } = req.body;

  //   if (!product_name || !selling_price || !organization) {
  //     await session.abortTransaction();
  //     return error(
  //       res,
  //       "product_name, selling_price, and organization are required",
  //       400
  //     );
  //   }
  //   const session = await mongoose.startSession();
  //   session.startTransaction();
  //   const newInventory = new Inventory({
  //     product_name,
  //     selling_price,
  //     cost_price,
  //     in_stock,
  //     variants,
  //     barcode,
  //     tags,
  //     images: product_image,
  //     description,
  //     category,
  //     supplier,
  //     location,
  //     shipping_time,
  //     shipping_cost,
  //     organization,
  //   });

  //   await newInventory.save({ session });

  //   await session.commitTransaction();
  //   session.endSession();

  //   return success(res, "Inventory created successfully", 201, newInventory);
  // } catch (err) {
  //   await session.abortTransaction();
  //   session.endSession();
  //   console.error("Inventory creation error:", err);
  //   return error(res, "Internal server error", 500);
  // }
});

router.get("/", async (req, res) => {
  try {
    const { orgId } = req.params;
    const inventories = Inventory.find({
      organization: orgId,
    });

    if (inventories.length > 0) {
      return success(res, "Inventories fetched successfully", 200, inventories);
    }

    return error(res, "No inventories found", 404);
  } catch (error) {
    return error(res, "Something went wrong", 500);
  }
});

module.exports = router;
