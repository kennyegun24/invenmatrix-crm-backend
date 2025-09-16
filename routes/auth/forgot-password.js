const { admin } = require("../../firebase");
const express = require("express");
const { error, success } = require("../../utils/apiResponse");
const userSchema = require("../../schemas/userSchema");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
const { default: axios } = require("axios");

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = ({ redirect_link, email, full_name }) => {
  return {
    to: email,
    from: {
      name: "InvenMatrix",
      email: "kennyegun241@gmail.com",
    },
    subject: "Password Reset Request",
    templateId: "d-959732a448574f5596efeca10e44631e", // your SendGrid template
    dynamicTemplateData: {
      redirect_link,
      full_name,
    },
  };
};

async function sendPasswordResetLink(userEmail, name) {
  console.log("send function");
  const actionCodeSettings = {
    url: `${process.env.FRONTEND_URL}/auth/reset-password?email=${userEmail}`, // frontend page
    handleCodeInApp: true,
  };

  const redirect_link = await admin
    .auth()
    .generatePasswordResetLink(userEmail, actionCodeSettings);
  console.log("form link");
  await sgMail.send(
    msg({
      redirect_link,
      full_name: name,
      email: userEmail,
    })
  );
  console.log("send link");
  return;
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
    const findUser = await userSchema.findOne({ email_address: userEmail });
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
