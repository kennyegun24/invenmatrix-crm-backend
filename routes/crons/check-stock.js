const updateSomething = require("@/cron/check-stocks");
const express = require("express");
const router = express.Router();

router.get("/check-stock", async (req, res) => {
  try {
    try {
      console.log("stock endpoint running");
      await updateSomething();
      return res.json({ message: "success" }).status(200);
    } catch (error) {}
  } catch (error) {}
});

module.exports = router;
