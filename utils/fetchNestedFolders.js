const folderSchema = require("../schemas/folderSchema");

async function getNestedFolders(folderId) {
  const folder = await folderSchema.findById(folderId).lean();
  if (!folder) return null;

  const children = await folderSchema.find({ parent: folderId }).lean();

  // Recursively fetch subfolders
  const subfolders = await Promise.all(
    children.map(async (child) => await getNestedFolders(child._id))
  );

  return {
    ...folder,
    subfolders, // This is just in the result, not stored in DB
  };
}

async function getAllFoldersWithNested(organizationId) {
  const rootFolders = await folderSchema
    .find({
      parent: null,
      organization: organizationId,
    })
    .lean();

  const result = await Promise.all(
    rootFolders.map((folder) => getNestedFolders(folder._id))
  );

  return result;
}

module.exports = { getAllFoldersWithNested };
