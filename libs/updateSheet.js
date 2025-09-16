const { google } = require("googleapis");
const getOauthClient = require("./getGoogleOauthClient");

async function updateSheet(user, spreadsheetId) {
  const auth = await getOauthClient(user);
  const sheets = google.sheets({ version: "v4", auth });

  // Example data with column titles
  const headers = ["Name", "Email", "Age", "Job"];
  const values = [["Kenny Elias", "Kenny@email.com", "24", "Web Developer"]];

  // 1. Check if the sheet is empty
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1",
  });

  if (!res.data.values || res.data.values.length === 0) {
    // Sheet is empty → add headers first
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [headers] },
    });
    console.log("Headers added!");
  }

  // 2. Append the actual data
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  console.log("Data appended successfully!");
}

async function listUserSheets(user) {
  console.log("GOOGLE OAUTH CLIENT: ", user);
  try {
    const auth = await getOauthClient(user);
    updateSheet(user, "1vdmEjQeSzQuo14w4KYbrr0KW9U3KpsVIDagUPi0MMGw");
    if (!auth) return;
    // console.log("AUTH: ", auth);
    const drive = google.drive({ version: "v3", auth });
    // console.log("DRIVE: ", drive);
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id, name)",
    });

    return res.data.items || res?.data?.files; // array of spreadsheets {id, name}
  } catch (error) {
    console.log("LIST USER SHEETS ERROR", error);
  }
}

module.exports = { updateSheet, listUserSheets };
