const API_URL = 'http://localhost:3001/api';

// Base entity class with common CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async list() {
    const response = await fetch(`${API_URL}/${this.endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.endpoint}: ${response.status}`);
    }
    return response.json();
  }

  async get(id) {
    const response = await fetch(`${API_URL}/${this.endpoint}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.endpoint}/${id}: ${response.status}`);
    }
    return response.json();
  }

  async create(data) {
    const response = await fetch(`${API_URL}/${this.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create ${this.endpoint}: ${response.status}`);
    }
    return response.json();
  }

  async update(id, data) {
    const response = await fetch(`${API_URL}/${this.endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ${this.endpoint}/${id}: ${response.status}`);
    }
    return response.json();
  }

  async delete(id) {
    const response = await fetch(`${API_URL}/${this.endpoint}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${this.endpoint}/${id}: ${response.status}`);
    }
    return response.ok;
  }
}

// User entity
export const User = {
  ...new BaseEntity('users'),
  async me() {
    const response = await fetch(`${API_URL}/users/me`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    return response.json();
  }
};

// Task entity
export const Task = new BaseEntity('tasks');

// Goal entity
export const Goal = new BaseEntity('goals');

// UserStats entity
export const UserStats = new BaseEntity('user-stats');