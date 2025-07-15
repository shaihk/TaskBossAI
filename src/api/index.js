
import { API_BASE_URL } from '@/services/api';
const API_URL = `${API_BASE_URL}/api`;

// --- Tasks ---

export const getTasks = async () => {
  const response = await fetch(`${API_URL}/tasks`);
  return response.json();
};

export const createTask = async (task) => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return response.json();
};

export const updateTask = async (id, updates) => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
};

export const deleteTask = async (id) => {
  await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
};

// --- Goals ---

export const getGoals = async () => {
  const response = await fetch(`${API_URL}/goals`);
  return response.json();
};

export const createGoal = async (goal) => {
  const response = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  return response.json();
};

export const updateGoal = async (id, updates) => {
  const response = await fetch(`${API_URL}/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
};

export const deleteGoal = async (id) => {
  await fetch(`${API_URL}/goals/${id}`, {
    method: 'DELETE',
  });
};

import i18n from '@/i18n';

// ... (rest of the file)

// --- AI Chat ---

export const chat = async (messages) => {
  const language = i18n.language;
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, language }),
  });
  return response.json();
};
