const express = require("express");
const router = express.Router({ mergeParams: true });
// const Folder = require("@schemas/folderSchema");

const Folder = require("../../../../schemas/folderSchema");
const { error, success } = require("../../../../utils/apiResponse");
const { default: mongoose } = require("mongoose");

// MOVE FOLDER
router.post("/:folderId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orgId, folderId } = req.params;
    const { newParentId } = req.body;
    console.log(orgId, folderId, newParentId);

    if (!orgId || !folderId || !newParentId) {
      await session.abortTransaction();
      console.log("no parameter");
      return error(res, "orgId, folderId not present in params", 400);
    }

    if (newParentId === folderId) {
      console.log("same ids");
      await session.abortTransaction();
      return error(res, "Cannot move folder into itself", 400);
    }

    const folderToMove = await Folder.findOne({
      _id: folderId,
      organization: orgId,
    });
    if (!folderToMove) {
      await session.abortTransaction();
      return error(res, "Folder not found", 404);
    }

    const getAllDecendants = async (parentId) => {
      const descendants = [];
      let currentLevel = [parentId];

      while (currentLevel.length > 0) {
        // all current level children in one query
        const children = await Folder.find(
          {
            parent: { $in: currentLevel },
            organization: orgId,
          },
          "_id"
        ).session(session);

        const childIds = children.map((child) => child._id.toString());
        descendants.push(...childIds);

        currentLevel = childIds;
      }

      return descendants;
    };

    const descendantIds = await getAllDecendants(folderId);
    if (descendantIds.includes(newParentId)) {
      await session.abortTransaction();
      console.log("descendants");
      return error(res, "Cannot move folder into one of its descendants", 400);
    }

    let newAncestors = [];
    if (newParentId) {
      const newParent = await Folder.findOne({
        _id: newParentId,
        organization: orgId,
      }).session(session);
      if (!newParent) return error(res, "New parent folder not found", 404);
      await session.abortTransaction();
      newAncestors = [...newParent.ancestors, newParent._id];
    }

    folderToMove.parent = newParentId || null;
    folderToMove.ancestors = newAncestors;
    await folderToMove.save({ session });

    // update descendants recursively
    const updateDescendants = async (parentFolder) => {
      const children = await Folder.find({
        parent: parentFolder._id,
        organization: orgId,
      }).session(session);
      for (const child of children) {
        child.ancestors = [...parentFolder.ancestors, parentFolder._id];
        await child.save({ session });
        await updateDescendants(child);
      }
    };

    await updateDescendants(folderToMove);

    return success(res, "Folder moved successfully", 200);
  } catch (error) {
    console.log(error);
    return error(res, "Internal server error", 500);
  }
});

router.post("/:folderId/make-root", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { folderId, orgId } = req.params;

    if (!orgId || !folderId) {
      await session.abortTransaction();
      return error(res, "orgId or folderId missing", 400);
    }

    const folder = await Folder.findOne({
      _id: folderId,
      organization: orgId,
    }).session(session);
    if (!folder) {
      await session.abortTransaction();
      return error(res, "Folder not found", 404);
    }

    // Make this folder a root folder
    folder.parent = null;
    folder.ancestors = [];
    await folder.save({ session });

    // Recursively update descendants
    const updateDescendants = async (parentFolder) => {
      const children = await Folder.find({
        parent: parentFolder._id,
        organization: orgId,
      }).session(session);

      for (const child of children) {
        // Remove any ancestors matching the now-root folder or above
        child.ancestors = [...parentFolder.ancestors, parentFolder._id];
        await child.save({ session });
        await updateDescendants(child);
      }
    };

    await updateDescendants(folder);

    await session.commitTransaction();
    session.endSession();
    return success(res, "Folder is now a root folder", 200);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;

// get all folder descendants
// const getAllDecendants = async (parentId) => {
//   const descendants = [];
//   const queue = [parentId];

//   while (queue.length) {
//     const current = queue.shift();
//     const children = await Folder.find(
//       { parent: current, organization: orgId },
//       "_id"
//     );

//     for (const child of children) {
//       descendants.push(child._id.toString());
//       queue.push(child._id.toString());
//     }
//   }

//   return descendants;
// };
