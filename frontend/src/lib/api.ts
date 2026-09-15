// API utility — all requests go through here
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('as_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body: object) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: object) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  // Posts
  createPost: (body: object) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
  getFeed: () => request('/posts/feed'),
  getExplore: () => request('/posts/explore'),
  getPost: (id: number) => request(`/posts/${id}`),
  deletePost: (id: number) => request(`/posts/${id}`, { method: 'DELETE' }),

  // Likes
  toggleLike: (postId: number) => request(`/likes/${postId}`, { method: 'POST' }),

  // Comments
  getComments: (postId: number) => request(`/comments/${postId}`),
  addComment: (postId: number, content: string) =>
    request(`/comments/${postId}`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Follow
  follow: (userId: number) => request(`/follow/${userId}`, { method: 'POST' }),
  unfollow: (userId: number) => request(`/follow/${userId}`, { method: 'DELETE' }),
  followStatus: (userId: number) => request(`/follow/${userId}/status`),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Profile & Users
  getProfile: (username: string) => request(`/users/${username}`),
  searchUsers: (query: string) => request(`/users/search?q=${encodeURIComponent(query)}`),

  // Premium
  getPremiumInfo: () => request('/premium'),
  subscribe: () => request('/premium/subscribe', { method: 'POST' }),
  cancelPremium: () => request('/premium/cancel', { method: 'POST' }),
};
