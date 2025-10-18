const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await api.login(username, password);
        console.log('Login successful, data:', data);
        showToast('Đăng nhập thành công!', 'success');
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);
        console.log('Calling showMainApp()');
        showMainApp();
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Đăng nhập thất bại', 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const fullName = document.getElementById('register-fullname').value;
    const password = document.getElementById('register-password').value;

    try {
        const data = await api.register(username, email, fullName, password);
        showToast('Đăng ký thành công!', 'success');
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);
        showMainApp();
    } catch (error) {
        showToast(error.message || 'Đăng ký thất bại', 'error');
    }
});

function showMainApp() {
    console.log('showMainApp called');
    authContainer.style.display = 'none';
    mainContainer.style.display = 'block';
    console.log('Main container display:', mainContainer.style.display);
    initApp();
}

function showAuthScreen() {
    authContainer.style.display = 'flex';
    mainContainer.style.display = 'none';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    console.log('checkAuth - token:', token ? 'exists' : 'none');
    if (token) {
        api.setToken(token);
        showMainApp();
    } else {
        showAuthScreen();
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    api.setToken(null);
    showAuthScreen();
    showToast('Đã đăng xuất', 'info');
});

window.addEventListener('load', checkAuth);
