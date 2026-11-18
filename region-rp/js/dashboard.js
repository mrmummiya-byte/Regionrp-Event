// ======================== ИНИЦИАЛИЗАЦИЯ ========================
let currentUser = null;

function initDashboard() {
    currentUser = getSession();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('sidebarUserName').innerText = currentUser.username;
    document.getElementById('sidebarUserRole').innerText = currentUser.role;
    document.getElementById('sidebarAvatar').innerText = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('topbarUserName').innerText = currentUser.username;
    document.getElementById('topbarUserRole').innerText = currentUser.role;
    document.getElementById('topbarAvatar').innerText = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('welcomeName').innerText = currentUser.username;
    
    const adminLink = document.getElementById('adminSectionLink');
    if (adminLink) adminLink.style.display = currentUser.role === 'Админ' ? 'flex' : 'none';
    
    document.getElementById('todayDate').innerText = new Date().toLocaleDateString('ru-RU');
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    
    populatePeopleLists();
    renderHistoryTable();
    renderAdminTable();
    renderHelpersList();
    renderTopTable();
    renderStaffGrid();
    renderMpGrid();
    renderWatchlist();
    updateMetrics();
}

// ======================== НАВИГАЦИЯ ========================
function initNavigation() {
    document.querySelectorAll('#mainNav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.style.display === 'none') return;
            
            document.querySelectorAll('#mainNav .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.dataset.section;
            document.querySelectorAll('.section-content').forEach(s => s.classList.add('section-hidden'));
            document.getElementById('section-' + section).classList.remove('section-hidden');
            
            const titles = {
                events: 'Ивенты',
                admin: 'Управление составом',
                helpers: 'Хелперы',
                top: 'Топ за месяц',
                roster: 'Состав',
                mp: 'Мероприятия',
                watchlist: 'Карцер',
                rules: 'Регламент'
            };
            document.getElementById('currentSectionTitle').innerText = titles[section] || 'Ивенты';
        });
    });
}

// ======================== ФОРМА ИВЕНТА ========================
function populatePeopleLists() {
    const users = getUsers();
    const mps = JSON.parse(localStorage.getItem(DB_MP)) || [];
    
    const hostSelect = document.getElementById('eventHost');
    if (hostSelect) {
        hostSelect.innerHTML = '<option value="">Выбрать...</option>';
        users.filter(u => u.role === 'Хелпер' || u.role === 'Админ').forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.username;
            opt.innerText = `${u.username} (${u.role})`;
            hostSelect.appendChild(opt);
        });
    }
    
    const nameSelect = document.getElementById('eventName');
    if (nameSelect) {
        nameSelect.innerHTML = '<option value="">Выберите...</option>';
        mps.filter(mp => mp.active).forEach(mp => {
            const opt = document.createElement('option');
            opt.value = mp.name;
            opt.innerText = mp.name;
            nameSelect.appendChild(opt);
        });
    }
    
    const helpersList = document.getElementById('eventHelpersList');
    if (helpersList) {
        helpersList.innerHTML = '';
        users.forEach(u => {
            const label = document.createElement('label');
            label.className = 'rr-check-option';
            label.innerHTML = `<input type="checkbox" value="${u.username}" class="evHelper"> <span>${u.username}</span>`;
            helpersList.appendChild(label);
        });
    }
    
    const adminsList = document.getElementById('eventAdminsList');
    if (adminsList) {
        adminsList.innerHTML = '';
        users.filter(u => u.role === 'Админ').forEach(u => {
            const label = document.createElement('label');
            label.className = 'rr-check-option';
            label.innerHTML = `<input type="checkbox" value="${u.username}" class="evAdmin"> <span>${u.username}</span>`;
            adminsList.appendChild(label);
        });
    }
}

