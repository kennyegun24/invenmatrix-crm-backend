const express = require("express");
const router = express.Router();
const User = require("../../../schemas/userSchema");
const Organization = require("../../../schemas/organizationSchema");
const { error, success } = require("../../../utils/apiResponse");

// ADD USER TO ORGANIZATION
router.post("/:orgId/add-to-organization/:userId", async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return error(res, "User not found", 404);
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return error(res, "Organization not found", 404);
    }

    const alreadyInOrg = user.organizations.some(
      (org) => org.organization.toString() === orgId
    );
    if (alreadyInOrg) {
      return error(res, "User is already part of this organization.", 400);
    }

    user.organizations.push({
      organization: orgId,
      role: role, // Optional, can be null if not provided
    });

    const isMember = organization.team_members.some(
      (member) => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      organization.team_members.push({ user: userId, role: role });
    }

    // Save both
    await user.save();
    await organization.save();

    return success(res, "User added to organization successfully.", 200, user);
  } catch (err) {
    console.error("Error adding user to organization:", error);
    return error(res, "Internal server error", 500);
  }
});

// GET ALL MEMBERS IN ORGANIZATION
router.get("/:orgId/team", async (req, res) => {
  try {
    const { orgId } = req.params;

    const organization = await Organization.findById(orgId).populate({
      path: "team_members",
      select: "first_name last_name email_address user_name status",
    });

    if (!organization) {
      return error(res, "Organization not found", 404);
    }

    // 2. Return team members
    return success(
      res,
      "Team members fetched successfully",
      200,
      organization.team_members
    );
  } catch (error) {
    return error(res, "Internal server error", 500);
  }
});

// DELETE MEMBERS FROM ORGANIZATION
router.delete("/:orgId/team/:userId", async (req, res) => {
  try {
  } catch (error) {
    return error(res, "Internal server error", 500);
  }
});

// UPDATE MEMBERS ROLE OR STATUS IN ORGANIZATION
router.patch("/:orgId/team/:userId", async (req, res) => {
  try {
  } catch (error) {
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
