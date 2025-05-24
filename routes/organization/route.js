const express = require("express");
const Organization = require("../../schemas/organizationSchema");
const { error, success } = require("../../utils/apiResponse");
const User = require("../../schemas/userSchema");
const authMiddleware = require("@/middleware");
const router = express.Router();

// CREATE ORGANIZATION
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const {
      business_name,
      company_email,
      company_phone,
      state,
      country,
      company_address,
      company_address_2,
      company_address_3,
      tax_id,
      company_logo,
      company_brand_color,
      company_domain,
      subscription_plan,
      timezone,
      industry,
    } = req.body;

    // Validate required fields
    if (!business_name || !company_email || !industry) {
      return error(
        res,
        "business_name, company_email, and user_id are required",
        400
      );
    }

    // Ensure user exists
    const user = await User.findOne({ uid });
    if (!user) return error(res, "User not found", 404);

    // Create organization
    const organization = new Organization({
      business_name,
      company_email,
      company_phone,
      state,
      country,
      company_address,
      company_address_2,
      company_address_3,
      tax_id,
      company_logo,
      company_brand_color,
      company_domain,
      subscription_plan,
      owner: user._id,
      timezone,
      industry,
      team_members: [{ user: user._id }], // creator added to team
    });

    const savedOrg = await organization.save();

    // Add organization to user
    user.organizations.push({
      organization: savedOrg._id,
    });

    await user.save();

    return success(res, "Organization created successfully", 201, savedOrg);
  } catch (err) {
    console.error("Error creating organization:", err);
    return error(res, "Internal server error", 500);
  }
});

// GET ORGANIZATION DETAILS
router.get("", async (req, res) => {
  try {
  } catch (error) {}
});

// DELETE ORGANIZATION
router.delete("", async (req, res) => {
  try {
  } catch (error) {}
});

// UPDATE ORGANIZATION DETAILS
router.patch("", async (req, res) => {
  try {
  } catch (error) {}
});

module.exports = router;
