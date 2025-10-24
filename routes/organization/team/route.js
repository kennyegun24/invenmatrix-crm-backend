const express = require("express");
const router = express.Router();
// const User = require("../../../schemas/userSchema");
const Organization = require("../../../schemas/organizationSchema");
const { error, success } = require("../../../utils/apiResponse");
const teamMemberSchema = require("../../../schemas/teamMemberSchema");
const Invitation = require("../../../schemas/inviteSchema");
const User = require("../../../schemas/userSchema");
const crypto = require("crypto");
const {
  sgMail,
  sendNewTeamInviteMail,
  sendTeamInviteMail,
} = require("../../../emails/emails");
const organizationSchema = require("../../../schemas/organizationSchema");
const { default: mongoose } = require("mongoose");

// ADD USER TO ORGANIZATION
router.post("/:orgId/add-to-organization", async (req, res) => {
  try {
    const { orgId } = req.params;
    const { email, roles } = req.body;
    console.log("start");
    if (!email || !roles) {
      console.log("no email");
      return error(res, "EMAIL AND ROLES NOT PRESENT", 422);
    }
    const organizationId = new mongoose.Types.ObjectId(orgId);
    const organization = await organizationSchema.findById(organizationId);
    if (!organization) {
      console.log("org not found");
      return error(res, "Organization not found", 404);
    }
    const existingUser = await User.findOne({
      email_address: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (existingUser) {
      const isAlreadyMember = await teamMemberSchema.findOne({
        organizationId,
        userId: existingUser._id,
      });
      if (isAlreadyMember) {
        console.log("member");
        return res
          .status(409)
          .json({ message: "User already in the organization." });
      }
      const saveToDb = await teamMemberSchema.create({
        organizationId,
        email,
        userId: existingUser._id,
        fullName: `${existingUser.first_name} ${existingUser.last_name}`,
        roles,
        invitedAt: Date.now(),
        joinedAt: Date.now(),
      });
      await User.findByIdAndUpdate(existingUser._id, {
        $push: {
          organizations: {
            organization: organizationId,
            roles: roles, // or roles[0] if it's a single role
          },
        },
      });
      await sgMail.send(
        sendTeamInviteMail({ email, organization: organization.business_name })
      );
      return success(res, "User added to team", 200);
    }
    console.log("user not found");
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Invitation.create({
      organization: organizationId,
      email,
      roles,
      inviteToken,
      expiresAt,
    });
    // TODO: SEND MEMBER INVITE MAIL
    const link = `${process.env.FRONTEND_URL}/invite?accept=true&code=${inviteToken}`;
    await sgMail.send(
      sendNewTeamInviteMail({
        link,
        email,
        organization: organization.business_name,
      })
    );
    return success(res, "User invited via mail", 200);
  } catch (err) {
    console.log(err);
    return error(res, "Internal server error", 500);
  }
});

// GET ALL MEMBERS IN ORGANIZATION
router.get("/:orgId/team", async (req, res) => {
  try {
    const { orgId } = req.params;

    const members = await teamMemberSchema.find({
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    // 2. Return team members
    return success(res, "Team members fetched successfully", 200, members);
  } catch (error) {
    return error(res, "Internal server error", 500);
  }
});

// EDIT USER ROLE
router.patch("/:orgId/members/:userId/roles", async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return error(res, "Roles must be provided as an array", 422);
    }
    console.log(userId);
    const organizationId = new mongoose.Types.ObjectId(orgId);
    const organization = await organizationSchema.findById(organizationId);

    if (!organization) {
      return error(res, "Organization not found", 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, "User not found", 404);
    }

    // Update roles in teamMemberSchema (organization membership)
    const member = await teamMemberSchema.findOneAndUpdate(
      { organizationId, userId },
      { $set: { roles } },
      { new: true }
    );

    if (!member) {
      return error(res, "User is not a member of this organization", 404);
    }

    // Update roles inside user's organizations array
    await User.updateOne(
      { _id: userId, "organizations.organization": organizationId },
      { $set: { "organizations.$.roles": roles } }
    );

    return success(res, "User roles updated successfully", 200, { member });
  } catch (err) {
    console.error(err);
    return error(res, "Internal server error", 500);
  }
});

// EDIT USER STATUS
router.patch("/:orgId/members/:userId/status", async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return error(res, "Status must be provided as an array", 422);
    }
    const organizationId = new mongoose.Types.ObjectId(orgId);
    const organization = await organizationSchema.findById(organizationId);

    if (!organization) {
      return error(res, "Organization not found", 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, "User not found", 404);
    }

    // Update status in teamMemberSchema (organization membership)
    const member = await teamMemberSchema.findOneAndUpdate(
      { organizationId, userId },
      { $set: { status } },
      { new: true }
    );

    if (!member) {
      return error(res, "User is not a member of this organization", 404);
    }

    return success(res, "User status updated successfully", 200, { member });
  } catch (err) {
    console.error(err);
    return error(res, "Internal server error", 500);
  }
});

// DELETE MEMBERS FROM ORGANIZATION
router.delete("/:orgId/team/:userId", async (req, res) => {
  try {
  } catch (err) {
    return error(res, "Internal server error", 500);
  }
});

// UPDATE MEMBERS ROLE OR STATUS IN ORGANIZATION
router.patch("/:orgId/team/:userId", async (req, res) => {
  try {
  } catch (err) {
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
