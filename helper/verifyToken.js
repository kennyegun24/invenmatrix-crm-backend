const { admin } = require("../firebase.js");

const verifyToken = async (authToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    return { success: true, user: decodedToken };
  } catch (error) {
    console.error("verifyToken error:", error);
    return { success: false, error };
  }
};

module.exports = verifyToken;
