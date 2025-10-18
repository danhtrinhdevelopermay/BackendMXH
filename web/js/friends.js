let currentFriendsTab = 'friends-list';

const friendsTabs = document.querySelectorAll('.friends-tabs .tab-btn');
friendsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        friendsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFriendsTab = tab.dataset.tab;
        loadFriendsContent();
    });
});

async function loadFriendsContent() {
    const container = document.getElementById('friends-content');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        switch (currentFriendsTab) {
            case 'friends-list':
                await loadFriendsList(container);
                break;
            case 'friend-requests':
                await loadFriendRequests(container);
                break;
            case 'find-friends':
                await loadFindFriends(container);
                break;
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Không thể tải dữ liệu</p></div>';
        showToast('Có lỗi xảy ra', 'error');
    }
}

async function loadFriendsList(container) {
    const data = await api.getFriends();
    const friends = data.friends || [];

    if (friends.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-friends"></i><p>Chưa có bạn bè</p></div>';
        return;
    }

    container.innerHTML = '';
    friends.forEach(friend => {
        container.appendChild(createFriendCard(friend, 'friend'));
    });
}

async function loadFriendRequests(container) {
    const data = await api.getFriendRequests();
    const requests = data.requests || [];

    if (requests.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-plus"></i><p>Không có lời mời kết bạn</p></div>';
        return;
    }

    container.innerHTML = '';
    requests.forEach(request => {
        container.appendChild(createFriendCard(request, 'request'));
    });

    updateFriendRequestsBadge(requests.length);
}

async function loadFindFriends(container) {
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <input type="text" id="friend-search-input" placeholder="Tìm kiếm người dùng..." style="width: 100%; padding: 10px 15px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px;">
        </div>
        <div id="search-results"></div>
    `;

    const searchInput = document.getElementById('friend-search-input');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(async () => {
            await searchUsers(query);
        }, 500);
    });
}

async function searchUsers(query) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        const data = await api.searchUsers(query);
        const users = data.users || [];

        if (users.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><p>Không tìm thấy người dùng</p></div>';
            return;
        }

        resultsContainer.innerHTML = '';
        users.forEach(user => {
            resultsContainer.appendChild(createFriendCard(user, 'search'));
        });
    } catch (error) {
        resultsContainer.innerHTML = '<div class="empty-state"><p>Không thể tìm kiếm</p></div>';
    }
}

function createFriendCard(user, type) {
    const card = document.createElement('div');
    card.className = 'friend-card';

    let actions = '';
    
    if (type === 'friend') {
        actions = `
            <button class="btn-message" onclick="openChat(${user.id})">
                <i class="fas fa-comment"></i> Nhắn tin
            </button>
            <button class="btn-unfriend" onclick="unfriendUser(${user.id})">
                <i class="fas fa-user-times"></i> Hủy kết bạn
            </button>
        `;
    } else if (type === 'request') {
        actions = `
            <button class="btn-accept" onclick="respondToRequest(${user.request_id}, 'accept')">
                <i class="fas fa-check"></i> Chấp nhận
            </button>
            <button class="btn-reject" onclick="respondToRequest(${user.request_id}, 'reject')">
                <i class="fas fa-times"></i> Từ chối
            </button>
        `;
    } else if (type === 'search') {
        const currentUserId = localStorage.getItem('userId');
        if (user.id != currentUserId) {
            if (user.friendship_status === 'friends') {
                actions = `<span style="color: var(--success-color);"><i class="fas fa-check"></i> Bạn bè</span>`;
            } else if (user.friendship_status === 'pending') {
                actions = `<span style="color: var(--text-secondary);">Đã gửi lời mời</span>`;
            } else {
                actions = `
                    <button class="btn-add-friend" onclick="sendFriendRequest(${user.id})">
                        <i class="fas fa-user-plus"></i> Kết bạn
                    </button>
                `;
            }
        }
    }

    card.innerHTML = `
        <img src="${user.avatar_url || 'https://via.placeholder.com/60'}" alt="${user.username}" class="friend-avatar">
        <div class="friend-info">
            <div class="friend-name">
                ${user.full_name || user.username}
                ${user.is_verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
            </div>
            ${user.bio ? `<p style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(user.bio)}</p>` : ''}
        </div>
        <div class="friend-actions">
            ${actions}
        </div>
    `;

    return card;
}

async function sendFriendRequest(userId) {
    try {
        await api.sendFriendRequest(userId);
        showToast('Đã gửi lời mời kết bạn', 'success');
        await loadFriendsContent();
    } catch (error) {
        showToast('Không thể gửi lời mời', 'error');
    }
}

async function respondToRequest(requestId, action) {
    try {
        await api.respondToFriendRequest(requestId, action);
        showToast(action === 'accept' ? 'Đã chấp nhận lời mời' : 'Đã từ chối lời mời', 'success');
        await loadFriendsContent();
    } catch (error) {
        showToast('Không thể thực hiện', 'error');
    }
}

async function unfriendUser(userId) {
    const confirmed = await showConfirm(
        'Hủy kết bạn',
        'Bạn có chắc chắn muốn hủy kết bạn với người này?'
    );
    
    if (!confirmed) return;

    try {
        await api.unfriend(userId);
        showToast('Đã hủy kết bạn', 'success');
        await loadFriendsContent();
    } catch (error) {
        showToast('Không thể thực hiện', 'error');
    }
}

function updateFriendRequestsBadge(count) {
    const badge = document.getElementById('friend-requests-badge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function openChat(userId) {
    document.querySelectorAll('.nav-icon').forEach(icon => icon.classList.remove('active'));
    document.getElementById('nav-messages').classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('page-messages').classList.add('active');
    
    loadMessages();
    setTimeout(() => {
        selectConversation(userId);
    }, 500);
}
