const express = require("express");
const { error, success } = require("../../utils/apiResponse");
const userSchema = require("../../schemas/userSchema");
const authMiddleware = require("../../middleware");
const router = express.Router();

router.post("/new", authMiddleware, async (req, res) => {
  try {
    const { email, first_name, last_name } = req.body;
    // console.log(email, first_name, last_name);
    if (!email || !first_name || !last_name) {
      return error(res, "Required params not present", 400);
    }
    const uid = await req.user?.uid;
    const findUser = await userSchema.findOne({ email_address: email });
    // console.log(findUser);
    if (findUser) return error(res, "User already exist!", 400);
    await userSchema.create({
      email_address: email,
      first_name,
      last_name,
      uid,
    });
    return success(res, "User created", 201);
  } catch (error) {
    console.log(error);
  }
});

router.delete("", async (req, res) => {
  try {
  } catch (error) {}
});

router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (!userId) return error(res, "User ID is required", 400);

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return error(res, "User not found", 404);

    return success(res, "User updated successfully", 200, updatedUser);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email_address) {
      return error(res, "Email address already in use", 409);
    }
    console.error("Update user error:", err);
    return error(res, "Internal server error", 500);
  }
});

module.exports = router;
