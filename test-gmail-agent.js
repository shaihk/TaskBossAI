/**
 * Manual Testing Guide for Gmail Invoice Download Agent
 * 
 * This guide helps you test the Gmail invoice download agent functionality.
 * Run these tests after setting up Gmail OAuth credentials.
 */

const API_BASE = 'http://localhost:3001';

// Helper function to get auth token (replace with actual token)
function getAuthToken() {
    // In a real scenario, you would log in and get the token
    return 'your-jwt-token-here';
}

// Test 1: Get Gmail OAuth URL
async function testGetAuthUrl() {
    console.log('\n=== Test 1: Get Gmail OAuth URL ===');
    try {
        const response = await fetch(`${API_BASE}/api/gmail/auth-url`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        const data = await response.json();
        console.log('✓ Auth URL received:', data.authUrl);
        console.log('Visit this URL to authorize Gmail access');
        return data.authUrl;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Test 2: Handle OAuth Callback (after user authorizes)
async function testOAuthCallback(authCode) {
    console.log('\n=== Test 2: Handle OAuth Callback ===');
    try {
        const response = await fetch(`${API_BASE}/api/gmail/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ code: authCode })
        });
        const data = await response.json();
        console.log('✓ OAuth callback successful:', data.message);
        return data;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Test 3: Test Gmail Connection
async function testConnection() {
    console.log('\n=== Test 3: Test Gmail Connection ===');
    try {
        const response = await fetch(`${API_BASE}/api/gmail/test`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        const data = await response.json();
        if (data.success) {
            console.log('✓ Connection successful');
            console.log(`  Email: ${data.email}`);
            console.log(`  Total messages: ${data.messagesTotal}`);
        } else {
            console.log('✗ Connection failed:', data.error);
        }
        return data;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Test 4: Download Invoices
async function testDownloadInvoices(startDate, endDate, searchQuery = '') {
    console.log('\n=== Test 4: Download Invoices ===');
    console.log(`Date range: ${startDate} to ${endDate}`);
    console.log(`Search query: ${searchQuery || 'default'}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/gmail/download-invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ startDate, endDate, searchQuery })
        });
        const data = await response.json();
        console.log('✓ Download result:', data.message);
        console.log(`  Downloaded: ${data.count} invoice(s)`);
        return data;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Test 5: Get Downloaded Invoices
async function testGetInvoices() {
    console.log('\n=== Test 5: Get Downloaded Invoices ===');
    try {
        const response = await fetch(`${API_BASE}/api/invoices`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        const data = await response.json();
        console.log(`✓ Found ${data.length} invoice(s)`);
        data.slice(0, 3).forEach((invoice, i) => {
            console.log(`\n  Invoice ${i + 1}:`);
            console.log(`    Subject: ${invoice.subject}`);
            console.log(`    From: ${invoice.sender}`);
            console.log(`    Date: ${invoice.date}`);
            console.log(`    File: ${invoice.filename}`);
            console.log(`    Size: ${invoice.file_size} bytes`);
        });
        return data;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Test 6: Delete Invoice
async function testDeleteInvoice(invoiceId) {
    console.log('\n=== Test 6: Delete Invoice ===');
    console.log(`Deleting invoice ID: ${invoiceId}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (response.status === 204) {
            console.log('✓ Invoice deleted successfully');
        } else {
            const data = await response.json();
            console.log('✗ Delete failed:', data.error);
        }
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Test 7: Disconnect Gmail
async function testDisconnect() {
    console.log('\n=== Test 7: Disconnect Gmail ===');
    try {
        const response = await fetch(`${API_BASE}/api/gmail/disconnect`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        const data = await response.json();
        console.log('✓ Disconnected:', data.message);
        return data;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Main test runner
async function runAllTests() {
    console.log('====================================');
    console.log('Gmail Invoice Agent - Test Suite');
    console.log('====================================');
    console.log('\nNOTE: Make sure to:');
    console.log('1. Start the server: npm start');
    console.log('2. Set up Gmail OAuth credentials in .env');
    console.log('3. Replace getAuthToken() with your actual JWT token');
    console.log('4. Run each test manually in the appropriate order\n');
    
    // Example usage:
    // await testGetAuthUrl();
    // After getting auth code from OAuth flow:
    // await testOAuthCallback('your-auth-code');
    // await testConnection();
    // await testDownloadInvoices('2024-01-01', '2024-12-31', 'invoice');
    // await testGetInvoices();
    // await testDeleteInvoice(1);
    // await testDisconnect();
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testGetAuthUrl,
        testOAuthCallback,
        testConnection,
        testDownloadInvoices,
        testGetInvoices,
        testDeleteInvoice,
        testDisconnect,
        runAllTests
    };
}

// Instructions
console.log('Gmail Invoice Agent - Manual Test Guide');
console.log('========================================\n');
console.log('To test the Gmail agent:');
console.log('\n1. Ensure server is running:');
console.log('   cd server && npm start\n');
console.log('2. Get a valid JWT token by logging in\n');
console.log('3. Run tests in Node.js:');
console.log('   const tests = require("./test-gmail-agent.js");');
console.log('   await tests.testGetAuthUrl();\n');
console.log('Or use curl commands:');
console.log('\ncurl -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('     http://localhost:3001/api/gmail/auth-url\n');
