# Gmail Invoice Agent - Quick Start Example

This is a quick example showing how to use the Gmail Invoice Download Agent.

## Prerequisites

1. Set up Gmail OAuth credentials:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3001/api/gmail/callback`

2. Add credentials to `.env`:
   ```bash
   GMAIL_CLIENT_ID=your_client_id_here
   GMAIL_CLIENT_SECRET=your_client_secret_here
   GMAIL_REDIRECT_URI=http://localhost:3001/api/gmail/callback
   ```

3. Start the server:
   ```bash
   cd server
   npm install
   npm start
   ```

## Step-by-Step Usage

### 1. Connect Gmail Account

First, get the OAuth URL:

```javascript
// Frontend code
import { gmailAPI } from './src/services/api';

const connectGmail = async () => {
  const { authUrl } = await gmailAPI.getAuthUrl();
  // Redirect user to Google's authorization page
  window.location.href = authUrl;
};
```

**cURL equivalent:**
```bash
curl -X GET http://localhost:3001/api/gmail/auth-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Handle OAuth Callback

After user authorizes, Google redirects back with a code. Handle it:

```javascript
// After OAuth redirect, extract code from URL
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  await gmailAPI.handleCallback(code);
  console.log('Gmail connected successfully!');
}
```

**cURL equivalent:**
```bash
curl -X POST http://localhost:3001/api/gmail/callback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "AUTH_CODE_FROM_GOOGLE"}'
```

### 3. Test Connection

Verify the connection works:

```javascript
const testConnection = async () => {
  const result = await gmailAPI.testConnection();
  console.log(`Connected as: ${result.email}`);
  console.log(`Total messages: ${result.messagesTotal}`);
};
```

**cURL equivalent:**
```bash
curl -X GET http://localhost:3001/api/gmail/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Download Invoices

Download invoices from a date range:

```javascript
const downloadInvoices = async () => {
  const result = await gmailAPI.downloadInvoices(
    '2024-01-01',      // Start date
    '2024-12-31',      // End date
    'invoice'          // Optional: custom search query
  );
  
  console.log(result.message);
  console.log(`Downloaded ${result.count} invoices`);
};
```

**cURL equivalent:**
```bash
curl -X POST http://localhost:3001/api/gmail/download-invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "searchQuery": "invoice"
  }'
```

### 5. List Downloaded Invoices

Get all downloaded invoices:

```javascript
import { invoicesAPI } from './src/services/api';

const listInvoices = async () => {
  const invoices = await invoicesAPI.getAll();
  
  invoices.forEach(invoice => {
    console.log(`
      Subject: ${invoice.subject}
      From: ${invoice.sender}
      Date: ${invoice.date}
      File: ${invoice.filename}
      Downloaded: ${invoice.downloaded_at}
    `);
  });
};
```

**cURL equivalent:**
```bash
curl -X GET http://localhost:3001/api/invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Delete an Invoice

Delete an invoice record and file:

```javascript
const deleteInvoice = async (invoiceId) => {
  await invoicesAPI.delete(invoiceId);
  console.log('Invoice deleted');
};
```

**cURL equivalent:**
```bash
curl -X DELETE http://localhost:3001/api/invoices/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Disconnect Gmail (Optional)

Remove Gmail connection:

```javascript
const disconnectGmail = async () => {
  await gmailAPI.disconnect();
  console.log('Gmail disconnected');
};
```

**cURL equivalent:**
```bash
curl -X DELETE http://localhost:3001/api/gmail/disconnect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Complete React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { gmailAPI, invoicesAPI } from './services/api';

function GmailInvoiceManager() {
  const [connected, setConnected] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');

  useEffect(() => {
    checkConnection();
    loadInvoices();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await gmailAPI.testConnection();
      setConnected(result.success);
    } catch (error) {
      setConnected(false);
    }
  };

  const connectGmail = async () => {
    const { authUrl } = await gmailAPI.getAuthUrl();
    window.location.href = authUrl;
  };

  const loadInvoices = async () => {
    try {
      const data = await invoicesAPI.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const result = await gmailAPI.downloadInvoices(startDate, endDate);
      alert(result.message);
      await loadInvoices();
    } catch (error) {
      alert('Failed to download invoices: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId) => {
    if (confirm('Delete this invoice?')) {
      await invoicesAPI.delete(invoiceId);
      await loadInvoices();
    }
  };

  if (!connected) {
    return (
      <div>
        <h2>Gmail Invoice Manager</h2>
        <p>Connect your Gmail account to download invoices</p>
        <button onClick={connectGmail}>Connect Gmail</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Gmail Invoice Manager</h2>
      
      <div>
        <h3>Download Invoices</h3>
        <label>
          Start Date:
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </label>
        <label>
          End Date:
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </label>
        <button onClick={handleDownload} disabled={loading}>
          {loading ? 'Downloading...' : 'Download Invoices'}
        </button>
      </div>

      <div>
        <h3>Downloaded Invoices ({invoices.length})</h3>
        {invoices.map(invoice => (
          <div key={invoice.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <strong>{invoice.subject}</strong>
            <p>From: {invoice.sender}</p>
            <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
            <p>File: {invoice.filename} ({invoice.file_size} bytes)</p>
            <button onClick={() => handleDelete(invoice.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GmailInvoiceManager;
```

## Search Query Examples

You can customize the search to find specific types of invoices:

```javascript
// Find all invoices
await gmailAPI.downloadInvoices('2024-01-01', '2024-12-31', 'invoice');

// Find receipts
await gmailAPI.downloadInvoices('2024-01-01', '2024-12-31', 'receipt');

// Find from specific sender
await gmailAPI.downloadInvoices('2024-01-01', '2024-12-31', 'from:billing@example.com');

// Multiple keywords
await gmailAPI.downloadInvoices('2024-01-01', '2024-12-31', 'invoice OR receipt OR bill');

// Specific subject
await gmailAPI.downloadInvoices('2024-01-01', '2024-12-31', 'subject:"Monthly Statement"');
```

## File Locations

Downloaded invoices are stored at:
```
/invoices/<user_id>/<timestamp>_<sanitized_filename>
```

Example:
```
/invoices/12345/1705420800000_Invoice_January_2024.pdf
```

## Error Handling

```javascript
try {
  const result = await gmailAPI.downloadInvoices(startDate, endDate);
  if (result.success) {
    console.log(`Downloaded ${result.count} invoices`);
  }
} catch (error) {
  if (error.message.includes('not connected')) {
    // Need to connect Gmail first
    connectGmail();
  } else if (error.message.includes('Invalid date')) {
    // Invalid date format
    console.error('Please use YYYY-MM-DD format');
  } else {
    // Other errors
    console.error('Failed to download invoices:', error.message);
  }
}
```

## Troubleshooting

### "Gmail not connected" error
- Make sure you've completed the OAuth flow
- Check that credentials are saved in the database

### No invoices found
- Try a wider date range
- Check if your search query is too restrictive
- Verify emails have PDF/image attachments

### OAuth errors
- Verify CLIENT_ID and CLIENT_SECRET in .env
- Check redirect URI matches Google Console settings
- Make sure Gmail API is enabled in Google Cloud Console

## Next Steps

- Add UI components in React
- Implement invoice preview
- Add filtering and sorting
- Export to accounting software
- Automatic categorization using AI
