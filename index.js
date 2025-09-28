require("module-alias/register");
const cron = require("node-cron");

const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectMongoDb = require("./db/connect");
const users = require("./routes/users/route");
const check_org = require("./routes/users/check-org");
const organization = require("./routes/organization/route");
const team = require("./routes/organization/team/route");
const roles = require("./routes/organization/roles/route");
const inventories = require("./routes/organization/inventories/route");
const folder = require("./routes/organization/folders/route");
const folderList = require("./routes/organization/folders/items/route");
const moveFolder = require("./routes/organization/folders/move/route");
const folderInventory = require("./routes/organization/folders/add-inventory/route");
const customer = require("./routes/organization/customer/route");
const order = require("./routes/organization/orders/route");
const updateSomething = require("./cron/check-stocks");
const automation = require("./routes/organization/automation/route");
const accounts = require("./routes/organization/automation/accounts/route");

// AUTH
const verify_email = require("./routes/auth/verify-email");
const forgot_password = require("./routes/auth/forgot-password");

// THIRD PARTY OAUTHS
const google = require("./routes/oauth/google/google");
const google_redirect = require("./routes/oauth/google/redirect");
const discord = require("./routes/oauth/discord/discord");

// METRICS
const total_sales_metric = require("./routes/charts/metrics/totalSales");
const total_sales = require("./routes/charts/totalSales");
const monthlyIncome = require("./routes/charts/monthlyIncome");
const customerCharts = require("./routes/charts/customer_charts/stocks-sales");

dotenv.config();
// app.use(express.json())
app.use(
  cors({
    origin: [
      "https://invenmatrix.com",
      "https://www.invenmatrix.com",
      "http://172.20.10.3:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
// app.options("*", cors());
app.use(express.json());
app.use(cookieParser());

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
    app.use("/organization/:orgId/folders/lists", folderList);
    app.use("/organization/:orgId/folders/move", moveFolder);
    app.use("/organization/:orgId/folders/inventory", folderInventory);
    app.use("/organization/:orgId/inventories", inventories);
    app.use("/organization/:orgId/customers", customer);
    app.use("/organization/:orgId/orders", order);

    // AUTH ENDPOINTS
    app.use("/auth", verify_email);
    app.use("/auth", forgot_password);

    // OAUTH ENDPOINTS
    app.use("/organization/:orgId/oauth/google", google);
    app.use("/oauth/google/", google_redirect);
    app.use("/oauth/discord", discord);

    // AUTOMATION / ACCOUNTS ENDPOINTS
    app.use("/organization/:orgId/automation/accounts", accounts);
    app.use("/organization/:orgId/automation", automation);

    // METRICS/CHARTS ENDPOINTS
    app.use("/metrics", total_sales_metric);
    app.use("/charts", total_sales);
    app.use("/charts", monthlyIncome);
    app.use("/charts", customerCharts);

    app.listen(4000, () => {
      console.log("Server is running on port 4000");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};
cron.schedule(
  "* * * * *",
  () => {
    updateSomething();
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);
startServer();
