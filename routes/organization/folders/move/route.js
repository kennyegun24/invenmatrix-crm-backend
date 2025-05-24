const express = require("express");
const router = express.Router({ mergeParams: true });
const Folder = require("@schemas/folderSchema");
const { error, success } = require("@/utils/apiResponse");
const { default: mongoose } = require("mongoose");

// CREATE NEW ORGANIZATION
router.post("/:folderId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orgId, folderId } = req.params;
    const { newParentId } = req.body;

    if (!orgId || !folderId || !!newParentId) {
      await session.abortTransaction();
      return error(res, "orgId, folderId not present in params", 400);
    }

    if (newParentId === folderId) {
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
