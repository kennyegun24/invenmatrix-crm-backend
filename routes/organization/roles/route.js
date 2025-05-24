const express = require("express");
const router = express.Router();
const Role = require("../../../schemas/roleSchema");
const Organization = require("../../../schemas/organizationSchema");
const { error, success } = require("../../../utils/apiResponse");
// CREATE NEW ROLE FOR ORGANIZATION TEAM MEMBERS
router.post("/create", async (req, res) => {
  try {
    const {
      name,
      description,
      organizationId,
      permissions = [],
      is_default = false,
    } = req.body;

    // 1. Validate organization exists
    const org = await Organization.findById(organizationId);
    if (!org) {
      return error(res, "Organization not found", 404);
    }

    // 2. Create Role
    const newRole = await Role.create({
      name,
      description,
      organization: organizationId,
      permissions,
      is_default,
    });

    return success(res, "Role created successfully", 201, newRole);
  } catch (err) {
    console.error("Error creating role:", err);
    return error(res, "Internal server error", 500);
  }
});

// EDIT ROLES
router.put("/:roleId/update", async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, is_default } = req.body;

    // 1. Find Role
    const role = await Role.findById(roleId);
    if (!role) {
      return error(res, "Role not found", 404);
    }

    // 2. Update fields (only if provided)
    if (name) role.name = name;
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    if (typeof is_default === "boolean") role.is_default = is_default;

    await role.save();

    return success(res, "Role updated successfully", 200, role);
  } catch (err) {
    console.error("Error updating role:", err);
    return error(res, "Internal server error", 500);
  }
});

router.get("/permissions", async (req, res) => {
  try {
  } catch (error) {}
});

module.exports = router;
