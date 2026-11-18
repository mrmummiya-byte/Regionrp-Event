// ======================== СОЗДАНИЕ ИВЕНТА ========================
function handleCreateEvent(e) {
    e.preventDefault();
    const currentUser = getSession();
    if (currentUser.role === 'Участник') return alert('У вас нет прав для создания ивентов.');

    const helpers = Array.from(document.querySelectorAll('.evHelper:checked')).map(cb => cb.value);
    const admins = Array.from(document.querySelectorAll('.evAdmin:checked')).map(cb => cb.value);

    const newEvent = {
        id: Date.now(),
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        name: document.getElementById('eventName').value,
        host: document.getElementById('eventHost').value,
        prize: document.getElementById('eventPrize').value,
        helpers: helpers,
        admins: admins,
        participants: '0',
        status: 'Ожидает'
    };

    if (!newEvent.name || !newEvent.host) return alert('Заполните название и проводящего');

    const events = getEvents();
    events.unshift(newEvent);
    saveEvents(events);

    document.getElementById('eventForm').reset();
    document.getElementById('eventDate').value = newEvent.date;

    populatePeopleLists();
    renderHistoryTable();
    updateMetrics();
    renderHelpersList();
    renderTopTable();
    
    // Показываем toast-уведомление
    showEventAnnouncement(newEvent);
}

// ======================== ВЫХОД ========================
function logout() {
    clearSession();
    window.location.href = 'index.html';
}

// ======================== TOAST УВЕДОМЛЕНИЯ ========================

// Делегирование событий — добавляем один раз при загрузке
function initToastDelegation() {
    const handler = (e) => {
        const copyBtn = e.target.closest('.rr-toast-copy');
        const closeBtn = e.target.closest('.rr-toast-close');
        
        if (copyBtn) {
            e.preventDefault();
            e.stopPropagation();
            const toast = copyBtn.closest('.rr-toast');
            if (toast) copyToastText(toast);
            return;
        }
        
        if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            const toast = closeBtn.closest('.rr-toast');
            if (toast) closeToast(toast);
            return;
        }
    };
    
    document.addEventListener('click', handler, false);
    document.addEventListener('mousedown', handler, false);
    document.addEventListener('touchstart', handler, false);
}

initToastDelegation();

function showEventAnnouncement(eventData) {
    const prizeFormatted = Number(eventData.prize).toLocaleString('ru-RU');
    
    // Формируем текст для отображения (с HTML-разметкой)
    const displayMessage = `<code>/eventannounce</code> Уважаемые игроки. Совсем скоро пройдёт мероприятие <strong>«${eventData.name}»</strong>.<br>Призовой фонд: <strong>${prizeFormatted}₽</strong>.<br>Для телепорта, напишите <code>/event</code>.<br>Время ожидания участников до <strong>${eventData.time}</strong>.<br>Уход от РП через команду наказуем.`;
    
    // Формируем чистый текст для копирования
    const plainMessage = `/eventannounce Уважаемые игроки. Совсем скоро пройдёт мероприятие «${eventData.name}». Призовой фонд: ${prizeFormatted}₽. Для телепорта, напишите /event. Время ожидания участников до ${eventData.time}. Уход от РП через команду наказуем.`;
    
    showToast('📢', 'Уведомление для игроков', displayMessage, plainMessage, 20000);
}

