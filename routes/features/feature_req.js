const express = require("express");
const router = express.Router();
const FeatureRequest = require("../../schemas/FeatureRequestSchema");
const User = require("../../schemas/userSchema");
const authMiddleware = require("@/middleware");
const { default: mongoose } = require("mongoose");

// Middleware: requires user authentication (example)

// Create a new feature request
router.post("/", authMiddleware, async (req, res) => {
  console.log(req.body);
  try {
    const uid = req.user?.uid;
    const { title, description, organization, tags, category } = req.body;
    const user = await User.findOne({ uid });

    // Basic validation
    if (!title || !description || !user) {
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

// GET all feature requests with filtering, sorting, and pagination
router.get("/", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const {
      filter = "trending",
      status,
      category,
      page = 1,
      limit = 10,
      mine,
    } = req.query;
    console.log("MINE: "), mine;
    const skip = (page - 1) * limit;

    // 🧭 Build filter object dynamically
    const query = {};
    if (status && status !== "null" && status !== undefined && status !== null)
      query.status = status;
    if (
      category &&
      category !== "null" &&
      category !== undefined &&
      category !== null
    )
      query.category = category;
    if (mine && req.user?.uid) {
      const user = await User.findOne({ uid });
      query.user = user?._id;
    }

    // 🔍 Determine sorting logic
    let sort = {};
    switch (filter) {
      case "most_liked":
        sort = { likesCount: -1 };
        break;
      case "most_commented":
        sort = { commentsCount: -1 };
        break;
      case "most_recent":
        sort = { createdAt: -1 };
        break;
      case "trending":
      default:
        // Trending = weighted score: likes + half of comments
        sort = { trendingScore: -1 };
        break;
    }

    // 🧠 Aggregation pipeline for performance
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          likesCount: { $size: "$votes" },
          commentsCount: { $size: "$comments" },
          trendingScore: {
            $add: [
              { $size: "$votes" },
              { $divide: [{ $size: "$comments" }, 2] },
            ],
          },
        },
      },
      { $sort: sort },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          title: 1,
          description: 1,
          status: 1,
          category: 1,
          likesCount: 1,
          commentsCount: 1,
          trendingScore: 1,
          createdAt: 1,
          tags: 1,
          updatedAt: 1,
          "user._id": 1,
          "user.first_name": 1,
          "user.last_name": 1,
          "user.image": 1,
        },
      },
    ];

    const results = await FeatureRequest.aggregate(pipeline);

    // Optionally count total for pagination UI
    const totalCount = await FeatureRequest.countDocuments(query);

    res.json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      results,
    });
  } catch (error) {
    console.error("Error fetching feature requests:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// GET REQUEST DETAILS
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user?.uid;
    const user = await User.findOne({ uid });
    console.log(user);
    // 🧠 Step 1: Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid feature request ID" });
    }

    // 🧠 Step 2: Fetch with populated user info
    const feature = await FeatureRequest.findById(id)
      .populate("user", "first_name last_name image") // optional fields from user
      .populate("organization", "name") // optional org details
      .populate({
        path: "comments.user", // nested populate
        select: "first_name last_name image", // choose fields to return
      })
      .lean();

    const hasVoted = await FeatureRequest.exists({
      _id: id,
      "votes.user": user?._id,
    });

    // 🧠 Step 3: Handle not found
    if (!feature) {
      return res
        .status(404)
        .json({ success: false, message: "Feature request not found" });
    }

    // 🧠 Step 4: Add computed values (if needed)
    const result = {
      ...feature,
      hasVoted: hasVoted,
      likesCount: feature.votes?.length || 0,
      commentsCount: feature.comments?.length || 0,
      trendingScore:
        (feature.votes?.length || 0) + (feature.comments?.length || 0) / 2,
    };

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error fetching feature request:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// COMMENT ON REQUEST
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const user = await User.findOne({ uid });
    const { id } = req.params;
    const { message } = req.body;

    // 1️⃣ Check for valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid feature ID." });
    }

    // 2️⃣ Validate inputs
    if (!user || !message) {
      return res
        .status(400)
        .json({ message: "User ID and comment are required." });
    }

    // 3️⃣ Find feature
    const feature = await FeatureRequest.findById(id);
    if (!feature) {
      return res.status(404).json({ message: "Feature not found." });
    }

    // 4️⃣ Push comment to the feature
    feature.comments.push({
      user: user?._id,
      message: message,
      createdAt: new Date(),
    });

    // 5️⃣ Save and return updated feature
    await feature.save();

    res.status(200).json({
      message: "Comment added successfully.",
      feature,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// LIKE REQUEST
router.get("/:id/like", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user?.uid;

    // 🧠 Step 1: Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feature request ID",
      });
    }

    // 🧠 Step 2: Get user
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🧠 Step 3: Check if user already voted
    const hasVoted = await FeatureRequest.exists({
      _id: id,
      "votes.user": user._id,
    });

    let message = "";
    if (hasVoted) {
      // 🗑️ Remove user from votes
      await FeatureRequest.updateOne(
        { _id: id },
        { $pull: { votes: { user: user._id } } }
      );
      message = "Vote removed";
    } else {
      // ➕ Add user to votes
      await FeatureRequest.updateOne(
        { _id: id },
        { $push: { votes: { user: user._id, votedAt: new Date() } } }
      );
      message = "Vote added";
    }

    // 🧮 Step 4: Get updated count
    const updatedFeature = await FeatureRequest.findById(id).select("votes");
    const likeCount = updatedFeature.votes.length;

    res.json({
      success: true,
      message,
      liked: !hasVoted,
      likeCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Server error while toggling like",
    });
  }
});

// MY REQUESTS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const {
      filter = "trending",
      status,
      category,
      page = 1,
      limit = 10,
    } = req.query;
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const skip = (page - 1) * limit;

    // 🧭 Build filter object dynamically
    const query = {};
    if (status && status !== "null" && status !== undefined && status !== null)
      query.status = status;
    if (
      category &&
      category !== "null" &&
      category !== undefined &&
      category !== null
    )
      query.category = category;
    console.log("QUERY: ", query);
    // 🔍 Determine sorting logic
    let sort = {};
    switch (filter) {
      case "most_liked":
        sort = { likesCount: -1 };
        break;
      case "most_commented":
        sort = { commentsCount: -1 };
        break;
      case "most_recent":
        sort = { createdAt: -1 };
        break;
      case "trending":
      default:
        // Trending = weighted score: likes + half of comments
        sort = { trendingScore: -1 };
        break;
    }

    // 🧠 Aggregation pipeline for performance
    const pipeline = [
      { $match: { ...query, user: user?._id } },
      {
        $addFields: {
          likesCount: { $size: "$votes" },
          commentsCount: { $size: "$comments" },
          trendingScore: {
            $add: [
              { $size: "$votes" },
              { $divide: [{ $size: "$comments" }, 2] },
            ],
          },
        },
      },
      { $sort: sort },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          title: 1,
          description: 1,
          status: 1,
          category: 1,
          likesCount: 1,
          commentsCount: 1,
          trendingScore: 1,
          createdAt: 1,
          tags: 1,
          updatedAt: 1,
          "user._id": 1,
          "user.first_name": 1,
          "user.last_name": 1,
          "user.image": 1,
        },
      },
    ];

    const results = await FeatureRequest.aggregate(pipeline);

    // Optionally count total for pagination UI
    const totalCount = await FeatureRequest.countDocuments(query);

    res.json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      results,
    });
  } catch (error) {
    console.error("Error fetching feature requests:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
module.exports = router;
