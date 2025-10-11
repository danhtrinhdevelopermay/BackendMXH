import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const postAPI = {
  createPost: (data) => api.post('/posts', data),
  getNewsFeed: (params) => api.get('/posts/feed', { params }),
  getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
};

export const commentAPI = {
  addComment: (postId, data) => api.post(`/comments/${postId}`, data),
  getComments: (postId) => api.get(`/comments/${postId}`),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

export const reactionAPI = {
  addReaction: (postId, data) => api.post(`/reactions/${postId}`, data),
  removeReaction: (postId) => api.delete(`/reactions/${postId}`),
  getReactions: (postId) => api.get(`/reactions/${postId}`),
};

export const friendshipAPI = {
  sendFriendRequest: (data) => api.post('/friendships/request', data),
  respondToFriendRequest: (requestId, data) => api.put(`/friendships/request/${requestId}`, data),
  getFriends: () => api.get('/friendships/friends'),
  getFriendRequests: () => api.get('/friendships/requests'),
  searchUsers: (query) => api.get('/friendships/search', { params: { query } }),
};

export const messageAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const uploadAPI = {
  uploadMedia: async (uri, type) => {
    const formData = new FormData();
    const isVideo = type?.startsWith('video/');
    
    formData.append('media', {
      uri,
      type: type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      name: isVideo ? 'video.mp4' : 'photo.jpg',
    });

    const token = await SecureStore.getItemAsync('token');
    const response = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
  
  uploadImage: async (uri) => {
    return uploadAPI.uploadMedia(uri, 'image/jpeg');
  },
};

export default api;
