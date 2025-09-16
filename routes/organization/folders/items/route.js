const express = require("express");
const router = express.Router({ mergeParams: true });
// const Folder = require("@schemas/folderSchema");
// const Inventory = require("@schemas/inventorySchema");
// const { success, error } = require("@/utils/apiResponse");

const Inventory = require("../../../../schemas/inventorySchema");
const Folder = require("../../../../schemas/folderSchema");
const { error, success } = require("../../../../utils/apiResponse");
const authMiddleware = require("@/middleware");

// GET /api/folders/root-and-orphans?organization=orgId
router.get("/root-and-orphans", async (req, res) => {
  const { orgId } = req.params;
  console.log(orgId);
  if (!orgId) {
    return error(res, "orgId ID is required", 400);
  }
  console.log(orgId);
  try {
    // Fetch all root folders (no parent) in the org
    const rootFolders = await Folder.find({
      parent: null,
      organization: orgId,
    });

    // Get all inventory IDs already used in folders
    // const folders = await Folder.find({ organization: orgId }, "inventory");
    // const usedInventoryIds = folders.flatMap((f) =>
    //   f.inventory.map((id) => id.toString())
    // );

    // // Fetch all inventory items not used in any folder (orphans)
    // const orphans = await Inventory.find({
    //   organization: orgId,
    //   _id: { $nin: usedInventoryIds },
    // });
    console.log(rootFolders);
    return success(res, "", 200, { rootFolders });
  } catch (err) {
    console.error("Error fetching root folders and orphaned inventory:", err);
    return error(res, "Internal server error", 500);
  }
});

// GET SUBFOLDERS AND INVENTORIES OF A FOLDER
router.get("/:folderId/contents", authMiddleware, async (req, res) => {
  const { orgId, folderId } = req.params;
  console.log(folderId);
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

    return success(res, "", 200, {
      subfolders,
      inventory: folder.inventory,
    });
  } catch (err) {
    console.error("Error fetching folder contents:", err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
