// automations.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const { error, success } = require("../../../utils/apiResponse");
const automationSchema = require("../../../schemas/automationSchema");

// ✅ GET all automations for org
router.get("/", async (req, res) => {
  try {
    const { orgId } = req.params; // ensure orgId is coming from req.params
    const page = parseInt(req.query.page) || 1; // current page number (default: 1)
    const limit = 10; // max per page
    const skip = (page - 1) * limit;

    // Get total count first (for frontend pagination)
    const totalCount = await automationSchema.countDocuments({
      organization: orgId,
    });

    // Fetch paginated results
    const findAutomations = await automationSchema
      .find({ organization: orgId })
      .skip(skip)
      .limit(limit)
      .lean();

    return success(res, "All organization automations", 200, {
      data: findAutomations,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        pageSize: limit,
      },
    });
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const findAutomations = await automationSchema.findById(id);
    console.log(orgId);

    return success(res, "All organization automations", 200, findAutomations);
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

// POST create new automation for org
router.post("/", async (req, res) => {
  try {
    const { orgId } = req.params;
    console.log(orgId);
    const { name, workflows, edges, activated, description } = req.body;

    if (!name) {
      return error(res, "Automation name is required", 400);
    }

    const newAutomation = await automationSchema.create({
      organization: orgId,
      name,
      description,
      nodes: workflows || [],
      edges: edges || [],
      activated: activated || true,
    });

    return success(res, "Automation created successfully", 201, newAutomation);
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { orgId } = req.params; // or get it from req.query/org middleware if needed
    const { id } = req.params; // automation id
    const { name, workflows, edges, activated, description } = req.body;

    if (!id) {
      return error(res, "Automation ID is required", 400);
    }

    const existingAutomation = await automationSchema.findOne({
      _id: id,
      organization: orgId,
    });

    if (!existingAutomation) {
      return error(res, "Automation not found", 404);
    }

    // Update fields dynamically
    existingAutomation.name = name ?? existingAutomation.name;
    existingAutomation.description =
      description ?? existingAutomation.description;
    existingAutomation.nodes = workflows ?? existingAutomation.nodes;
    existingAutomation.edges = edges ?? existingAutomation.edges;
    existingAutomation.activated = activated ?? existingAutomation.activated;

    const updatedAutomation = await existingAutomation.save();

    return success(
      res,
      "Automation updated successfully",
      200,
      updatedAutomation
    );
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

module.exports = router;