function showToast(icon, title, message, plainText, duration = 20000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toastId = 'toast-' + Date.now();
    
    const toast = document.createElement('div');
    toast.className = 'rr-toast';
    toast.id = toastId;
    toast.dataset.plainText = plainText;
    toast.innerHTML = `
        <div class="rr-toast-left">
            <div class="rr-toast-icon">${icon}</div>
            <div class="rr-toast-text">
                <div class="rr-toast-title">${title}</div>
                <div class="rr-toast-message">${message}</div>
            </div>
        </div>
        <div class="rr-toast-right">
            <button class="rr-toast-copy" type="button" title="Скопировать текст">📋</button>
            <button class="rr-toast-close" type="button" title="Закрыть">×</button>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        closeToast(toast);
    }, duration);
}

async function copyToastText(toast) {
    const text = toast.dataset.plainText;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Меняем иконку на галочку
        const copyBtn = toast.querySelector('.rr-toast-copy');
        if (copyBtn) {
            copyBtn.textContent = '✅';
            setTimeout(() => {
                copyBtn.textContent = '📋';
            }, 2000);
        }
    } catch (err) {
        // Фоллбэк для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const copyBtn = toast.querySelector('.rr-toast-copy');
        if (copyBtn) {
            copyBtn.textContent = '✅';
            setTimeout(() => {
                copyBtn.textContent = '📋';
            }, 2000);
        }
    }
}

function closeToast(toastEl) {
    if (!toastEl) return;
    if (toastEl.classList.contains('hiding')) return;
    
    toastEl.classList.add('hiding');
    setTimeout(() => {
        if (toastEl.parentElement) {
            toastEl.parentElement.removeChild(toastEl);
        }
    }, 300);
}

// ======================== ТАБЛИЦА ИСТОРИИ ========================
function renderHistoryTable() {
    const events = getEvents();
    const tbody = document.getElementById('historyTableBody');
    document.getElementById('eventCountBadge').innerText = events.length;
    tbody.innerHTML = '';
    
    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-muted py-4">Ивентов пока нет</td></tr>';
        return;
    }
    
    events.forEach(ev => {
        const tr = document.createElement('tr');
        const isPending = ev.status === 'Ожидает';

        let assistantsHtml = '';
        if (ev.helpers && ev.helpers.length > 0) {
            assistantsHtml = `
                <button type="button" class="rr-history-assistants" onclick="togglePopover(event, ${ev.id})">Помощники</button>
            `;
        }

        let participantsHtml = '';
        if (isPending) {
            participantsHtml = `
                <form onsubmit="completeEvent(event, ${ev.id})" class="d-flex justify-content-center">
                    <input type="number" name="participants" class="form-control form-control-sm me-1" style="width: 90px;" placeholder="Кол-во" min="0" required>
                    <button type="submit" class="btn btn-sm btn-success" title="Завершить ивент">✓</button>
                </form>
            `;
        } else {
            participantsHtml = `<span style="background: #3a3a42 !important; color: #fff !important; padding: 4px 10px; border-radius: 6px; font-size: 13px;">${ev.participants} чел.</span>`;
        }

        tr.innerHTML = `
            <td><b>${formatDate(ev.date)}</b></td>
            <td>${ev.time}</td>
            <td>${ev.name}</td>
            <td class="rr-history-staff"><span>${ev.host}</span> ${assistantsHtml}</td>
            <td>${Number(ev.prize).toLocaleString('ru-RU')} ₽</td>
            <td>${participantsHtml}</td>
            <td><span class="badge-status ${isPending ? 'pending' : 'success'}">${isPending ? 'В процессе' : 'Начислено'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openHelpersModal(${ev.id})">➕ Помощник</button>
                ${!isPending ? `<button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteEvent(${ev.id})">✕</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function formatDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
}

function completeEvent(e, id) {
    e.preventDefault();
    const form = e.target;
    const participants = form.querySelector('input[name="participants"]').value;
    
    const events = getEvents();
    const idx = events.findIndex(ev => ev.id === id);
    if (idx !== -1) {
        events[idx].status = 'Начислено';
        events[idx].participants = participants;
        saveEvents(events);
        renderHistoryTable();
        updateMetrics();
        renderHelpersList();
        renderTopTable();
        alert('✅ Ивент завершен!');
    }
}

function deleteEvent(id) {
    if (!confirm('Удалить ивент?')) return;
    let events = getEvents();
    const eventId = parseInt(id);
    events = events.filter(e => e.id !== eventId);
    saveEvents(events);
    renderHistoryTable();
    updateMetrics();
    renderHelpersList();
    renderTopTable();
}

// ======================== POPOVER ========================
let popoverEl = null;

function getOrCreatePopover() {
    if (!popoverEl) {
        popoverEl = document.createElement('div');
        popoverEl.className = 'rr-history-assistants-popover';
        popoverEl.innerHTML = '<strong>Помощники</strong><ul></ul>';
        document.body.appendChild(popoverEl);
    }
    return popoverEl;
}

function togglePopover(event, eventId) {
    event.stopPropagation();
    event.preventDefault();
    
    const btn = event.currentTarget;
    const popover = getOrCreatePopover();
    
    const events = getEvents();
    const ev = events.find(e => e.id === eventId);
    
    if (!ev || !ev.helpers || ev.helpers.length === 0) {
        popover.classList.remove('show');
        return;
    }
    
    // Обновляем содержимое
    const listItems = ev.helpers.map(h => `<li>• ${h}</li>`).join('');
    popover.querySelector('ul').innerHTML = listItems;
    
    // Получаем координаты кнопки относительно viewport
    const rect = btn.getBoundingClientRect();
    
    // Позиционируем popover строго под кнопкой
    popover.style.left = rect.left + 'px';
    popover.style.top = (rect.bottom + 6) + 'px';
    popover.style.transform = 'none';
    
    // Закрываем другие и показываем
    document.querySelectorAll('.rr-history-assistants-popover').forEach(p => {
        if (p !== popover) p.classList.remove('show');
    });
    popover.classList.toggle('show');
}

// Закрытие по клику вне
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('rr-history-assistants')) {
        document.querySelectorAll('.rr-history-assistants-popover').forEach(p => p.classList.remove('show'));
    }
});

// Обновление позиции при скролле
document.querySelector('.rr-table-scroll')?.addEventListener('scroll', () => {
    const popover = document.querySelector('.rr-history-assistants-popover.show');
    if (popover) popover.classList.remove('show');
});

// ======================== МОДАЛКА ПОМОЩНИКОВ ========================
let currentEditEventId = null;

function openHelpersModal(eventId) {
    currentEditEventId = eventId;
    const events = getEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    
    document.getElementById('modalEventInfo').innerText = `Ивент: ${ev.name} | Проводящий: ${ev.host} | Дата: ${formatDate(ev.date)}`;
    
    const users = getUsers();
    const list = document.getElementById('modalHelpersList');
    list.innerHTML = '';
    
    users.forEach(u => {
        const isChecked = ev.helpers && ev.helpers.includes(u.username);
        const isDisabled = u.username === ev.host;
        const label = document.createElement('label');
        label.className = 'form-check d-flex align-items-center gap-2 p-2 rounded';
        label.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        label.innerHTML = `
            <input type="checkbox" class="form-check-input modalHelperCheckbox" value="${u.username}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            <span class="form-check-label">${u.username} ${isDisabled ? '(Проводящий)' : ''}</span>
        `;
        list.appendChild(label);
    });
    
    new bootstrap.Modal(document.getElementById('helpersModal')).show();
}

function saveHelpers() {
    if (!currentEditEventId) return;
    const selected = Array.from(document.querySelectorAll('.modalHelperCheckbox:checked')).map(cb => cb.value);
    
    const events = getEvents();
    const idx = events.findIndex(e => e.id === currentEditEventId);
    if (idx !== -1) {
        events[idx].helpers = selected;
        saveEvents(events);
        renderHistoryTable();
        renderHelpersList();
        renderTopTable();
        alert('Список помощников обновлен!');
    }
    bootstrap.Modal.getInstance(document.getElementById('helpersModal')).hide();
}