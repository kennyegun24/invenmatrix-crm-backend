const updateSomething = require("@/cron/check-stocks");
const express = require("express");
const router = express.Router();

router.get("/check-stock", async (req, res) => {
  try {
    try {
      await updateSomething();
    } catch (error) {}
  } catch (error) {}
});

module.exports = router;
