// demoOrgMiddleware.js
const Organization = require("./schemas/organizationSchema");

const demoOrgMiddleware = async (req, res, next) => {
  console.log(req.params);
  try {
    if (req.query.demo === "true") {
      const demoOrg = await Organization.findOne({ isDemo: true });
      if (!demoOrg) {
        return res.status(404).json({ message: "Demo organization not found" });
      }
      req.orgId = demoOrg._id;
    } else {
      req.orgId = req.params?.orgId || null;
    }

    next();
  } catch (error) {
    console.error("demoOrgMiddleware error:", error);
    return res
      .status(500)
      .json({ message: "Error resolving organization", error: error.message });
  }
};

module.exports = demoOrgMiddleware;
