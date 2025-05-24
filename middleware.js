// authMiddleware.js
const verifyToken = require("./helper/verifyToken"); // adjust path as needed

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No auth token provided" });
  }

  const authToken = authorization.split("Bearer ")[1];

  try {
    const { success, user: decodedUser, error } = await verifyToken(authToken);

    if (!success) {
      return res.status(401).json({ message: "Invalid auth token", error });
    }

    // Attach the decoded user to the request
    req.user = decodedUser;
    next(); // pass control to the next middleware or route
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Token verification failed", error: err.message });
  }
};

module.exports = authMiddleware;
