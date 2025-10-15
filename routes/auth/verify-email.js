const { admin } = require("../../firebase");
const express = require("express");
const { error, success } = require("../../utils/apiResponse");
const userSchema = require("../../schemas/userSchema");
const router = express.Router();

const sgMail = require("@sendgrid/mail");
const { default: axios } = require("axios");
const extractOobCode = require("../../utils/email/extractOOBcode");

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = ({ link, email }) => ({
  to: email,
  from: { name: "InvenMatrix", email: "kennyegun241@gmail.com" },
  subject: "Verify Your Email",
  templateId: "d-bdcfc239d67544f487a832be0f48b2c1",
  dynamicTemplateData: { link },
});
async function sendVerificationEmail(userEmail) {
  try {
    const actionCodeSettings = {
      url: `${
        process.env.FRONTEND_URL
      }/auth/verify-email?email=${encodeURIComponent(userEmail)}`,
      handleCodeInApp: true,
    };

    // Generate Firebase verification link
    const firebaseLink = await admin
      .auth()
      .generateEmailVerificationLink(userEmail, actionCodeSettings);

    if (!firebaseLink) {
      throw new Error("Firebase did not return a verification link.");
    }

    // ✅ Extract oobCode and build clean link
    const finalLink = extractOobCode(firebaseLink, userEmail, "verify-email");

    console.log("FINAL LIK=NK: ", finalLink);

    // Send email with the cleaned-up link
    await sgMail.send(
      msg({
        link: finalLink,
        email: userEmail,
      })
    );

    console.log("verification email sent successfully");

    return finalLink;
  } catch (err) {
    console.error("Error sending verification email:", err.message);
    return null;
  }
}

// ================= ROUTES =================

// Request verification email
router.post("/send-email-verification", async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) return error(res, "Email is required", 400);

    const findUser = await userSchema.findOne({
      email_address: { $regex: new RegExp(`^${userEmail}$`, "i") },
    });
    if (!findUser) return error(res, "User not found", 404);

    const user = await admin.auth().getUserByEmail(userEmail);
    if (user.emailVerified) {
      return success(res, "Email already verified", 200);
    }

    await sendVerificationEmail(userEmail);
    return success(res, "Verification email sent", 200);
  } catch (err) {
    console.error("Send verification error:", err);
    return error(res, "Something went wrong", 500);
  }
});

// Verify email with oobCode
router.post("/verify-email", async (req, res) => {
  try {
    const { oobCode, userEmail } = req.body;
    if (!oobCode) return error(res, "Missing oobCode", 400);

    if (userEmail) {
      const user = await admin.auth().getUserByEmail(userEmail);
      if (user.emailVerified) {
        return success(res, "Email already verified", 200);
      }
    }

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
      { oobCode }
    );

    return success(res, "Email verified successfully", 200, response.data);
  } catch (err) {
    console.error("Verify email error:", err.response?.data || err.message);
    return error(res, "Invalid or expired verification code", 400);
  }
});

module.exports = router;
