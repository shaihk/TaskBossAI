const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Gmail OAuth2 Configuration
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Initialize OAuth2 client
function getOAuth2Client() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/api/gmail/callback';

    if (!clientId || !clientSecret) {
        throw new Error('Gmail OAuth credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate OAuth URL
function getAuthUrl() {
    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
    return authUrl;
}

// Exchange authorization code for tokens
async function getTokensFromCode(code) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

// Create authenticated Gmail client
function createGmailClient(accessToken, refreshToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });
    return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Search for emails with attachments in a date range
async function searchEmails(gmail, startDate, endDate, query = '') {
    try {
        // Build search query
        let searchQuery = 'has:attachment ';
        
        // Add date filters if provided
        if (startDate) {
            searchQuery += `after:${formatDateForGmail(startDate)} `;
        }
        if (endDate) {
            searchQuery += `before:${formatDateForGmail(endDate)} `;
        }
        
        // Add custom query (e.g., "invoice" or "receipt")
        if (query) {
            searchQuery += query;
        } else {
            // Default to common invoice keywords
            searchQuery += '(invoice OR receipt OR bill OR statement)';
        }

        console.log('Gmail search query:', searchQuery);

        const response = await gmail.users.messages.list({
            userId: 'me',
            q: searchQuery,
            maxResults: 100
        });

        return response.data.messages || [];
    } catch (error) {
        console.error('Error searching emails:', error);
        throw error;
    }
}

// Format date for Gmail search (YYYY/MM/DD)
function formatDateForGmail(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// Get email details and attachments
async function getEmailDetails(gmail, messageId) {
    try {
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });

        const headers = message.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        const attachments = [];

        // Function to recursively find attachments in parts
        function findAttachments(parts) {
            if (!parts) return;

            parts.forEach(part => {
                if (part.filename && part.body && part.body.attachmentId) {
                    // Filter for PDF, images, and common document formats
                    const filename = part.filename.toLowerCase();
                    if (filename.endsWith('.pdf') || 
                        filename.endsWith('.png') || 
                        filename.endsWith('.jpg') || 
                        filename.endsWith('.jpeg') ||
                        filename.endsWith('.doc') ||
                        filename.endsWith('.docx') ||
                        filename.endsWith('.xlsx') ||
                        filename.endsWith('.xls')) {
                        attachments.push({
                            filename: part.filename,
                            mimeType: part.mimeType,
                            attachmentId: part.body.attachmentId,
                            size: part.body.size
                        });
                    }
                }

                // Recursively check nested parts
                if (part.parts) {
                    findAttachments(part.parts);
                }
            });
        }

        findAttachments([message.data.payload]);

        return {
            id: messageId,
            subject,
            from,
            date,
            attachments
        };
    } catch (error) {
        console.error(`Error getting email details for ${messageId}:`, error);
        return null;
    }
}

// Download attachment
async function downloadAttachment(gmail, messageId, attachmentId, filename, downloadPath) {
    try {
        const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: attachmentId
        });

        const data = Buffer.from(attachment.data.data, 'base64');
        
        // Ensure download directory exists
        await fs.mkdir(downloadPath, { recursive: true });
        
        // Create unique filename to avoid collisions
        const timestamp = Date.now();
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = path.join(downloadPath, `${timestamp}_${safeFilename}`);
        
        await fs.writeFile(filePath, data);
        
        return {
            filePath,
            filename: `${timestamp}_${safeFilename}`,
            size: data.length
        };
    } catch (error) {
        console.error(`Error downloading attachment ${filename}:`, error);
        throw error;
    }
}

// Main function to download invoices
async function downloadInvoices(accessToken, refreshToken, startDate, endDate, searchQuery, userId) {
    try {
        const gmail = createGmailClient(accessToken, refreshToken);
        
        // Search for emails
        const messages = await searchEmails(gmail, startDate, endDate, searchQuery);
        
        if (!messages || messages.length === 0) {
            return {
                success: true,
                message: 'No emails found matching the criteria',
                invoices: []
            };
        }

        console.log(`Found ${messages.length} emails to process`);

        // Create download directory for this user
        const downloadPath = path.join(__dirname, '..', 'invoices', String(userId));
        await fs.mkdir(downloadPath, { recursive: true });

        const downloadedInvoices = [];

        // Process each email
        for (const message of messages) {
            const emailDetails = await getEmailDetails(gmail, message.id);
            
            if (!emailDetails || emailDetails.attachments.length === 0) {
                continue;
            }

            // Download each attachment
            for (const attachment of emailDetails.attachments) {
                try {
                    const downloadResult = await downloadAttachment(
                        gmail,
                        message.id,
                        attachment.attachmentId,
                        attachment.filename,
                        downloadPath
                    );

                    downloadedInvoices.push({
                        email_id: message.id,
                        sender: emailDetails.from,
                        subject: emailDetails.subject,
                        date: emailDetails.date,
                        filename: downloadResult.filename,
                        file_path: downloadResult.filePath,
                        file_size: downloadResult.size
                    });

                    console.log(`Downloaded: ${attachment.filename}`);
                } catch (error) {
                    console.error(`Failed to download ${attachment.filename}:`, error.message);
                }
            }
        }

        return {
            success: true,
            message: `Successfully downloaded ${downloadedInvoices.length} invoice(s)`,
            invoices: downloadedInvoices
        };
    } catch (error) {
        console.error('Error in downloadInvoices:', error);
        throw error;
    }
}

// Test Gmail connection
async function testConnection(accessToken, refreshToken) {
    try {
        const gmail = createGmailClient(accessToken, refreshToken);
        const profile = await gmail.users.getProfile({ userId: 'me' });
        return {
            success: true,
            email: profile.data.emailAddress,
            messagesTotal: profile.data.messagesTotal
        };
    } catch (error) {
        console.error('Error testing Gmail connection:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    getAuthUrl,
    getTokensFromCode,
    downloadInvoices,
    testConnection
};
