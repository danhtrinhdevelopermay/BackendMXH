let currentProfile = null;

async function loadProfile() {
    try {
        const data = await api.getProfile();
        console.log('Profile data received:', data);
        currentProfile = data.user;
        displayProfile(currentProfile);
        await loadUserPosts(currentProfile.id);
    } catch (error) {
        console.error('Profile error:', error);
        showToast('Không thể tải trang cá nhân', 'error');
    }
}

function displayProfile(user) {
    document.getElementById('profile-name').textContent = user.full_name || user.username;
    document.getElementById('profile-bio').textContent = user.bio || 'Chưa có tiểu sử';
    
    const avatarUrl = user.avatar_url || 'https://via.placeholder.com/150';
    document.getElementById('profile-avatar').src = avatarUrl;
    document.getElementById('user-avatar-post').src = avatarUrl;
    
    const coverPhoto = document.getElementById('profile-cover');
    if (user.cover_url) {
        coverPhoto.style.backgroundImage = `url(${user.cover_url})`;
        coverPhoto.style.backgroundSize = 'cover';
        coverPhoto.style.backgroundPosition = 'center';
    }
}

async function loadUserPosts(userId) {
    const container = document.getElementById('profile-posts');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const data = await api.getUserPosts(userId);
        const posts = data.posts || [];

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-image"></i>
                    <p>Chưa có bài viết</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '<h3 style="margin-bottom: 15px;">Bài viết</h3>';
        posts.forEach(post => {
            container.appendChild(createPostCard(post));
        });
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Không thể tải bài viết</p></div>';
    }
}

document.getElementById('btn-edit-avatar').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await api.uploadAvatar(file);
                showToast('Đã cập nhật ảnh đại diện', 'success');
                await loadProfile();
            } catch (error) {
                showToast('Không thể cập nhật ảnh đại diện', 'error');
            }
        }
    };
    input.click();
});

document.getElementById('btn-edit-cover').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await api.uploadCover(file);
                showToast('Đã cập nhật ảnh bìa', 'success');
                await loadProfile();
            } catch (error) {
                showToast('Không thể cập nhật ảnh bìa', 'error');
            }
        }
    };
    input.click();
});

document.getElementById('btn-edit-profile').addEventListener('click', () => {
    showEditProfileModal();
});

function showEditProfileModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Chỉnh sửa trang cá nhân</h3>
            <button class="modal-close" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div>
            <div class="form-group">
                <label>Họ và tên</label>
                <input type="text" id="edit-fullname" value="${currentProfile.full_name || ''}" class="form-group input">
            </div>
            <div class="form-group">
                <label>Tiểu sử</label>
                <textarea id="edit-bio" style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical;">${currentProfile.bio || ''}</textarea>
            </div>
            <button onclick="saveProfile()" class="btn-primary">Lưu thay đổi</button>
        </div>
    `;

    modal.classList.add('active');
}

async function saveProfile() {
    const fullName = document.getElementById('edit-fullname').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    const formData = new FormData();
    if (fullName) formData.append('full_name', fullName);
    if (bio) formData.append('bio', bio);

    try {
        await api.updateProfile(formData);
        showToast('Đã cập nhật trang cá nhân', 'success');
        closeModal();
        await loadProfile();
    } catch (error) {
        showToast('Không thể cập nhật', 'error');
    }
}
