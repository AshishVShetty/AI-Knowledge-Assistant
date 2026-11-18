const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const getToken = () => localStorage.getItem('knowledge_assistant_token');
export const setToken = (token) => localStorage.setItem('knowledge_assistant_token', token);
export const removeToken = () => localStorage.removeItem('knowledge_assistant_token');

export const getUserEmail = () => localStorage.getItem('knowledge_assistant_email');
export const setUserEmail = (email) => localStorage.setItem('knowledge_assistant_email', email);
export const removeUserEmail = () => localStorage.removeItem('knowledge_assistant_email');

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type if body is FormData (browser will set multipart/form-data boundary)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error(
      `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running on port 8000.`
    );
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      removeUserEmail();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    const errorMsg = data?.detail || data?.message || response.statusText || 'An error occurred';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (username, email, password) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/me'),

  // Health check
  healthCheck: () => request('/'),

  // Documents
  getDocuments: () => request('/documents'),

  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  deleteDocument: (filename) =>
    request(`/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    }),

  // Chat
  askQuestion: (question, sessionId = 'default-session') =>
    request('/ask', {
      method: 'POST',
      body: JSON.stringify({ question, session_id: sessionId }),
    }),

  clearHistory: (sessionId) =>
    request(`/history/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    }),

  // Chat Sessions & History
  getSessions: () => request('/sessions'),

  getSessionMessages: (sessionId) =>
    request(`/sessions/${encodeURIComponent(sessionId)}`),

  deleteSession: (sessionId) =>
    request(`/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    }),
};
