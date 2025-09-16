const express = require("express");
const { error: sendError, success } = require("../../utils/apiResponse");
const authMiddleware = require("../../middleware");
const userSchema = require("../../schemas/userSchema");
const organizationSchema = require("../../schemas/organizationSchema");
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    // console.log("UID:", uid);

    const getUser = await userSchema.findOne({ uid });
    if (!getUser) {
      return sendError(res, "User not found", 404);
    }

    // Find all orgs where user is either owner or in team_members
    const orgs = await organizationSchema.find({
      $or: [{ owner: getUser._id }, { "team_members.user": getUser._id }],
    });

    if (!orgs || orgs.length === 0) {
      return sendError(res, "User has no organizations", 404);
    }
    // console.log(orgs, "all organizations");
    return success(res, "success", 200, {
      status: true,
      organizations: orgs.map((org) => ({
        _id: org._id,
        company_name: org.business_name,
        company_logo: org.company_logo,
        industry: org.industry,
      })),
    });
  } catch (error) {
    console.error(error);
    return sendError(res, "something went wrong", 500);
  }
});

module.exports = router;
