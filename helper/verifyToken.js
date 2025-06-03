const { admin } = require("../firebase.js");

const verifyToken = async (authToken) => {
  try {
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(authToken);
    } catch (idTokenError) {
      decodedToken = await admin.auth().verifySessionCookie(authToken);
    }

    return { success: true, user: decodedToken };
  } catch (error) {
    console.error("verifyToken error:", error);
    return { success: false, error };
  }
};

module.exports = verifyToken;
