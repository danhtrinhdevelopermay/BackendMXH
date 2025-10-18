let currentPosts = [];
const reactionEmojis = {
    'like': '👍',
    'love': '❤️',
    'haha': '😆',
    'wow': '😮',
    'sad': '😢',
    'angry': '😡'
};

async function loadFeed() {
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const data = await api.getFeed();
        currentPosts = data.posts || [];
        
        if (currentPosts.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>Chưa có bài viết nào</p>
                </div>
            `;
            return;
        }

        feedContainer.innerHTML = '';
        currentPosts.forEach(post => {
            feedContainer.appendChild(createPostCard(post));
        });
    } catch (error) {
        feedContainer.innerHTML = '<div class="empty-state"><p>Không thể tải bài viết</p></div>';
        showToast('Không thể tải bài viết', 'error');
    }
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post.id;

    const currentUserId = localStorage.getItem('userId');
    const isOwner = post.user_id == currentUserId;

    const userReaction = post.user_reaction;
    const reactionCount = post.reaction_count || 0;
    const commentCount = post.comment_count || 0;

    card.innerHTML = `
        <div class="post-header">
            <img src="${post.avatar_url || 'https://via.placeholder.com/40'}" alt="${post.username}" class="avatar">
            <div class="post-user-info">
                <div class="post-user-name">
                    ${post.full_name || post.username}
                    ${post.is_verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                </div>
                <div class="post-time">${formatTime(post.created_at)}</div>
            </div>
            ${isOwner ? `
                <button class="post-menu-btn" onclick="deletePost(${post.id})">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
        </div>
        <div class="post-content">
            ${post.content ? `<div class="post-text">${escapeHtml(post.content)}</div>` : ''}
            ${post.media_url ? renderMedia(post.media_url, post.media_type) : ''}
        </div>
        <div class="post-stats">
            <span>${reactionCount > 0 ? `${reactionCount} lượt thích` : ''}</span>
            <span>${commentCount > 0 ? `${commentCount} bình luận` : ''}</span>
        </div>
        <div class="post-actions">
            <button class="action-btn ${userReaction ? 'active' : ''}" onclick="toggleReaction(${post.id}, '${userReaction || 'like'}')">
                <i class="fas fa-thumbs-up"></i> ${userReaction ? reactionEmojis[userReaction] : 'Thích'}
            </button>
            <button class="action-btn" onclick="toggleComments(${post.id})">
                <i class="fas fa-comment"></i> Bình luận
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comment-input-container">
                <input type="text" class="comment-input" placeholder="Viết bình luận..." id="comment-input-${post.id}">
                <button class="btn-comment" onclick="addComment(${post.id})">Gửi</button>
            </div>
            <div class="comments-list" id="comments-list-${post.id}"></div>
        </div>
    `;

    return card;
}

function renderMedia(url, type) {
    if (type === 'video') {
        return `<video class="post-video" controls src="${url}"></video>`;
    } else {
        return `<img class="post-media" src="${url}" alt="Post media">`;
    }
}

async function toggleReaction(postId, currentReaction) {
    try {
        if (currentReaction && currentReaction !== 'null') {
            await api.removeReaction(postId);
        } else {
            await api.addReaction(postId, 'like');
        }
        await loadFeed();
    } catch (error) {
        showToast('Không thể thực hiện', 'error');
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);

    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        commentsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        try {
            const data = await api.getComments(postId);
            const comments = data.comments || [];
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">Chưa có bình luận</p>';
            } else {
                commentsList.innerHTML = '';
                comments.forEach(comment => {
                    commentsList.appendChild(createCommentItem(comment));
                });
            }
        } catch (error) {
            commentsList.innerHTML = '<p style="color: var(--error-color);">Không thể tải bình luận</p>';
        }
    } else {
        commentsSection.style.display = 'none';
    }
}

function createCommentItem(comment) {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
        <img src="${comment.avatar_url || 'https://via.placeholder.com/40'}" alt="${comment.username}" class="avatar">
        <div class="comment-content">
            <div class="comment-author">${comment.full_name || comment.username}</div>
            <div class="comment-text">${escapeHtml(comment.content)}</div>
            <div class="comment-time">${formatTime(comment.created_at)}</div>
        </div>
    `;
    return item;
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    try {
        await api.addComment(postId, content);
        input.value = '';
        await toggleComments(postId);
        await toggleComments(postId);
    } catch (error) {
        showToast('Không thể gửi bình luận', 'error');
    }
}

async function deletePost(postId) {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
        await api.deletePost(postId);
        showToast('Đã xóa bài viết', 'success');
        await loadFeed();
    } catch (error) {
        showToast('Không thể xóa bài viết', 'error');
    }
}

document.getElementById('create-post-input').addEventListener('click', () => {
    showCreatePostModal();
});

document.getElementById('btn-create-photo').addEventListener('click', () => {
    showCreatePostModal();
});

function showCreatePostModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Tạo bài viết mới</h3>
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div>
            <textarea id="post-content" placeholder="Bạn đang nghĩ gì?" style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical;"></textarea>
            <div style="margin: 15px 0;">
                <input type="file" id="post-media" accept="image/*,video/*" style="display: none;">
                <button onclick="document.getElementById('post-media').click()" style="padding: 10px 20px; background: var(--hover-bg); border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-image"></i> Thêm ảnh/video
                </button>
                <div id="media-preview" style="margin-top: 10px;"></div>
            </div>
            <button onclick="submitPost()" class="btn-primary">Đăng bài</button>
        </div>
    `;

    document.getElementById('post-media').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const preview = document.getElementById('media-preview');
            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 8px;">`;
                } else {
                    preview.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; border-radius: 8px;"></video>`;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    modal.classList.add('active');
}

async function submitPost() {
    const content = document.getElementById('post-content').value.trim();
    const mediaFile = document.getElementById('post-media').files[0];

    if (!content && !mediaFile) {
        showToast('Vui lòng nhập nội dung hoặc chọn ảnh/video', 'error');
        return;
    }

    const formData = new FormData();
    if (content) formData.append('content', content);
    if (mediaFile) formData.append('media', mediaFile);
    formData.append('privacy', 'public');

    try {
        await api.createPost(formData);
        showToast('Đã đăng bài viết!', 'success');
        closeModal();
        await loadFeed();
    } catch (error) {
        showToast('Không thể đăng bài', 'error');
    }
}
