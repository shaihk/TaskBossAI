export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  }
};

// Tasks API
export const tasksAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      headers: createAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(response);
  },

  update: async (id, taskData) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders()
    });
    if (response.status === 204) {
      return { success: true };
    }
    return handleResponse(response);
  }
};

// Goals API
export const goalsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      headers: createAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (goalData) => {
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(goalData)
    });
    return handleResponse(response);
  },

  update: async (id, goalData) => {
    const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(goalData)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders()
    });
    if (response.status === 204) {
      return { success: true };
    }
    return handleResponse(response);
  }
};

// Users API
export const usersAPI = {
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: createAuthHeaders()
    });
    return handleResponse(response);
  },

  update: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  }
};

// User Stats API
export const userStatsAPI = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/api/user-stats`, {
      headers: createAuthHeaders()
    });
    return handleResponse(response);
  },

  update: async (id, statsData) => {
    const response = await fetch(`${API_BASE_URL}/api/user-stats/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(statsData)
    });
    return handleResponse(response);
  }
};

// AI Chat API
export const chatAPI = {
  sendMessage: async (messages) => {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ messages })
    });
    return handleResponse(response);
  }
};

// LLM Integration API
export const llmAPI = {
  invoke: async (prompt, responseJsonSchema = null, model = 'gpt-4o') => {
    const response = await fetch(`${API_BASE_URL}/api/llm/invoke`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        prompt,
        response_json_schema: responseJsonSchema,
        model
      })
    });
    return handleResponse(response);
  }
};
