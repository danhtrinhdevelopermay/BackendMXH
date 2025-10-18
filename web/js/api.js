const API_BASE_URL = window.location.origin;

class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders(includeContentType = true) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${API_BASE_URL}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(options.body && !(options.body instanceof FormData)),
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Có lỗi xảy ra');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async login(username, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(username, email, fullName, password) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, full_name: fullName, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async getProfile() {
        return this.request('/api/auth/profile');
    }

    async getUser(userId) {
        return this.request(`/api/users/${userId}`);
    }

    async getFeed(page = 1) {
        return this.request(`/api/posts/feed?page=${page}`);
    }

    async getUserPosts(userId, page = 1) {
        return this.request(`/api/posts/user/${userId}?page=${page}`);
    }

    async createPost(formData) {
        const response = await fetch(`${API_BASE_URL}/api/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        return data;
    }

    async deletePost(postId) {
        return this.request(`/api/posts/${postId}`, {
            method: 'DELETE',
        });
    }

    async addReaction(postId, reactionType) {
        return this.request(`/api/reactions/${postId}`, {
            method: 'POST',
            body: JSON.stringify({ reaction_type: reactionType }),
        });
    }

    async removeReaction(postId) {
        return this.request(`/api/reactions/${postId}`, {
            method: 'DELETE',
        });
    }

    async getReactions(postId) {
        return this.request(`/api/reactions/${postId}`);
    }

    async getComments(postId) {
        return this.request(`/api/comments/${postId}`);
    }

    async addComment(postId, content) {
        return this.request(`/api/comments/${postId}`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async deleteComment(commentId) {
        return this.request(`/api/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    async getFriends() {
        return this.request('/api/friendships/friends');
    }

    async getFriendRequests() {
        return this.request('/api/friendships/requests');
    }

    async sendFriendRequest(userId) {
        return this.request('/api/friendships/request', {
            method: 'POST',
            body: JSON.stringify({ receiver_id: userId }),
        });
    }

    async respondToFriendRequest(requestId, action) {
        return this.request(`/api/friendships/request/${requestId}`, {
            method: 'PUT',
            body: JSON.stringify({ action }),
        });
    }

    async unfriend(userId) {
        return this.request(`/api/friendships/${userId}`, {
            method: 'DELETE',
        });
    }

    async searchUsers(query) {
        return this.request(`/api/friendships/search?query=${encodeURIComponent(query)}`);
    }

    async getConversations() {
        return this.request('/api/messages/conversations');
    }

    async getMessages(userId, page = 1) {
        return this.request(`/api/messages/${userId}?page=${page}`);
    }

    async sendMessage(receiverId, content) {
        return this.request('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ receiver_id: receiverId, content }),
        });
    }

    async getNotifications() {
        return this.request('/api/notifications');
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }

    async updateProfile(formData) {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        return data;
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        return this.updateProfile(formData);
    }

    async uploadCover(file) {
        const formData = new FormData();
        formData.append('cover', file);
        return this.updateProfile(formData);
    }
}

const api = new API();
