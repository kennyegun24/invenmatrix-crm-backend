const express = require("express");
const Organization = require("../../schemas/organizationSchema");
const { error, success } = require("../../utils/apiResponse");
const User = require("../../schemas/userSchema");
const authMiddleware = require("../../middleware");
const organizationSchema = require("../../schemas/organizationSchema");
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
      company_phone_secondary,
      contact_person,
      fax,
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
      company_phone_secondary,
      contact_person,
      fax,
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
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find organization by ID and populate owner/team_members if needed
    const organization = await organizationSchema.findById(id);
    // .populate("owner", "name email uid") // populate owner details
    // .populate("team_members.user", "name email uid"); // populate team members

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organization details fetched successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// DELETE ORGANIZATION
router.delete("", async (req, res) => {
  try {
  } catch (error) {}
});

// UPDATE ORGANIZATION DETAILS
router.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const orgId = req.params.id;

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
      company_phone_secondary,
      contact_person,
      fax,
    } = req.body;
    console.log(req.body);

    // Ensure user exists
    const user = await User.findOne({ uid });
    if (!user) return error(res, "User not found", 404);

    // Ensure organization exists
    const organization = await Organization.findById(orgId);
    if (!organization) return error(res, "Organization not found", 404);

    // Ensure only owner or invited_admin can edit
    if (
      String(organization.owner) !== String(user._id) &&
      !organization.team_members.some(
        (m) => String(m.user) === String(user._id) && m.role === "invited_admin"
      )
    ) {
      return error(res, "Not authorized to edit this organization", 403);
    }

    // Update only provided fields
    if (business_name) organization.business_name = business_name;
    if (company_email) organization.company_email = company_email;
    if (company_phone) organization.company_phone = company_phone;
    if (state) organization.state = state;
    if (country) organization.country = country;
    if (company_address) organization.company_address = company_address;
    if (company_address_2) organization.company_address_2 = company_address_2;
    if (company_address_3) organization.company_address_3 = company_address_3;
    if (tax_id) organization.tax_id = tax_id;
    if (company_logo) organization.company_logo = company_logo;
    if (company_brand_color)
      organization.company_brand_color = company_brand_color;
    if (company_domain) organization.company_domain = company_domain;
    if (subscription_plan) organization.subscription_plan = subscription_plan;
    if (timezone) organization.timezone = timezone;
    if (industry) organization.industry = industry;
    if (contact_person) organization.contact_person = contact_person;
    if (company_phone_secondary)
      organization.company_phone_secondary = company_phone_secondary;
    if (fax) organization.fax = fax;

    const updatedOrg = await organization.save();

    return success(res, "Organization updated successfully", 200, updatedOrg);
  } catch (err) {
    console.error("Error updating organization:", err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
