const {OAuth2Client} = require('google-auth-library');

// Replace 'CLIENT_ID' and 'CLIENT_SECRET' with the actual client ID and client secret from your project in the Google Developers Console
const client = new OAuth2Client('CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URL');

async function getAccessToken() {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/documents']
  });
  // Redirect the user to the authUrl
  // ...
  
  // After the user grants permission, they will be redirected to the redirect URL with the authorization code in the query parameters
  const code = req.query.code;
  
  // Use the authorization code to obtain an access token
  const {tokens} = await client.getToken(code);
  console.log(tokens);
}

// starting to access the google doc
const {google} = require('googleapis');
const docs = google.docs({version: 'v1', auth});

// Replace 'DOCUMENT_ID' with the actual ID of the document you want to retrieve
const documentId = 'DOCUMENT_ID';

docs.documents.get({
  documentId: documentId
}).then(res => {
  // res.data contains the document's metadata and content
  console.log(res.data);
}).catch(err => {
  // Handle any errors that occurred while retrieving the document
  console.error(err);
});