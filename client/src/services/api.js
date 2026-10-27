const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, ...options } = {}) {
  const token = localStorage.getItem('campusfix-token');
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    ...options,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new ApiError(result.message || 'The request could not be completed', response.status);
  }
  return result;
}

const queryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) query.set(key, value);
  });
  return query.toString();
};

export const api = {
  login: (values) => request('/auth/login', { method: 'POST', body: values }),
  register: (values) => request('/auth/register', { method: 'POST', body: values }),
  me: () => request('/auth/me'),
  listIssues: (params = {}) => request(`/issues?${queryString(params)}`),
  getIssue: (id) => request(`/issues/${id}`),
  createIssue: (values) => request('/issues', { method: 'POST', body: values }),
  updateIssue: (id, values) => request(`/issues/${id}`, { method: 'PUT', body: values }),
  updateStatus: (id, status) => request(`/issues/${id}/status`, { method: 'PATCH', body: { status } }),
  updatePriority: (id, priority) => request(`/issues/${id}/priority`, { method: 'PATCH', body: { priority } }),
  deleteIssue: (id) => request(`/issues/${id}`, { method: 'DELETE' }),
  listComments: (id) => request(`/issues/${id}/comments`),
  createComment: (id, text) => request(`/issues/${id}/comments`, { method: 'POST', body: { text } }),
};