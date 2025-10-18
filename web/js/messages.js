let currentConversations = [];
let currentChatUser = null;
let messageInterval = null;

async function loadMessages() {
    const container = document.getElementById('conversations-list');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';

    try {
        const data = await api.getConversations();
        currentConversations = data.conversations || [];

        if (currentConversations.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 40px 20px;"><i class="fas fa-comments"></i><p>Chưa có cuộc trò chuyện</p></div>';
            return;
        }

        container.innerHTML = '';
        currentConversations.forEach(conv => {
            container.appendChild(createConversationItem(conv));
        });
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Không thể tải tin nhắn</p></div>';
        showToast('Không thể tải tin nhắn', 'error');
    }
}

function createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.userId = conversation.id;
    
    item.innerHTML = `
        <img src="${conversation.avatar_url || 'https://via.placeholder.com/50'}" alt="${conversation.username}" class="conversation-avatar">
        <div class="conversation-info">
            <div class="conversation-name">${conversation.full_name || conversation.username}</div>
            <div class="conversation-preview">${conversation.last_message || 'Bắt đầu trò chuyện'}</div>
        </div>
    `;

    item.addEventListener('click', () => selectConversation(conversation.id));
    return item;
}

async function selectConversation(userId) {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.userId == userId) {
            item.classList.add('active');
        }
    });

    currentChatUser = userId;
    await loadChatMessages(userId);
    
    if (messageInterval) {
        clearInterval(messageInterval);
    }
    messageInterval = setInterval(() => loadChatMessages(userId, true), 3000);
}

async function loadChatMessages(userId, silent = false) {
    const chatContainer = document.getElementById('chat-container');
    
    try {
        const userData = await api.getUser(userId);
        const messagesData = await api.getMessages(userId);
        const messages = messagesData.messages || [];

        const currentUserId = localStorage.getItem('userId');

        chatContainer.innerHTML = `
            <div class="chat-header">
                <img src="${userData.user.avatar_url || 'https://via.placeholder.com/40'}" alt="${userData.user.username}" class="avatar">
                <div class="chat-header-name">${userData.user.full_name || userData.user.username}</div>
            </div>
            <div class="chat-messages" id="chat-messages-area"></div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" id="chat-input" placeholder="Nhập tin nhắn...">
                <button class="btn-send" onclick="sendMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;

        const messagesArea = document.getElementById('chat-messages-area');
        
        if (messages.length === 0) {
            messagesArea.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Chưa có tin nhắn</div>';
        } else {
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.sender_id == currentUserId ? 'sent' : 'received'}`;
                messageDiv.innerHTML = `
                    <div>${escapeHtml(msg.content)}</div>
                    <div class="message-time">${formatTime(msg.created_at)}</div>
                `;
                messagesArea.appendChild(messageDiv);
            });
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

    } catch (error) {
        if (!silent) {
            chatContainer.innerHTML = '<div class="chat-placeholder"><p>Không thể tải tin nhắn</p></div>';
            showToast('Không thể tải tin nhắn', 'error');
        }
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();

    if (!content || !currentChatUser) return;

    try {
        await api.sendMessage(currentChatUser, content);
        input.value = '';
        await loadChatMessages(currentChatUser, true);
    } catch (error) {
        showToast('Không thể gửi tin nhắn', 'error');
    }
}
