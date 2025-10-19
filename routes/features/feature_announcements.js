const express = require("express");
const router = express.Router();
const FeatureRequest = require("../../schemas/FeatureRequestSchema");
const User = require("../../schemas/userSchema");
const authMiddleware = require("@/middleware");

// Middleware: requires user authentication (example)

// ✅ Create a new feature request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const { title, description, organization, tags, category } = req.body;
    const user = await User.findOne({ uid });

    // Basic validation
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required." });
    }

    // Create new request
    const newRequest = new FeatureRequest({
      title,
      description,
      organization: organization || null,
      tags: tags || [],
      category: category || "Other",
      user: user, // comes from your auth middleware
    });

    // Save to DB
    const savedRequest = await newRequest.save();

    res.status(201).json({
      message: "Feature request submitted successfully.",
      request: savedRequest,
    });
  } catch (err) {
    console.error("Error creating feature request:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = router;
