// --- Constants & Defaults ---
const defaultHabits = [
    { id: 1, name: "Morning Meditation", completedDates: [] },
    { id: 2, name: "Drink Water (2L)", completedDates: [] },
    { id: 3, name: "Read 20 Pages", completedDates: [] },
    { id: 4, name: "Workout / Yoga", completedDates: [] },
    { id: 5, name: "Skin Care Routine", completedDates: [] },
    { id: 6, name: "Journaling", completedDates: [] }
];

const quotes = [
    "Believe you can and you're halfway there.",
    "Small steps in the right direction can turn out to be the biggest step of your life.",
    "Your future is created by what you do today, not tomorrow.",
    "Don't watch the clock; do what it does. Keep going.",
    "Act as if what you do makes a difference. It does."
];

// --- State Management ---
// Users Object Structure: { "username": { password: "...", habits: [], dailyHistory: {}, theme: "light" } }
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Auth Inputs
const loginUserIn = document.getElementById('login-username');
const loginPassIn = document.getElementById('login-password');
const signupUserIn = document.getElementById('signup-username');
const signupPassIn = document.getElementById('signup-password');

// App Elements
const habitsList = document.getElementById('habits-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const resetBtn = document.getElementById('reset-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const habitInput = document.getElementById('habit-input');
const addHabitBtn = document.getElementById('add-habit-btn');
const calendarGrid = document.getElementById('calendar-grid');
const userGreeting = document.getElementById('user-greeting');
const userQuote = document.getElementById('quote');

// --- Helper Functions ---

function getTodayStr() {
    return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveCurrentUser() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// --- Auth Functions ---

function login(username, password) {
    if (users[username] && users[username].password === password) {
        currentUser = users[username];
        saveCurrentUser();
        initApp();
        toggleView('app');
    } else {
        alert('Invalid username or password');
    }
}

function signup(username, password) {
    if (!username || !password) return alert('Please fill in all fields');
    if (users[username]) return alert('Username already exists');

    // Create new user with default data
    users[username] = {
        username: username,
        password: password,
        habits: JSON.parse(JSON.stringify(defaultHabits)), // Deep copy defaults
        dailyHistory: {},
        theme: 'light'
    };

    saveUsers();
    // Auto-login
    currentUser = users[username];
    saveCurrentUser();
    initApp();
    toggleView('app');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    toggleView('auth');
    // Clear inputs
    loginUserIn.value = '';
    loginPassIn.value = '';
}

function toggleView(view) {
    if (view === 'app') {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
}

// --- App Logic ---

function initApp() {
    if (!currentUser) return;

    userGreeting.textContent = `Hello, ${currentUser.username}`;

    // Theme
    applyTheme(currentUser.theme === 'dark');

    // Quote
    loadQuote();

    // Render
    renderHabits();
    renderCalendar();
}

function toggleHabit(id) {
    const today = getTodayStr();
    const habit = currentUser.habits.find(h => h.id === id);

    if (habit) {
        if (!habit.completedDates) habit.completedDates = []; // Ensure array exists

        const index = habit.completedDates.indexOf(today);
        if (index > -1) {
            habit.completedDates.splice(index, 1); // Remove today
        } else {
            habit.completedDates.push(today); // Add today
        }

        updateUserData(); // Saves to main `users` object and local storage
        renderHabits();
    }
}

function addHabit() {
    const name = habitInput.value.trim();
    if (name) {
        const newHabit = {
            id: Date.now(),
            name: name,
            completedDates: []
        };
        currentUser.habits.push(newHabit);
        habitInput.value = '';
        updateUserData();
        renderHabits();
    }
}

function deleteHabit(e, id) {
    e.stopPropagation();
    const button = e.target.closest('button');
    const card = button.closest('.habit-card');

    if (confirm('Are you sure you want to delete this habit?')) {
        card.classList.add('deleting');
        setTimeout(() => {
            currentUser.habits = currentUser.habits.filter(h => h.id !== id);
            updateUserData();
            renderHabits();
        }, 400);
    }
}

function resetDay() {
    const today = getTodayStr();
    currentUser.habits.forEach(h => {
        if (h.completedDates) {
            h.completedDates = h.completedDates.filter(d => d !== today);
        }
    });
    updateUserData();
    renderHabits();
}

function updateUserData() {
    // Check daily completion status
    const today = getTodayStr();
    const allCompleted = currentUser.habits.length > 0 && currentUser.habits.every(h => h.completedDates && h.completedDates.includes(today));

    if (allCompleted) {
        currentUser.dailyHistory[today] = true;
    } else {
        delete currentUser.dailyHistory[today];
    }

    // Sync to main users object
    users[currentUser.username] = currentUser;
    saveUsers();
    saveCurrentUser();

    // Update UI components that depend on data
    renderCalendar();
    updateProgressBar();
}

function updateProgressBar() {
    const today = getTodayStr();
    const completedCount = currentUser.habits.filter(h => h.completedDates && h.completedDates.includes(today)).length;
    const totalCount = currentUser.habits.length;
    const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% Completed`;
}

// --- Rendering ---

function renderHabits() {
    const today = getTodayStr();
    habitsList.innerHTML = '';

    currentUser.habits.forEach(habit => {
        const isCompleted = habit.completedDates && habit.completedDates.includes(today);

        const card = document.createElement('div');
        card.className = `habit-card ${isCompleted ? 'completed' : ''}`;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-pressed', isCompleted);
        card.onclick = () => toggleHabit(habit.id);

        card.innerHTML = `
            <div class="habit-info">
                <div class="habit-name">${habit.name}</div>
            </div>
            <div class="habit-actions">
                <button class="delete-btn" onclick="deleteHabit(event, ${habit.id})" aria-label="Delete habit">
                    &times;
                </button>
                <div class="check-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>
        `;
        habitsList.appendChild(card);
    });

    updateProgressBar();
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = date.getDate();

    // Update Month Display
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('calendar-month').textContent = date.toLocaleDateString('en-US', options);

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = i;

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        // Check currentUser history
        if (currentUser.dailyHistory && currentUser.dailyHistory[dateString]) {
            dayEl.classList.add('success');
        }

        if (i === today) {
            dayEl.classList.add('today');
        }

        calendarGrid.appendChild(dayEl);
    }
}

// --- Theme & Quote ---

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('dark-mode');
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    currentUser.theme = isDark ? 'dark' : 'light';
    applyTheme(isDark);
    updateUserData();
}

function loadQuote() {
    // Simple random quote for now, can be persisted daily if needed
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    userQuote.textContent = `"${randomQuote}"`;
}

// --- Event Listeners ---

// Auth Toggles
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Auth Actions
document.getElementById('login-btn').addEventListener('click', () => {
    login(loginUserIn.value.trim(), loginPassIn.value.trim());
});

document.getElementById('signup-btn').addEventListener('click', () => {
    signup(signupUserIn.value.trim(), signupPassIn.value.trim());
});

document.getElementById('logout-btn').addEventListener('click', logout);

// App Actions
resetBtn.addEventListener('click', resetDay);
themeToggle.addEventListener('click', toggleTheme);
addHabitBtn.addEventListener('click', addHabit);
habitInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHabit();
});

// --- Initialization at Start ---
if (currentUser) {
    toggleView('app');
    initApp();
} else {
    toggleView('auth');
}
