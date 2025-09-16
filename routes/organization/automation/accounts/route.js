// GET ORGANIZATION CONNECTED ACCOUNTS
const express = require("express");
const router = express.Router({ mergeParams: true });
const { error, success } = require("../../../../utils/apiResponse");
const accountsSchema = require("../../../../schemas/accountsSchema");

router.get("/", async (req, res) => {
  try {
    const { orgId } = req.params;
    console.log(orgId);
    const findAccounts = await accountsSchema
      .find({ organization: orgId })
      .lean();
    console.log(findAccounts);
    return success(res, "All organization accounts", 200, findAccounts);
  } catch (err) {
    console.log(err);
    return error(res, "Something went wrong", 500);
  }
});

module.exports = router;
