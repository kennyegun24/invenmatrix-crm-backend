require("module-alias/register");

const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectMongoDb = require("../db/connect");
const users = require("../routes/users/route");
const check_org = require("../routes/users/check-org");
const organization = require("../routes/organization/route");
const team = require("../routes/organization/team/route");
const roles = require("@/routes/organization/roles/route");
const inventories = require("../routes/organization/inventories/route");
const folder = require("../routes/organization/folders/route");
const moveFolder = require("../routes/organization/folders/move/route");
const folderInventory = require("../routes/organization/folders/add-inventory/route");

dotenv.config();
app.use(express.json());
// app.use(express.json())
app.use(
  cors({
    origin: "*",
  })
);

const startServer = async () => {
  try {
    await connectMongoDb();
    console.log("MongoDB connected");

    app.use("/user", users);
    app.use("/user/check-org", check_org);
    app.use("/organization", organization);
    app.use("/organization/team", team);
    app.use("/organization/roles", roles);
    app.use("/organization/:orgId/folders", folder);
    app.use("/organization/:orgId/folders/move", moveFolder);
    app.use("/organization/:orgId/folders/inventory", folderInventory);
    app.use("/organization/:orgId/inventories", inventories);

    app.listen(4000, () => {
      console.log("Server is running on port 4000");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
