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
    const existingUser = await User.findOne({ email_address: email });
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
    if (existingUser) {
      console.log("user existing");
      const saveToDb = await teamMemberSchema.create({
        organizationId,
        email,
        userId: existingUser._id,
        fullName: `${existingUser.first_name} ${existingUser.last_name}`,
        roles,
        invitedAt: Date.now(),
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
    const link = `${process.env.FRONTEND_URL}/teams/invite?accept=true&code=${inviteToken}`;
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
