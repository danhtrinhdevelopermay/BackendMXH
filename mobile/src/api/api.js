import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: async (uri) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });
    const token = await SecureStore.getItemAsync('token');
    const response = await axios.post(`${API_URL}/api/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
  uploadCover: async (uri) => {
    const formData = new FormData();
    formData.append('cover', {
      uri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    });
    const token = await SecureStore.getItemAsync('token');
    const response = await axios.post(`${API_URL}/api/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export const postAPI = {
  createPost: (data) => api.post('/posts', data),
  getNewsFeed: (params) => api.get('/posts/feed', { params }),
  getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  searchPosts: (query) => api.get('/posts/search', { params: { query } }),
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
  getSuggestedFriends: () => api.get('/friendships/suggestions'),
  searchUsers: (query) => api.get('/friendships/search', { params: { query } }),
};

export const messageAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  addReaction: (messageId, data) => api.post(`/message-reactions/${messageId}`, data),
  removeReaction: (messageId) => api.delete(`/message-reactions/${messageId}`),
  getReactions: (messageId) => api.get(`/message-reactions/${messageId}`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const userAPI = {
  getUserById: (userId) => api.get(`/users/${userId}`),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
};

export const thoughtAPI = {
  createOrUpdateThought: (data) => api.post('/thoughts', data),
  getAllThoughts: () => api.get('/thoughts'),
  getUserThought: (userId) => api.get(`/thoughts/${userId}`),
  deleteThought: () => api.delete('/thoughts'),
};

export const storyAPI = {
  createStory: async (uri, mediaType, caption) => {
    const formData = new FormData();
    formData.append('media', {
      uri,
      type: mediaType.startsWith('video') ? 'video/mp4' : 'image/jpeg',
      name: mediaType.startsWith('video') ? 'story.mp4' : 'story.jpg',
    });
    formData.append('media_type', mediaType.startsWith('video') ? 'video' : 'image');
    if (caption) {
      formData.append('caption', caption);
    }

    const token = await SecureStore.getItemAsync('token');
    const response = await axios.post(`${API_URL}/api/stories`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
  getAllStories: () => api.get('/stories'),
  getUserStories: (userId) => api.get(`/stories/user/${userId}`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
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

export const relationshipAPI = {
  acceptRelationship: (data) => api.post('/relationships/accept', data),
  rejectRelationship: (data) => api.post('/relationships/reject', data),
  cancelRelationship: (data) => api.post('/relationships/cancel', data),
  getRelationshipStatus: (userId) => api.get(`/relationships/status/${userId}`),
};

export default api;
