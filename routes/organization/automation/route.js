// automations.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const { error, success } = require("../../../utils/apiResponse");
const automationSchema = require("../../../schemas/automationSchema");

// ✅ GET all automations for org
router.get("/", async (req, res) => {
  try {
    const { orgId } = req.params;
    const findAutomations = await automationSchema
      .find({ organization: orgId })
      .lean();
    console.log(orgId);

    return success(res, "All organization automations", 200, findAutomations);
  } catch (err) {
    console.error(err);
    return error(res, "Something went wrong", 500);
  }
});

// ✅ POST create new automation for org
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

module.exports = router;
