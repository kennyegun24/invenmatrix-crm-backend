const express = require("express");
const { error: sendError, success } = require("../../utils/apiResponse");
const authMiddleware = require("@/middleware");
const userSchema = require("@/schemas/userSchema");
const organizationSchema = require("@/schemas/organizationSchema");
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const getUser = await userSchema.findOne({ uid });
    if (!getUser) {
      return sendError(res, "User not found", 404);
    }
    const checkOrg = await organizationSchema.findOne({
      $or: [{ owner: getUser._id }, { "team_members.user": getUser._id }],
    });
    if (!checkOrg) {
      return sendError(res, "User has no organization", 404);
    }

    return success(res, "success", 200, true);
    // console.log(uid);
  } catch (error) {
    return sendError(res, "something went wrong", 500);
  }
});

module.exports = router;
