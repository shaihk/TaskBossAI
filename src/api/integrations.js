const API_URL = 'http://localhost:3001/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Get user's AI model preferences
const getUserModelPreferences = () => {
  const saved = localStorage.getItem('aiModelPreferences');
  return saved ? JSON.parse(saved) : {
    chatModel: 'gemini-2.5-flash',
    quoteModel: 'gemini-2.5-flash',
    fallbackModel: 'gpt-4o-mini'
  };
};

// LLM integration for AI features with fallback support
export const InvokeLLM = async ({ prompt, response_json_schema, model = null, useCase = 'chat' }) => {
  const preferences = getUserModelPreferences();
  
  // Determine which model to use based on use case
  let primaryModel = model;
  if (!primaryModel) {
    switch (useCase) {
      case 'quote':
        primaryModel = preferences.quoteModel;
        break;
      case 'chat':
      default:
        primaryModel = preferences.chatModel;
        break;
    }
  }
  
  const fallbackModel = preferences.fallbackModel;
  
  // Try primary model first
  try {
    const response = await fetch(`${API_URL}/llm/invoke`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        prompt,
        response_json_schema,
        model: primaryModel
      }),
    });
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error with primary model ${primaryModel}:`, error);
    
    // Try fallback model if primary fails
    if (fallbackModel && fallbackModel !== primaryModel) {
      try {
        console.log(`Trying fallback model: ${fallbackModel}`);
        const fallbackResponse = await fetch(`${API_URL}/llm/invoke`, {
          method: 'POST',
          headers: createAuthHeaders(),
          body: JSON.stringify({
            prompt,
            response_json_schema,
            model: fallbackModel
          }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback LLM API error: ${fallbackResponse.status}`);
        }
        
        return await fallbackResponse.json();
      } catch (fallbackError) {
        console.error(`Error with fallback model ${fallbackModel}:`, fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

// Chat integration
export const chat = async (messages) => {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in chat:', error);
    throw error;
  }
};
