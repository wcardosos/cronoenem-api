const { google } = require('googleapis');

async function saveInGoogleSheets(data, range) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const sheets = google.sheets({
    auth,
    version: 'v4',
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        Object.values(data),
      ],
    },
  });
}

module.exports = {
  saveInGoogleSheets
};