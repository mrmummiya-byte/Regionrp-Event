// ======================== АВТОРИЗАЦИЯ ========================
function switchAuthTab(type) {
    document.querySelectorAll('#authTabs .nav-link').forEach(el => el.classList.remove('active'));
    document.querySelector(`#authTabs .nav-link[onclick*="${type}"]`).classList.add('active');
    document.getElementById('loginForm').classList.toggle('d-none', type !== 'login');
    document.getElementById('registerForm').classList.toggle('d-none', type !== 'register');
    document.getElementById('authError').classList.add('d-none');
}

function showAuthError(msg) {
    const el = document.getElementById('authError');
    el.innerText = msg;
    el.classList.remove('d-none');
}

function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;
    if (user.length < 3) return showAuthError('Логин минимум 3 символа');
    if (pass.length < 4) return showAuthError('Пароль минимум 4 символа');
    if (pass !== confirm) return showAuthError('Пароли не совпадают');
    
    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === user.toLowerCase())) {
        return showAuthError('Пользователь уже существует');
    }
    
    users.push({ username: user, password: pass, role: 'Участник' });
    saveUsers(users);
    alert('Аккаунт создан! Войдите.');
    switchAuthTab('login');
    document.getElementById('loginUser').value = user;
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const users = getUsers();
    const found = users.find(u => u.username.toLowerCase() === user.toLowerCase() && u.password === pass);
    if (!found) return showAuthError('Неверный логин или пароль');
    
    saveSession(found);
    window.location.href = 'dashboard.html';
}

function logout() {
    clearSession();
    window.location.href = 'index.html';
}

// Если пользователь уже вошёл — сразу на дашборд
if (getSession()) {
    window.location.href = 'dashboard.html';
}