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

// LLM integration for AI features
export const InvokeLLM = async ({ prompt, response_json_schema, model = 'gpt-3.5-turbo' }) => {
  try {
    const response = await fetch(`${API_URL}/llm/invoke`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        prompt,
        response_json_schema,
        model
      }),
    });
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error invoking LLM:', error);
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