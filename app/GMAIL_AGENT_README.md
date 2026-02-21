# Gmail Invoice Download Agent

This feature allows users to connect their Gmail account and automatically download invoices from their emails based on a date range.

## Features

- **OAuth2 Authentication**: Secure connection to Gmail using Google OAuth2
- **Date Range Search**: Search for invoices within a specific date range
- **Smart Invoice Detection**: Automatically identifies emails with invoice-related keywords and attachments
- **Multiple File Formats**: Supports PDF, images (PNG, JPG), and document formats (DOC, DOCX, XLS, XLSX)
- **Invoice Tracking**: Keeps a record of all downloaded invoices in the database
- **File Management**: Stores downloaded files in user-specific directories

## Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3001/api/gmail/callback` (for local development)
   - Download the credentials

### 2. Environment Configuration

Add the following to your `.env` file:

```env
GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3001/api/gmail/callback
```

### 3. Install Dependencies

The required dependencies are automatically installed when you run:

```bash
cd server
npm install
```

## API Endpoints

### Authentication

#### Get OAuth URL
```http
GET /api/gmail/auth-url
Authorization: Bearer <token>
```

Returns the Google OAuth URL for user authentication.

#### Handle OAuth Callback
```http
POST /api/gmail/callback
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "oauth_authorization_code"
}
```

Exchanges the authorization code for access tokens and stores them securely.

#### Test Connection
```http
GET /api/gmail/test
Authorization: Bearer <token>
```

Tests the Gmail connection and returns user's email address and message count.

#### Disconnect Gmail
```http
DELETE /api/gmail/disconnect
Authorization: Bearer <token>
```

Removes Gmail credentials from the database.

### Invoice Management

#### Download Invoices
```http
POST /api/gmail/download-invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "searchQuery": "invoice" // optional, defaults to common invoice keywords
}
```

Searches Gmail for invoices in the specified date range and downloads attachments.

#### Get Downloaded Invoices
```http
GET /api/invoices
Authorization: Bearer <token>
```

Returns a list of all downloaded invoices for the authenticated user.

#### Delete Invoice
```http
DELETE /api/invoices/:id
Authorization: Bearer <token>
```

Deletes an invoice record and its associated file.

## Usage Example

### Frontend Integration

```javascript
import { gmailAPI, invoicesAPI } from './services/api';

// 1. Get OAuth URL and redirect user
const connectGmail = async () => {
  const { authUrl } = await gmailAPI.getAuthUrl();
  window.location.href = authUrl;
};

// 2. After OAuth callback, handle the code
const handleOAuthCallback = async (code) => {
  await gmailAPI.handleCallback(code);
  console.log('Gmail connected successfully!');
};

// 3. Download invoices
const downloadInvoices = async () => {
  const result = await gmailAPI.downloadInvoices(
    '2024-01-01',  // startDate
    '2024-12-31',  // endDate
    'invoice'      // optional search query
  );
  console.log(`Downloaded ${result.count} invoices`);
};

// 4. Get downloaded invoices
const getInvoices = async () => {
  const invoices = await invoicesAPI.getAll();
  console.log('Invoices:', invoices);
};
```

## Database Schema

### gmail_credentials Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `access_token`: Gmail access token
- `refresh_token`: Gmail refresh token
- `token_expiry`: Token expiration date
- `created_at`: Timestamp
- `updated_at`: Timestamp

### downloaded_invoices Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `email_id`: Gmail message ID
- `sender`: Email sender
- `subject`: Email subject
- `date`: Email date
- `filename`: Downloaded file name
- `file_path`: Full path to downloaded file
- `file_size`: File size in bytes
- `downloaded_at`: Download timestamp

## File Storage

Downloaded invoices are stored in:
```
/invoices/<user_id>/<timestamp>_<filename>
```

Example:
```
/invoices/12345/1705420800000_Invoice_2024.pdf
```

## Security Considerations

1. **Token Storage**: Access and refresh tokens are stored securely in the database
2. **User Isolation**: Each user can only access their own Gmail credentials and invoices
3. **File Permissions**: Invoice files are stored in user-specific directories
4. **OAuth Scopes**: Uses minimal required scope (`gmail.readonly`)
5. **JWT Authentication**: All endpoints require valid JWT authentication

## Error Handling

The agent handles various error scenarios:
- Missing OAuth credentials
- Invalid authorization codes
- Expired tokens (automatic refresh via Google's API)
- Network errors
- Gmail API rate limits
- File system errors

## Limitations

1. **Rate Limits**: Subject to Gmail API quotas
2. **File Size**: Large attachments may take longer to download
3. **Search Results**: Limited to 100 emails per search (can be adjusted)
4. **File Types**: Only downloads common invoice file formats

## Future Enhancements

- [ ] Automatic invoice categorization using AI
- [ ] Invoice data extraction (amount, date, vendor)
- [ ] Email filtering by sender or subject
- [ ] Bulk download with progress tracking
- [ ] Invoice duplicate detection
- [ ] Export invoices to accounting software
