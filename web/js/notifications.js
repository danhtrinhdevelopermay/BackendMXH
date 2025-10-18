async function loadNotifications() {
    const container = document.getElementById('notifications-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const data = await api.getNotifications();
        const notifications = data.notifications || [];

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <p>Chưa có thông báo</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        notifications.forEach(notif => {
            container.appendChild(createNotificationItem(notif));
        });

        const unreadCount = notifications.filter(n => !n.is_read).length;
        updateNotificationsBadge(unreadCount);

    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Không thể tải thông báo</p></div>';
        showToast('Không thể tải thông báo', 'error');
    }
}

function createNotificationItem(notif) {
    const item = document.createElement('div');
    item.className = `notification-item ${!notif.is_read ? 'unread' : ''}`;

    let icon = 'fa-bell';
    let message = notif.message;

    if (notif.type === 'friend_request') {
        icon = 'fa-user-plus';
    } else if (notif.type === 'friend_accept') {
        icon = 'fa-user-check';
    } else if (notif.type === 'comment') {
        icon = 'fa-comment';
    } else if (notif.type === 'reaction') {
        icon = 'fa-heart';
    } else if (notif.type === 'message') {
        icon = 'fa-envelope';
    }

    item.innerHTML = `
        <div style="width: 50px; height: 50px; background: var(--gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">
            <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-text">${escapeHtml(message)}</div>
            <div class="notification-time">${formatTime(notif.created_at)}</div>
        </div>
    `;

    item.addEventListener('click', async () => {
        if (!notif.is_read) {
            try {
                await api.markNotificationAsRead(notif.id);
                item.classList.remove('unread');
                updateNotificationsBadge();
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        if (notif.post_id) {
            navigateToPage('home');
        } else if (notif.type === 'friend_request' || notif.type === 'friend_accept') {
            navigateToPage('friends');
        } else if (notif.type === 'message') {
            navigateToPage('messages');
        }
    });

    return item;
}

function updateNotificationsBadge(count) {
    const badge = document.getElementById('notifications-badge');
    if (count === undefined) {
        const unreadItems = document.querySelectorAll('.notification-item.unread');
        count = unreadItems.length;
    }
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}
