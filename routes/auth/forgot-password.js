const { admin } = require("../../firebase");
const express = require("express");
const { error, success } = require("../../utils/apiResponse");
const userSchema = require("../../schemas/userSchema");
const router = express.Router();
const { default: axios } = require("axios");
const extractOobCode = require("../../utils/email/extractOOBcode");
const { forgotPasswordMsg, sgMail } = require("../../emails/emails");

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

async function sendPasswordResetLink(userEmail, name) {
  try {
    console.log("send function");

    const actionCodeSettings = {
      url: `${
        process.env.FRONTEND_URL
      }/auth/reset-password?email=${encodeURIComponent(userEmail)}`, // frontend page
      handleCodeInApp: true,
    };

    // Generate Firebase reset link
    const redirect_link = await admin
      .auth()
      .generatePasswordResetLink(userEmail, actionCodeSettings);

    if (!redirect_link) {
      throw new Error("Firebase did not return a reset link.");
    }

    console.log("generated reset link:", redirect_link);

    // ✅ Use helper function
    const finalLink = extractOobCode(
      redirect_link,
      userEmail,
      "reset-password"
    );

    // Send email with the final link
    await sgMail.send(
      forgotPasswordMsg({
        redirect_link: finalLink,
        full_name: name,
        email: userEmail,
      })
    );

    console.log("reset email sent successfully");

    return finalLink;
  } catch (err) {
    console.error("Error sending password reset link:", err.message);
    return null;
  }
}

// ============ ROUTES ============

// Step 1: Request password reset link
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("forgot");
    const { userEmail } = req.body;
    if (!userEmail) {
      console.log("no user email");
      return error(res, "Email is required", 400);
    }
    console.log("user email");
    const findUser = await userSchema.findOne({
      email_address: { $regex: new RegExp(`^${userEmail}$`, "i") },
    });
    if (!findUser) {
      return error(res, "User not found", 404);
    }
    console.log("send link");
    await sendPasswordResetLink(
      userEmail,
      `${findUser.first_name} ${findUser.last_name}`
    );
    console.log("sent link");
    return success(res, "Password reset link sent to email", 200, {});
  } catch (err) {
    console.error(
      "Forgot password error:",
      err?.response?.data?.response?.body ||
        err?.response?.body ||
        JSON.stringify(err)
    );
    return error(res, "Something went wrong", 500);
  }
});

// Step 2: Reset password using oobCode
router.post("/reset-password", async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;

    if (!oobCode || !newPassword) {
      return error(res, "Missing required params", 400);
    }
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`,
      { oobCode, newPassword }
    );

    return success(
      res,
      "Password has been reset successfully",
      200,
      response.data
    );
  } catch (err) {
    const err_msg = err?.response?.data?.error?.message || "invalid-code";
    return error(res, err_msg, 400);
  }
});

module.exports = router;
