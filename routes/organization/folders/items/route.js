const express = require("express");
const router = express.Router();
const Folder = require("@schemas/folderSchema");
const Inventory = require("@schemas/inventorySchema");
const { success, error } = require("@/utils/apiResponse");

// GET /api/folders/root-and-orphans?organization=orgId
router.get("/root-and-orphans", async (req, res) => {
  const { organization } = req.query;

  if (!organization) {
    return error(res, "Organization ID is required", 400);
  }

  try {
    // Fetch all root folders (no parent) in the org
    const rootFolders = await Folder.find({
      parent: null,
      organization,
    });

    // Get all inventory IDs already used in folders
    const folders = await Folder.find({ organization }, "inventory");
    const usedInventoryIds = folders.flatMap((f) =>
      f.inventory.map((id) => id.toString())
    );

    // Fetch all inventory items not used in any folder (orphans)
    const orphans = await Inventory.find({
      organization,
      _id: { $nin: usedInventoryIds },
    });

    return success(res, { rootFolders, orphans });
  } catch (err) {
    console.error("Error fetching root folders and orphaned inventory:", err);
    return error(res, "Internal server error", 500);
  }
});

// GET SUBFOLDERS AND INVENTORIES OF A FOLDER
router.get("/:folderId/contents", async (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    return error(res, "Folder ID is required", 400);
  }

  try {
    // Fetch subfolders with the given folderId as parent
    const subfolders = await Folder.find({ parent: folderId });

    // Fetch the folder itself to get inventory IDs
    const folder = await Folder.findById(folderId).populate("inventory");

    if (!folder) {
      return error(res, "Folder not found", 404);
    }

    return success(res, {
      subfolders,
      inventory: folder.inventory,
    });
  } catch (err) {
    console.error("Error fetching folder contents:", err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
