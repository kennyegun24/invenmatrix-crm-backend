const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../../../schemas/userSchema");
const Organization = require("../../../schemas/organizationSchema");
const { error: reqError, success } = require("../../../utils/apiResponse");
const folderSchema = require("../../../schemas/folderSchema");
const authMiddleware = require("@/middleware");
const userSchema = require("../../../schemas/userSchema");
const {
  getAllFoldersWithNested,
} = require("../../../utils/fetchNestedFolders");

// CREATE NEW FOLDER
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orgId } = req.params;
    if (!orgId)
      return reqError(res, "Organization ID not present in params", 404);
    const { folder_name, folder_image, parent } = req.body;
    if (!folder_name)
      return reqError(res, "Missing fields: folder_name, userId", 404);
    const uid = req.user?.uid;
    const user = await userSchema.findOne({ uid: uid });
    let ancestors = [];

    if (parent) {
      const parentFolder = await folderSchema.findById(parent);
      if (!parentFolder) {
        return reqError(res, "Parent folder not found", 404);
      }
      ancestors = [...parentFolder.ancestors, parentFolder._id];
    }

    const newFolder = new folderSchema({
      folder_name,
      folder_image,
      user: user._id,
      parent: parent || null,
      ancestors,
      organization: orgId,
    });

    await newFolder.save();

    return success(res, "folder created", 201);
  } catch (error) {
    console.log(error);
    return reqError(res, "Internal server error", 500);
  }
});

// GET ALL FOLDERS IN ORGANIZATION
router.get("/all", authMiddleware, async (req, res) => {
  const { orgId } = req.params;
  // console.log(orgId, "allfolders");
  if (!orgId) {
    return error(res, "orgId ID is required", 400);
  }
  try {
    const getFolders = await getAllFoldersWithNested(orgId);
    // console.log(getFolders);
    return success(res, "", 200, { getFolders });
  } catch (err) {
    console.error("Error fetching root folders and orphaned inventory:", err);
    return reqError(res, "Internal server error", 500);
  }
});

// DELETE FOLDER FROM ORGANIZATION
router.delete("/:folderId", async (req, res) => {
  const { folderId } = req.params;
  const deleteContents = req.query.deleteContents === "true";

  try {
    // Find the target folder
    const rootFolder = await folderSchema.findById(folderId);
    if (!rootFolder) return reqError(res, "Folder not found", 404);

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
    console.reqError("Recursive folder deletion failed:", err);
    return reqError(res, "Internal server error", 500);
  }
});

// UPDATE FOLDER
router.put("/:folderId", async (req, res) => {
  const { folderId } = req.params;
  console.log(folderId);
  const { folder_name, folder_image } = req.body;

  if (!folder_name && !folder_image)
    return reqError(res, "Folder name is required", 400);

  try {
    const folder = await folderSchema.findByIdAndUpdate(
      folderId,
      { folder_name, folder_image },
      { new: true }
    );

    if (!folder) return reqError(res, "Folder not found", 404);

    return success(res, "Folder name updated successfully", 200, folder);
  } catch (err) {
    console.reqError("Update folder name error:", err);
    return reqError(res, "Internal server error", 500);
  }
});

module.exports = router;