// ======================== АДМИН ПАНЕЛЬ ========================
function renderAdminTable() {
    if (!currentUser || currentUser.role !== 'Админ') return;
    const users = getUsers();
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    users.forEach(u => {
        const isSelf = u.username === currentUser.username;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="display:flex;justify-content:center;"><strong>${u.username}</strong> ${isSelf ? '(Вы)' : ''}</div></td>
            <td><div style="display:flex;justify-content:center;"><select class="form-select form-select-sm" style="width: 140px;" onchange="changeRole('${u.username}', this.value)" ${isSelf ? 'disabled' : ''}>
                    <option value="Участник" ${u.role === 'Участник' ? 'selected' : ''}>Участник</option>
                    <option value="Хелпер" ${u.role === 'Хелпер' ? 'selected' : ''}>Хелпер</option>
                    <option value="Админ" ${u.role === 'Админ' ? 'selected' : ''}>Админ</option>
                </select></div></td>
            <td><div style="display:flex;justify-content:center;"><button class="btn btn-sm btn-outline-danger" style="white-space: nowrap;" onclick="deleteUser('${u.username}')" ${isSelf ? 'disabled' : ''}>Удалить</button></div></td>
        `;
        tbody.appendChild(tr);
    });
}

function changeRole(username, newRole) {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        users[idx].role = newRole;
        saveUsers(users);
        
        if (username === currentUser.username) {
            currentUser.role = newRole;
            saveSession(currentUser);
            initDashboard();
        }
        
        renderAdminTable();
        populatePeopleLists();
        renderHelpersList();
        renderStaffGrid();
        alert(`Роль ${username} изменена на ${newRole}`);
    }
}

function deleteUser(username) {
    if (!confirm(`Удалить пользователя ${username}?`)) return;
    let users = getUsers();
    users = users.filter(u => u.username !== username);
    saveUsers(users);
    renderAdminTable();
    populatePeopleLists();
    renderHelpersList();
    renderStaffGrid();
    alert('Пользователь удален');
}

// ======================== ХЕЛПЕРЫ ========================
function renderHelpersList() {
    const users = getUsers();
    const events = getEvents();
    const tbody = document.getElementById('helpersTableBody');
    if (!tbody) return;

    const staff = users.filter(u => u.role === 'Хелпер' || u.role === 'Админ');
    const stats = staff.map(u => {
        const hosted = events.filter(ev => ev.host === u.username).length;
        const helped = events.filter(ev => ev.helpers && ev.helpers.includes(u.username)).length;
        const totalPoints = (hosted * 1.5) + (helped * 0.5);
        return { username: u.username, role: u.role, hosted, helped, totalPoints: totalPoints.toFixed(1) };
    });

    stats.sort((a, b) => parseFloat(b.totalPoints) - parseFloat(a.totalPoints));
    const countEl = document.getElementById('helpersCount');
    if (countEl) countEl.innerText = `Всего: ${stats.length}`;
    
    tbody.innerHTML = '';
    if (stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-muted py-4">Хелперов пока нет</td></tr>';
        return;
    }

    stats.forEach((s, index) => {
        const tr = document.createElement('tr');
        const hostedPoints = (s.hosted * 1.5).toFixed(1);
        const helpedPoints = (s.helped * 0.5).toFixed(1);
        tr.innerHTML = `
            <td><div style="display:flex;justify-content:center;"><b>${index + 1}</b></div></td>
            <td><div style="display:flex;justify-content:center;"><strong>${s.username}</strong></div></td>
            <td><div style="display:flex;justify-content:center;">${s.role}</div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #0d6efd !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${hostedPoints} б.</span></div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #157347 !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${helpedPoints} б.</span></div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #dc3545 !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${s.totalPoints} б.</span></div></td>
        `;
        tbody.appendChild(tr);
    });
}

// ======================== ТОП ЗА МЕСЯЦ ========================
function renderTopTable() {
    const events = getEvents();
    const tbody = document.getElementById('topTableBody');
    if (!tbody) return;

    const stats = {};
    getUsers().filter(u => u.role === 'Хелпер' || u.role === 'Админ').forEach(u => {
        stats[u.username] = { hosted: 0, helped: 0, extra: 0 };
    });

    events.forEach(ev => {
        if (stats[ev.host]) stats[ev.host].hosted++;
        if (ev.helpers) ev.helpers.forEach(h => { if (stats[h]) stats[h].helped++; });
    });

    const result = Object.keys(stats).map(name => {
        const s = stats[name];
        const points = (s.hosted * 1.5) + (s.helped * 0.5) + s.extra;
        return { name, hosted: s.hosted, helped: s.helped, extra: s.extra, points: points.toFixed(1) };
    });

    result.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
    tbody.innerHTML = '';
    if (result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-muted py-4">Нет данных для рейтинга</td></tr>';
        return;
    }

    result.forEach((r, index) => {
        const tr = document.createElement('tr');
        const place = index + 1;
        const hostedPoints = (r.hosted * 1.5).toFixed(1);
        const helpedPoints = (r.helped * 0.5).toFixed(1);
        const extraPoints = (r.extra * 1.0).toFixed(1);
        tr.innerHTML = `
            <td><div style="display:flex;justify-content:center;"><b style="color: #fff !important;">${place}</b></div></td>
            <td><div style="display:flex;justify-content:center;"><b style="color: #fff !important;">${r.name}</b></div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #0d6efd !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${hostedPoints}</span></div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #157347 !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${helpedPoints}</span></div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #6c757d !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${extraPoints}</span></div></td>
            <td><div style="display:flex;justify-content:center;"><span style="background: #dc3545 !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 12px;">${r.points} б.</span></div></td>
        `;
        tbody.appendChild(tr);
    });
}

// ======================== СОСТАВ ========================
function renderStaffGrid() {
    const users = getUsers();
    const grid = document.getElementById('staffGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const admins = users.filter(u => u.role === 'Админ');
    const helpers = users.filter(u => u.role === 'Хелпер');
    
    const createCard = (u, roleLabel) => {
        const div = document.createElement('div');
        div.className = 'staff-card';
        div.innerHTML = `<div class="avatar">${u.username.charAt(0).toUpperCase()}</div><div class="info"><div class="name">${u.username}</div><div class="role">${roleLabel}</div></div>`;
        return div;
    };
    
    if (admins.length > 0) {
        const header = document.createElement('div');
        header.className = 'col-12 mt-2 mb-1 text-muted small text-uppercase fw-bold';
        header.innerText = 'Администрация';
        grid.appendChild(header);
        admins.forEach(u => grid.appendChild(createCard(u, 'Администратор')));
    }
    
    if (helpers.length > 0) {
        const header = document.createElement('div');
        header.className = 'col-12 mt-4 mb-1 text-muted small text-uppercase fw-bold';
        header.innerText = 'Ивент-хелперы';
        grid.appendChild(header);
        helpers.forEach(u => grid.appendChild(createCard(u, 'Ивент-хелпер')));
    }
}

// ======================== МЕРОПРИЯТИЯ ========================
function renderMpGrid() {
    const mps = JSON.parse(localStorage.getItem(DB_MP)) || [];
    const grid = document.getElementById('mpGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    mps.forEach(mp => {
        const div = document.createElement('div');
        div.className = 'mp-card';
        div.innerHTML = `
            <div class="mp-card-icon">🎯</div>
            <div class="mp-card-info">
                <div class="mp-card-title">${mp.name}</div>
                <div class="mp-card-status ${mp.active ? 'active' : 'inactive'}">
                    <span class="dot"></span>${mp.active ? 'Активно' : 'Отключено'}
                </div>
            </div>
            ${currentUser.role === 'Админ' ? `
                <div class="mp-card-actions">
                    <button class="btn btn-sm btn-outline-secondary" onclick="toggleMp(${mp.id})" title="Включить/выключить">${mp.active ? '⏸' : '▶'}</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMp(${mp.id})" title="Удалить">✕</button>
                </div>
            ` : ''}
        `;
        grid.appendChild(div);
    });
    updateMetrics();
}

function addMp() {
    const name = prompt('Введите название мероприятия:');
    if (!name || name.trim() === '') return;
    const mps = JSON.parse(localStorage.getItem(DB_MP)) || [];
    const newMp = { id: Date.now(), name: name.trim(), active: true };
    mps.push(newMp);
    localStorage.setItem(DB_MP, JSON.stringify(mps));
    renderMpGrid();
    populatePeopleLists(); 
    alert('✅ Мероприятие добавлено!');
}

function toggleMp(id) {
    const mps = JSON.parse(localStorage.getItem(DB_MP)) || [];
    const idx = mps.findIndex(m => m.id === id);
    if (idx !== -1) {
        mps[idx].active = !mps[idx].active;
        localStorage.setItem(DB_MP, JSON.stringify(mps));
        renderMpGrid();
        populatePeopleLists(); 
    }
}

function deleteMp(id) {
    if (!confirm('Удалить это мероприятие?')) return;
    let mps = JSON.parse(localStorage.getItem(DB_MP)) || [];
    mps = mps.filter(m => m.id !== id);
    localStorage.setItem(DB_MP, JSON.stringify(mps));
    renderMpGrid();
    populatePeopleLists(); 
    alert('Мероприятие удалено');
}

// ======================== КАРЦЕР ========================
function renderWatchlist() {
    const watch = JSON.parse(localStorage.getItem(DB_WATCH)) || [];
    const tbody = document.getElementById('watchlistTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (watch.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-muted py-4">Записей пока нет</td></tr>';
        updateMetrics();
        return;
    }
    
    watch.forEach(w => {
        const tr = document.createElement('tr');
        tr.className = w.warns === '3/3' ? 'table-dark-red' : '';
        const deleteBtn = currentUser.role === 'Админ' 
            ? `<button class="btn-delete-warn" onclick="deleteWarning('${w.id}')">✕ Удалить</button>` 
            : `<span class="text-muted">—</span>`;
        tr.innerHTML = `
            <td><b>${w.id}</b></td>
            <td><span class="warn-badge ${w.warns === '3/3' ? '' : 'yellow'}">${w.warns}</span></td>
            <td>${w.reason}</td>
            <td>${w.addedBy}</td>
            <td>${w.date}</td>
            <td>${deleteBtn}</td>
        `;
        tbody.appendChild(tr);
    });
    updateMetrics();
}

function addWarning() {
    const staticId = document.getElementById('warnStaticId').value.trim();
    const reason = document.getElementById('warnReason').value.trim();
    const warns = document.getElementById('warnLevel').value;
    
    if (!staticId || !reason) return alert('Заполните все поля');
    
    const watch = JSON.parse(localStorage.getItem(DB_WATCH)) || [];
    const existing = watch.find(w => w.id === staticId);
    
    if (existing) {
        const parts = existing.warns.split('/');
        const current = parseInt(parts[0]) + 1;
        existing.warns = `${Math.min(current, 3)}/3`;
        existing.reason += ' | ' + reason;
        existing.date = new Date().toLocaleDateString('ru-RU');
    } else {
        watch.push({
            id: staticId,
            warns: warns,
            reason: reason,
            addedBy: currentUser.username,
            date: new Date().toLocaleDateString('ru-RU')
        });
    }
    
    localStorage.setItem(DB_WATCH, JSON.stringify(watch));
    renderWatchlist();
    
    document.getElementById('warnStaticId').value = '';
    document.getElementById('warnReason').value = '';
    document.getElementById('warnLevel').value = '1/3';
    alert('✅ Предупреждение добавлено!');
}

function deleteWarning(id) {
    if (!confirm('Удалить эту запись из карцера?')) return;
    let watch = JSON.parse(localStorage.getItem(DB_WATCH)) || [];
    watch = watch.filter(w => w.id !== id);
    localStorage.setItem(DB_WATCH, JSON.stringify(watch));
    renderWatchlist();
    alert('Запись удалена');
}

// ======================== МЕТРИКИ ========================
function updateMetrics() {
    const events = getEvents();
    const mps = JSON.parse(localStorage.getItem(DB_MP)) || [];
    const watch = JSON.parse(localStorage.getItem(DB_WATCH)) || [];
    
    // Обновляем метрики только если элементы существуют
    const metricHistory = document.getElementById('metricHistory');
    const metricProcess = document.getElementById('metricProcess');
    const metricMp = document.getElementById('metricMp');
    const metricWatch = document.getElementById('metricWatch');
    
    if (metricHistory) metricHistory.innerHTML = `${events.length} <small>ивентов</small>`;
    if (metricProcess) metricProcess.innerHTML = `${events.filter(e => e.status === 'Ожидает').length} <small>ивентов</small>`;
    
    const activeMps = mps.filter(m => m.active).length;
    if (metricMp) metricMp.innerHTML = `${activeMps} <small>доступно</small>`;
    
    // ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ ДЛЯ КАРЦЕРА
    if (metricWatch) metricWatch.innerHTML = `${watch.length} <small>записей</small>`;
    
    const watchBadge = document.getElementById('watchlistCountBadge');
    if (watchBadge) watchBadge.innerText = watch.length;
    
    const watchlistCount = document.getElementById('watchlistCount');
    if (watchlistCount) watchlistCount.innerText = `Всего: ${watch.length}`;
}

// ======================== СТАРТ ========================
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initNavigation();
});