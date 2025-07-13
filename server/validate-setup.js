const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');

// Try to load .env from server directory first, then from parent directory
const serverEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(serverEnvPath)) {
  require('dotenv').config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config(); // Default behavior
}

async function validateOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.log('Please run setup.bat to configure your API key');
    return false;
  }

  if (!apiKey.startsWith('sk-')) {
    console.error('❌ Error: Invalid OpenAI API key format');
    console.log('API key should start with "sk-"');
    return false;
  }

  try {
    console.log('🔍 Validating OpenAI API key...');
    
    const openai = new OpenAI({ apiKey });
    
    // Test the API key with a simple request (with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      }, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response && response.choices && response.choices.length > 0) {
        console.log('✅ OpenAI API key is valid and working!');
        return true;
      } else {
        console.error('❌ Error: Unexpected response from OpenAI API');
        return false;
      }
    } catch (apiError) {
      clearTimeout(timeoutId);
      if (apiError.name === 'AbortError') {
        console.error('❌ Error: OpenAI API request timed out');
        return false;
      }
      throw apiError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('❌ Error validating OpenAI API key:', error.message);
    
    if (error.status === 401) {
      console.log('The API key is invalid or has been revoked.');
      console.log('Please check your API key at: https://platform.openai.com/account/api-keys');
    } else if (error.status === 429) {
      console.log('Rate limit exceeded. Please try again later.');
    } else if (error.status === 402) {
      console.log('Insufficient credits. Please add credits to your OpenAI account.');
    }
    
    return false;
  }
}

async function validateJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('❌ Error: JWT_SECRET not found in environment variables');
    return false;
  }

  if (jwtSecret.length < 32) {
    console.error('❌ Error: JWT_SECRET is too short (should be at least 32 characters)');
    return false;
  }

  console.log('✅ JWT secret is configured properly');
  return true;
}

async function validateSetup() {
  console.log('========================================');
  console.log('    Task Flow AI - Setup Validation');
  console.log('========================================');
  console.log('');

  const openaiValid = await validateOpenAIKey();
  const jwtValid = await validateJWTSecret();

  console.log('');
  console.log('========================================');
  
  if (openaiValid && jwtValid) {
    console.log('✅ All configurations are valid!');
    console.log('Server is ready to start...');
    console.log('========================================');
    return true;
  } else {
    console.log('❌ Configuration validation failed!');
    console.log('Please run setup.bat to fix the configuration');
    console.log('========================================');
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateSetup().then(isValid => {
    process.exit(isValid ? 0 : 1);
  });
}

module.exports = { validateSetup, validateOpenAIKey, validateJWTSecret };