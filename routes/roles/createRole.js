const express = require("express");
const router = express.Router({ mergeParams: true });
const FeatureRequest = require("../../schemas/FeatureRequestSchema");
const User = require("../../schemas/userSchema");
const authMiddleware = require("../../middleware");
const { default: mongoose } = require("mongoose");
const { error, success } = require("../../utils/apiResponse");
const { sgMail, newCommentMsg } = require("../../emails/emails");
const roleSchema = require("../../schemas/roleSchema");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orgId } = req.params;
    const { name, description, color } = req.body;
    if (!name || !description || !color) {
      return;
    }
    const organization = new mongoose.Types.ObjectId(orgId);
    const findRole = await roleSchema.findOne({ organization, name });
    if (findRole) {
      console.log("role exists");
      return res.json({ message: "ROle already exists" }).status(422);
    }
    const saveToDb = await roleSchema.create({
      organization: organization,
      name,
      color,
      description,
    });
    return res.json({ message: "success" }).status(200);
  } catch (error) {
    console.error(error);
    return res.json({ message: "SOMETHING WENT WRONG" }).status(500);
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { orgId } = req.params;
    const roles = await roleSchema.find({
      organization: orgId,
    });
    console.log("GET ALL ROLES");
    return success(res, "ALl roles", 200, roles);
  } catch (err) {
    error(res, "SOMETHING WENT WRONG", 500);
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const { name, description, color, permissions } = req.body;
    if (!name && !description && !color && !permissions) {
      return;
    }
    console.log("PERMISSIONS: ", permissions);
    const organization = new mongoose.Types.ObjectId(orgId);
    const updates = {};
    console.log("ORGID AND ID: ", orgId, id);
    if (permissions && Array.isArray(permissions))
      updates.permissions = permissions;
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (color) updates.color = color;
    console.log(updates);
    const findRole = await roleSchema.findOneAndUpdate(
      { organization, _id: id },
      { ...updates }
    );
    if (!findRole) {
      console.log("role exists");
      return res.json({ message: "ROle already exists" }).status(422);
    }
    return res.json({ message: "success" }).status(200);
  } catch (error) {
    console.error(error);
    return res.json({ message: "SOMETHING WENT WRONG" }).status(500);
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { orgId, id } = req.params;

    const organization = new mongoose.Types.ObjectId(orgId);

    const findRole = await roleSchema.findOneAndDelete({
      organization,
      _id: id,
    });
    if (!findRole) {
      console.log("role does not exists");
      return res.json({ message: "ROle does not exists" }).status(422);
    }
    return res.json({ message: "success" }).status(200);
  } catch (error) {
    console.error(error);
    return res.json({ message: "SOMETHING WENT WRONG" }).status(500);
  }
});

module.exports = router;
