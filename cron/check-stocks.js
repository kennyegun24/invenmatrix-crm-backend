const sgMail = require("@sendgrid/mail");
const inventorySchema = require("../schemas/inventorySchema");

// This is your function that should always run
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = ({ company_name, inventories, no_of_out_of_stock }) => {
  return {
    to: "test-069691s5s@srv1.mail-tester.com",
    from: {
      name: "InvenMatrix",
      email: "kennyegun241@gmail.com",
    },
    // from: "test@example.com", // Use the email address or domain you verified above
    subject: "LOW STOCK ALERT!",
    templateId: "d-b5f02b77c77b480f8dc43b8e5be34ecb",
    dynamicTemplateData: {
      company_name,
      inventories,
      no_of_out_of_stock,
    },
  };
};
async function updateSomething() {
  try {
    const groupedInventories = await inventorySchema.aggregate([
      {
        $match: {
          $expr: { $lt: ["$in_stock", "$low_stock_threshold"] },
        },
      },
      {
        $lookup: {
          from: "organizations",
          localField: "organization",
          foreignField: "_id",
          as: "organization",
        },
      },
      { $unwind: "$organization" },
      {
        $group: {
          _id: "$organization._id",
          organization_name: { $first: "$organization.business_name" },
          inventories: { $push: "$product_name" }, // collect product names
          no_of_out_of_stock: { $sum: 1 }, // count how many low-stock products
        },
      },
      {
        $project: {
          _id: 1,
          organization_name: 1,
          inventories: {
            $reduce: {
              input: "$inventories",
              initialValue: "",
              in: {
                $concat: [
                  {
                    $cond: [
                      { $eq: ["$$value", ""] },
                      "",
                      { $concat: ["$$value", ", "] },
                    ],
                  },
                  "$$this",
                ],
              },
            },
          },
          no_of_out_of_stock: 1,
        },
      },
    ]);

    // sgMail.send(msg);
    /*------------- data we need from each inventory...
      1. _id
      2. in_stock
      3. organization name
      4. product_name
    [
      {
        _id: "9287uyhb987g3",
        organization_name: "InnoVate Socials",
        inventories: "Audi, Toyota",
        no_of_out_of_stock: 10,
      },
      {
        _id: "8yhbj876y87yvhjbi8",
        organization_name: "Invenmatrix",
        inventories: "Beads, Chivita, Hollandia",
        no_of_out_of_stock: 3,
        ],
      },
    ];
    ---------------- */

    for (const e of groupedInventories) {
      // await sgMail.send(
      //   msg({
      //     company_name: e.organization_name,
      //     no_of_out_of_stock: e.no_of_out_of_stock,
      //     inventories: e.inventories,
      //   })
      // );
    }
    console.log(groupedInventories);

    console.log("Cron job completed successfully");
  } catch (err) {
    console.error("Error in cron job:", err);
  }
}

// Schedule the cron job
// This runs every minute. Adjust as needed.
module.exports = updateSomething;
// Keep the process alive
console.log("Cron job scheduler started...");

/*------------- data we need from each inventory...
// const groupedInventories = await inventorySchema.aggregate([
//   {
//     $match: {
//       $expr: { $lt: ["$in_stock", "$low_stock_threshold"] },
//     },
//   },
//   {
//     $lookup: {
//       from: "organizations",
//       localField: "organization",
//       foreignField: "_id",
//       as: "organization",
//     },
//   },
//   { $unwind: "$organization" },
//   {
//     $group: {
//       _id: "$organization._id",
//       organization_name: { $first: "$organization.business_name" }, // company name
//       company_email: { $first: "$organization.company_email" }, // company email
//       inventories: {
//         $push: {
//           product_name: "$product_name",
//           in_stock: "$in_stock",
//         },
//       },
//     },
//   },
// ]);

      1. _id
      2. in_stock
      3. organization name
      4. product_name
    [
      {
        _id: "9287uyhb987g3",
        organization_name: "InnoVate Socials",
        inventories: [
          {
            in_stock: 3,
            product_name: "Toyota",
          },
          {
            in_stock: 7,
            product_name: "Audi",
          },
        ],
      },
      {
        _id: "8yhbj876y87yvhjbi8",
        organization_name: "Invenmatrix",
        inventories: [
          {
            in_stock: 5,
            product_name: "Beads",
          },
          {
            in_stock: 4,
            product_name: "Chivita",
          },
          {
            in_stock: 4,
            product_name: "Hollandia",
          },
        ],
      },
    ];

    ---------------- */
