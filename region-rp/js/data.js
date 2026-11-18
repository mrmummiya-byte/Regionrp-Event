// ======================== БАЗА ДАННЫХ ========================
const DB_USERS = 'regionRP_users_v2';
const DB_EVENTS = 'regionRP_events_v2';
const DB_SESSION = 'regionRP_session_v2';
const DB_MP = 'regionRP_mp_v1';
const DB_WATCH = 'regionRP_watch_v1';

// Пользователи
function getUsers() { return JSON.parse(localStorage.getItem(DB_USERS)) || []; }
function saveUsers(u) { localStorage.setItem(DB_USERS, JSON.stringify(u)); }

// Ивенты
function getEvents() { return JSON.parse(localStorage.getItem(DB_EVENTS)) || []; }
function saveEvents(e) { localStorage.setItem(DB_EVENTS, JSON.stringify(e)); }

// Сессия
function getSession() { return JSON.parse(localStorage.getItem(DB_SESSION)) || null; }
function saveSession(u) { localStorage.setItem(DB_SESSION, JSON.stringify(u)); }
function clearSession() { localStorage.removeItem(DB_SESSION); }

// Инициализация (если база пуста)
function initDatabase() {
    if (!localStorage.getItem(DB_USERS)) {
        saveUsers([
            { username: 'mummiya', password: 'mummiya', role: 'Админ' },
            { username: 'Dipsy', password: '1234', role: 'Хелпер' },
            { username: 'Elfie', password: '1234', role: 'Хелпер' },
            { username: 'KAMA3uK', password: '1234', role: 'Хелпер' },
            { username: 'Usoru', password: '1234', role: 'Хелпер' },
            { username: 'Radreen', password: '1234', role: 'Хелпер' },
            { username: 'Anika', password: '1234', role: 'Админ' },
            { username: 'Advokat', password: '1234', role: 'Админ' }
        ]);
        saveEvents([]);
    }
    
    // Мероприятия (18 штук) — если их нет
    if (!localStorage.getItem(DB_MP)) {
        const mps = [
            { id: 1, name: 'Сам за себя', active: true },
            { id: 2, name: 'Шальная Пуля', active: true },
            { id: 3, name: 'Прятки', active: true },
            { id: 4, name: 'Горячая картошка', active: true },
            { id: 5, name: 'Дерби', active: true },
            { id: 6, name: 'Дуэль', active: true },
            { id: 7, name: 'Битва экстрасенсов', active: true },
            { id: 8, name: 'Царь горы', active: true },
            { id: 9, name: 'Уличная гонка', active: true },
            { id: 10, name: 'Питерский забив', active: true },
            { id: 11, name: 'Заплыв', active: true },
            { id: 12, name: 'Взрывное дерби', active: true },
            { id: 13, name: 'Шальной заплыв', active: true },
            { id: 14, name: 'Русская рулетка', active: true },
            { id: 15, name: 'Дари тепло', active: true },
            { id: 16, name: 'Дартс', active: true },
            { id: 17, name: 'Крути педали', active: true },
            { id: 18, name: 'Попробуй не упасть', active: true }
        ];
        localStorage.setItem(DB_MP, JSON.stringify(mps));
    }
    
    // Карцер — ПУСТОЙ массив (0 записей)
    if (!localStorage.getItem(DB_WATCH)) {
        localStorage.setItem(DB_WATCH, JSON.stringify([]));
    }
}

// Вызываем инициализацию сразу
initDatabase();