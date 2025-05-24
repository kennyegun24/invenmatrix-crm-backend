const express = require("express");
const router = express.Router({ mergeParams: true });
// const Folder = require("../../schemas/folderSchema");
// const Inventory = require("../../schemas/inventorySchema");
const Inventory = require("../../../../schemas/inventorySchema");
const Folder = require("../../../../schemas/folderSchema");
const { error, success } = require("../../../../utils/apiResponse");

// PUT /api/folder/:folderId/add-inventory
router.put("/:folderId/add-inventory", async (req, res) => {
  try {
    const { folderId, orgId } = req.params;
    const { inventoryId } = req.body;

    if (!folderId || !orgId || !inventoryId) {
      return error(res, "folderId, orgId, and inventoryId are required", 400);
    }

    // Validate folder exists
    const folder = await Folder.findOne({ _id: folderId, organization: orgId });
    if (!folder) return error(res, "Folder not found", 404);

    // Validate inventory exists and belongs to same org
    const inventory = await Inventory.findOne({
      _id: inventoryId,
      organization: orgId,
    });
    if (!inventory) return error(res, "Inventory item not found", 404);

    // Check if inventory is already in folder
    if (folder.inventory.includes(inventoryId)) {
      return error(res, "Inventory already exists in this folder", 409);
    }

    // Add inventory to folder
    folder.inventory.push(inventoryId);
    await folder.save();

    return success(res, "Inventory added to folder", 200, folder);
  } catch (err) {
    console.error("Add inventory to folder error:", err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
