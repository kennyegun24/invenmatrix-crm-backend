const axios = require("axios");

async function getNotionDatabases(accessToken) {
  try {
    const response = await axios.post(
      "https://api.notion.com/v1/search",
      {
        filter: {
          property: "object",
          value: "database",
        },
        sort: {
          direction: "descending",
          timestamp: "last_edited_time",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28", // required version header
        },
      }
    );

    return response.data.results; // Array of database objects
  } catch (error) {
    console.error(
      "Failed to fetch Notion databases:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = getNotionDatabases;
