const express = require("express");
const { error: sendError, success } = require("../../utils/apiResponse");
const authMiddleware = require("../../middleware");
const userSchema = require("../../schemas/userSchema");
const organizationSchema = require("../../schemas/organizationSchema");
const teamMemberSchema = require("../../schemas/teamMemberSchema");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, "Unauthorized access", 401);
    }

    // Find user by Firebase UID or Auth UID
    const user = await userSchema.findOne({ uid });
    if (!user) {
      console.log("no user found");
      return sendError(res, "User not found", 404);
    }

    // 1️⃣ Find organizations owned by the user
    const ownedOrgs = await organizationSchema.find({ owner: user._id });

    // 2️⃣ Find all organizations where user is a team member
    const teamMemberships = await teamMemberSchema.find({ userId: user._id });
    console.log("TEAMMEMBERS: ", teamMemberships);

    // Get unique org IDs (to avoid duplicates)
    const orgIds = [
      ...new Set([
        ...ownedOrgs.map((org) => org._id.toString()),
        ...teamMemberships.map((member) => member.organizationId.toString()),
      ]),
    ];
    console.log("ORGIDS: ", orgIds);
    console.log("ORGIDS: ", orgIds);
    if (orgIds.length === 0) {
      return sendError(res, "User has no organizations", 404);
    }

    // 3️⃣ Fetch organization details for all IDs
    const organizations = await organizationSchema.find({
      _id: { $in: orgIds },
    });

    console.log("ORGANIZATIONS: ", organizations);
    return success(res, "Organizations fetched successfully", 200, {
      status: true,
      organizations: organizations.map((org) => ({
        _id: org._id,
        company_name: org.business_name,
        company_logo: org.company_logo,
        industry: org.industry,
      })),
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return sendError(res, "Something went wrong", 500);
  }
});

module.exports = router;
