let currentPage = 'home';

function initApp() {
    console.log('App initialized');
    
    document.getElementById('nav-home').classList.add('active');
    
    loadProfile();
    loadFeed();
    loadNotifications();
    
    setInterval(() => {
        if (currentPage === 'notifications') {
            loadNotifications();
        }
    }, 30000);

    setupNavigation();
    setupSearch();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-icon[data-page]');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    currentPage = page;

    document.querySelectorAll('.nav-icon').forEach(icon => icon.classList.remove('active'));
    const activeIcon = document.getElementById(`nav-${page}`);
    if (activeIcon) activeIcon.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    switch (page) {
        case 'home':
            loadFeed();
            break;
        case 'friends':
            loadFriendsContent();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) return;

        searchTimeout = setTimeout(() => {
            navigateToPage('friends');
            currentFriendsTab = 'find-friends';
            document.querySelectorAll('.friends-tabs .tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelector('.friends-tabs .tab-btn[data-tab="find-friends"]').classList.add('active');
            loadFindFriends(document.getElementById('friends-content'));
            setTimeout(() => {
                document.getElementById('friend-search-input').value = query;
                searchUsers(query);
            }, 100);
        }, 500);
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        closeModal();
    }
});

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
