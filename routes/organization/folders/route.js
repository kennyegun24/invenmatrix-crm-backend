const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../../../schemas/userSchema");
const Organization = require("../../../schemas/organizationSchema");
const { error, success } = require("../../../utils/apiResponse");
const folderSchema = require("../../../schemas/folderSchema");

// CREATE NEW FOLDER
router.post("/", async (req, res) => {
  try {
    const { orgId } = req.params;
    if (!orgId) return error(res, "Organization ID not present in params");
    const { userId, folder_name, parent } = req.body;
    if ((!userId, !folder_name))
      return error(res, "Missing fields: folder_name, userId");

    let ancestors = [];

    if (parent) {
      const parentFolder = await folderSchema.findById(parent);
      if (!parentFolder) {
        return error(res, "Parent folder not found", 404);
      }
      ancestors = [...parentFolder.ancestors, parentFolder._id];
    }

    const newFolder = new folderSchema({
      folder_name,
      user: userId,
      parent: parent || null,
      ancestors,
    });

    await newFolder.save();

    return success(res, "folder created", 201);
  } catch (error) {
    return error(res, "Internal server error", 500);
  }
});

// GET ALL FOLDERS IN ORGANIZATION
router.get("/all", async (req, res) => {
  try {
  } catch (error) {
    return error(res, "Internal server error", 500);
  }
});

// DELETE FOLDER FROM ORGANIZATION
router.delete("/:folderId", async (req, res) => {
  const { folderId } = req.params;
  const deleteContents = req.query.deleteContents === "true";

  try {
    // Find the target folder
    const rootFolder = await folderSchema.findById(folderId);
    if (!rootFolder) return error(res, "Folder not found", 404);

    // Find all descendant folders (recursive)
    const allFolders = await folderSchema.find({
      $or: [
        { parent: folderId },
        { ancestors: folderId }, // also includes deeply nested
      ],
    });

    const folderIdsToDelete = [folderId, ...allFolders.map((f) => f._id)];

    if (deleteContents) {
      // Collect all inventory items from all folders
      const foldersWithInventories = await folderSchema.find({
        _id: { $in: folderIdsToDelete },
      });

      const allInventoryIds = foldersWithInventories.flatMap(
        (f) => f.inventory
      );

      // Optionally: Check if any inventory exists in other folders before deleting
      await Inventory.deleteMany({ _id: { $in: allInventoryIds } });
    }

    // Delete all folders including the root
    await folderSchema.deleteMany({ _id: { $in: folderIdsToDelete } });

    return success(
      res,
      `Folder and ${
        folderIdsToDelete.length - 1
      } subfolder(s) deleted successfully${
        deleteContents ? " with their contents" : ""
      }`,
      200
    );
  } catch (err) {
    console.error("Recursive folder deletion failed:", err);
    return error(res, "Internal server error", 500);
  }
});

// UPDATE FOLDER
router.put("/:folderId", async (req, res) => {
  const { folderId } = req.params;
  const { folder_name } = req.body;

  if (!folder_name) return error(res, "Folder name is required", 400);

  try {
    const folder = await folderSchema.findByIdAndUpdate(
      folderId,
      { folder_name },
      { new: true }
    );

    if (!folder) return error(res, "Folder not found", 404);

    return success(res, "Folder name updated successfully", 200, folder);
  } catch (err) {
    console.error("Update folder name error:", err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
