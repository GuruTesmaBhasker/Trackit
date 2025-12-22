import { db, auth, getTaskCategories, getTasksFromCategory, todayId, saveTodoList, getTodoList, getHistoryData, migrateAllTodos, saveWeeklyStatus, getWeeklyStatus, savePermanentTodos, getPermanentTodos } from "../../services/firebase.service.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    onSnapshot,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// State
let currentMonth = 12;
let currentYear = 2025;
let habits = [];
let todos = []; // New state for todos
let completions = {};
let trendChart = null;
let todoChart = null; // New chart instance
let weeklyChart = null; // New chart instance
let currentUser = null;
let weeklyStatus = {}; // New state for weekly status
let permanentTodos = []; // New state for permanent todos

const WEEKLY_SCHEDULE = [
    { day: 'Monday', task: 'Python' },
    { day: 'Tuesday', task: 'Prep for exams' },
    { day: 'Wednesday', task: 'Do some project' },
    { day: 'Thursday', task: 'SQL' },
    { day: 'Friday', task: 'Prep for exam' },
    { day: 'Saturday', task: 'Learn something new' },
    { day: 'Sunday', task: 'Project + Job prep' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date in header
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todoDateDisplay').textContent = today.toLocaleDateString('en-US', options);

    // Wait for auth state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            console.log("User logged in:", user.uid);
            loadData(); // Load from Firestore
            loadHistory(); // Load history data
        } else {
            console.log("No user logged in, redirecting...");
            window.location.href = "../auth/signin.component.html";
        }
    });

    setupEventListeners();
    // Initial render (empty) until data loads
    renderTable();
    renderTodos(); // Initial render for todos
    updateStats();
    updateChart();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('monthSelect').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderTable();
        updateStats();
        updateChart();
        // No need to saveData() here, just view change
    });
    
    document.getElementById('yearInput').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderTable();
        updateStats();
        updateChart();
        // No need to saveData() here
    });
    
    document.getElementById('addHabitBtn').addEventListener('click', openModal);
    document.getElementById('generateTaskBtn').addEventListener('click', generateAndAddTodo); // Changed to generateAndAddTodo
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('habitForm').addEventListener('submit', addHabit);
    document.getElementById('clearWeeklyBtn').addEventListener('click', clearWeeklySchedule);
    
    // History Toggle
    const historyHeader = document.getElementById('historyHeader');
    const historyContent = document.getElementById('historyContent');
    const historySection = document.querySelector('.history-section');
    
    // Set initial state (collapsed)
    historySection.classList.add('collapsed-state');
    
    historyHeader.addEventListener('click', (e) => {
        // Prevent triggering when clicking the migrate button
        if (e.target.id === 'migrateTodosBtn') return;
        
        historyContent.classList.toggle('collapsed');
        historySection.classList.toggle('collapsed-state');
    });

    // Todo Listeners
    document.getElementById('addTodoBtn').addEventListener('click', addTodoManual);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodoManual();
    });

    // Permanent Todo Listeners
    document.getElementById('addPermTodoBtn').addEventListener('click', addPermanentTodo);
    document.getElementById('permTodoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPermanentTodo();
    });

    // Journal Listener
    document.getElementById('saveJournalBtn').addEventListener('click', saveJournal);

    // Migration button listener
    document.getElementById('migrateTodosBtn').addEventListener('click', async () => {
        if (!currentUser) return;
        
        const btn = document.getElementById('migrateTodosBtn');
        btn.textContent = '🔄 Migrating...';
        btn.disabled = true;
        
        try {
            const result = await migrateAllTodos(currentUser.uid);
            if (result.success) {
                btn.textContent = '✅ Migration Complete';
                alert(`Migration successful! Processed ${result.daysProcessed} days of data.`);
                await loadHistory(); // Reload history
            } else {
                btn.textContent = '❌ Migration Failed';
                alert('Migration failed: ' + result.error);
            }
        } catch (error) {
            btn.textContent = '❌ Migration Failed';
            alert('Migration error: ' + error.message);
        }
        
        setTimeout(() => {
            btn.textContent = '🔄 Migrate Old Data';
            btn.disabled = false;
        }, 3000);
    });

    window.addEventListener('click', (e) => {
        if (e.target.id === 'addHabitModal') closeModal();
    });
}

// Modal Functions
function openModal() {
    document.getElementById('addHabitModal').style.display = 'block';
    document.getElementById('habitName').focus();
}

function closeModal() {
    document.getElementById('addHabitModal').style.display = 'none';
    document.getElementById('habitForm').reset();
}

async function addHabit(e) {
    e.preventDefault();
    if (!currentUser) return;

    const name = document.getElementById('habitName').value.trim();
    const goal = parseInt(document.getElementById('habitGoal').value);
    
    if (!name) return;
    
    try {
        // Add to Firestore
        const docRef = await addDoc(collection(db, `users/${currentUser.uid}/habits`), {
            name: name,
            goal: goal,
            createdAt: new Date(),
            completions: {} // Initialize empty completions map
        });

        const habit = {
            id: docRef.id,
            name: name,
            goal: goal
        };
        
        habits.push(habit);
        completions[habit.id] = {};
        
        closeModal();
        renderTable();
        updateStats();
        updateChart();
        console.log("Habit added with ID: ", docRef.id);
    } catch (error) {
        console.error("Error adding habit: ", error);
        alert("Failed to add habit. Please try again.");
    }
}

// --- Todo List Functions ---

async function generateAndAddTodo() {
    if (!currentUser) return;
    
    const categories = getTaskCategories();
    if (!categories || categories.length === 0) return;

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const tasks = getTasksFromCategory(randomCategory, 1);
    
    if (!tasks || tasks.length === 0) return;
    
    const taskName = tasks[0];
    
    try {
        const newTodo = {
            text: taskName,
            completed: false,
            createdAt: new Date()
        };

        const docRef = await addDoc(collection(db, `users/${currentUser.uid}/todos`), newTodo);
        
        todos.push({ id: docRef.id, ...newTodo });
        renderTodos();
        
        // Sync with date-wise storage
        await syncTodaysTodos();
        
        // Refresh history
        await loadHistory();
        
        playCheckSound();
    } catch (error) {
        console.error("Error adding generated todo: ", error);
        alert("Failed to generate task.");
    }
}

async function addTodoManual() {
    if (!currentUser) return;
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        const newTodo = {
            text: text,
            completed: false,
            createdAt: new Date()
        };

        const docRef = await addDoc(collection(db, `users/${currentUser.uid}/todos`), newTodo);
        
        todos.push({ id: docRef.id, ...newTodo });
        renderTodos();
        input.value = '';
        
        // Sync with date-wise storage
        await syncTodaysTodos();
        
        // Refresh history
        await loadHistory();
    } catch (error) {
        console.error("Error adding todo: ", error);
    }
}

async function toggleTodo(id) {
    if (!currentUser) return;
    
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;
    
    const todo = todos[todoIndex];
    const newStatus = !todo.completed;
    
    try {
        await updateDoc(doc(db, `users/${currentUser.uid}/todos`, id), {
            completed: newStatus
        });
        
        todos[todoIndex].completed = newStatus;
        renderTodos();
        
        // Sync with date-wise storage
        await syncTodaysTodos();
        
        // Refresh history to show the update
        await loadHistory();
        
        if (newStatus) playCheckSound();
    } catch (error) {
        console.error("Error updating todo: ", error);
    }
}

async function deleteTodo(id) {
    if (!currentUser) return;
    
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
        await deleteDoc(doc(db, `users/${currentUser.uid}/todos`, id));
        todos = todos.filter(t => t.id !== id);
        renderTodos();
        
        // Sync with date-wise storage
        await syncTodaysTodos();
        
        // Refresh history
        await loadHistory();
    } catch (error) {
        console.error("Error deleting todo: ", error);
    }
}

function renderTodos() {
    const tbody = document.getElementById('todoListBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort: Incomplete first, then by date
    const sortedTodos = [...todos].sort((a, b) => {
        if (a.completed === b.completed) {
            return b.createdAt - a.createdAt; // Newest first
        }
        return a.completed ? 1 : -1; // Completed at bottom
    });

    sortedTodos.forEach(todo => {
        const tr = document.createElement('tr');
        tr.className = todo.completed ? 'todo-completed' : '';
        
        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onclick="window.toggleTodo('${todo.id}')">
            </td>
            <td class="todo-text">${todo.text}</td>
            <td style="text-align: center;">
                <button class="btn-icon delete-btn" onclick="window.deleteTodo('${todo.id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updateTodoChart(); // Update chart whenever table renders
}

// Expose functions to window for onclick handlers
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;

// Render Table
function renderTable() {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const tbody = document.getElementById('habitTableBody');
    const dayLettersRow = document.getElementById('dayLettersRow');
    const dayNumbersRow = document.getElementById('dayNumbersRow');
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear;
    const currentDay = today.getDate();
    
    // Generate day letters (M T W T F S S)
    let dayLettersHTML = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
        const isToday = isCurrentMonth && day === currentDay;
        dayLettersHTML += `<th class="${isToday ? 'today-header' : ''}">${dayLetter}</th>`;
    }
    // Add weekly total headers
    dayLettersHTML += '<th>W1</th><th>W2</th><th>W3</th><th>W4</th><th>W5</th>';
    dayLettersRow.innerHTML = dayLettersHTML;
    
    // Generate day numbers (1-31)
    let dayNumbersHTML = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === currentDay;
        dayNumbersHTML += `<th class="${isToday ? 'today-header' : ''}">${day}</th>`;
    }
    // Add weekly total columns
    dayNumbersHTML += '<th></th><th></th><th></th><th></th><th></th>';
    dayNumbersRow.innerHTML = dayNumbersHTML;
    
    // Clear table body
    tbody.innerHTML = '';
    
    // Daily total row
    const dailyTotalRow = document.createElement('tr');
    dailyTotalRow.innerHTML = `
        <td style="text-align:center; background:#f7fafc; font-weight:600;">Daily Total</td>
        <td style="text-align:center;">-</td>
    `;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getDateKey(day);
        const isToday = isCurrentMonth && day === currentDay;
        let dayTotal = 0;
        habits.forEach(habit => {
            if (completions[habit.id] && completions[habit.id][dateKey]) {
                dayTotal++;
            }
        });
        dailyTotalRow.innerHTML += `<td style="background:#f7fafc;" class="${isToday ? 'today-cell' : ''}">${dayTotal}</td>`;
    }
    
    // Add weekly totals for daily total row
    for (let week = 0; week < 5; week++) {
        dailyTotalRow.innerHTML += `<td style="background:#f7fafc;">0</td>`;
    }
    dailyTotalRow.innerHTML += `<td style="background:#f7fafc; font-weight:700;">0</td>`;
    dailyTotalRow.innerHTML += `<td style="background:#f7fafc;"></td>`;
    
    tbody.appendChild(dailyTotalRow);
    
    // Generate habit rows
    const colors = ['blue', 'purple', 'green', 'orange'];
    
    habits.forEach((habit, index) => {
        const row = document.createElement('tr');
        const colorClass = colors[index % colors.length];
        
        let rowHTML = `
            <td>${habit.name}</td>
            <td>${habit.goal}</td>
        `;
        
        let monthTotal = 0;
        const weeklyTotals = [0, 0, 0, 0, 0];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = getDateKey(day);
            const isChecked = completions[habit.id] && completions[habit.id][dateKey];
            const weekIndex = Math.floor((day - 1) / 7);
            const isToday = isCurrentMonth && day === currentDay;
            
            if (isChecked) {
                monthTotal++;
                weeklyTotals[weekIndex]++;
            }
            
            rowHTML += `
                <td class="checkbox-cell ${isToday ? 'today-cell' : ''}">
                    <input type="checkbox" 
                           class="habit-checkbox checkbox-${colorClass} ${isToday ? 'today-checkbox' : ''}"
                           ${isChecked ? 'checked' : ''}
                           data-habit-id="${habit.id}"
                           data-date="${dateKey}"
                           onchange="toggleHabit(this)">
                </td>
            `;
        }
        
        // Add weekly totals
        weeklyTotals.forEach(total => {
            rowHTML += `<td class="weekly-total">${total}</td>`;
        });
        
        // Add month total
        rowHTML += `<td>${monthTotal}</td>`;
        
        // Add delete button
        rowHTML += `
            <td class="action-cell">
                <button class="delete-btn" onclick="deleteHabit('${habit.id}')" title="Delete Habit">
                    🗑️
                </button>
            </td>
        `;
        
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
}

// Toggle Habit
async function toggleHabit(checkbox) {
    if (!currentUser) return;

    const habitId = checkbox.dataset.habitId;
    const dateKey = checkbox.dataset.date;
    const isChecked = checkbox.checked;
    
    if (!completions[habitId]) {
        completions[habitId] = {};
    }
    
    // Optimistic UI update
    completions[habitId][dateKey] = isChecked;
    
    // Check for daily completion celebration
    if (isChecked) {
        playCheckSound();
        checkDailyCompletion(dateKey);
    }
    
    renderTable();
    updateStats();
    updateChart();

    try {
        // Update Firestore
        // We use dot notation to update a specific key in the map
        const habitRef = doc(db, `users/${currentUser.uid}/habits`, habitId);
        await updateDoc(habitRef, {
            [`completions.${dateKey}`]: isChecked
        });
    } catch (error) {
        console.error("Error updating habit completion: ", error);
        // Revert UI if failed (optional but good practice)
        completions[habitId][dateKey] = !isChecked;
        renderTable();
        alert("Failed to save progress. Check your connection.");
    }
}

// Play Check Sound
function playCheckSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Nice high pitch "ding"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

// Check if all habits for a day are completed
function checkDailyCompletion(dateKey) {
    const allCompleted = habits.every(habit => {
        return completions[habit.id] && completions[habit.id][dateKey];
    });
    
    if (allCompleted && habits.length > 0) {
        triggerConfetti();
    }
}

// Trigger Confetti Effect
function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// Make toggleHabit global
window.toggleHabit = toggleHabit;

// Delete Habit
async function deleteHabit(habitId) {
    if (!currentUser) return;

    if (confirm('Are you sure you want to delete this habit?')) {
        try {
            // Delete from Firestore
            await deleteDoc(doc(db, `users/${currentUser.uid}/habits`, habitId));
            
            // Update local state
            habits = habits.filter(h => h.id !== habitId);
            delete completions[habitId];
            
            renderTable();
            updateStats();
            updateChart();
            console.log("Habit deleted:", habitId);
        } catch (error) {
            console.error("Error deleting habit: ", error);
            alert("Failed to delete habit.");
        }
    }
}

// Make deleteHabit global
window.deleteHabit = deleteHabit;

// Update Stats
function updateStats() {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    let totalCheckIns = 0;
    let perfectDays = 0;
    
    // Calculate Total Check-ins and Perfect Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getDateKey(day);
        let dailyCompletedCount = 0;
        
        habits.forEach(habit => {
            if (completions[habit.id] && completions[habit.id][dateKey]) {
                dailyCompletedCount++;
                totalCheckIns++;
            }
        });
        
        if (habits.length > 0 && dailyCompletedCount === habits.length) {
            perfectDays++;
        }
    }
    
    // Calculate Longest Streak (Any Habit)
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getDateKey(day);
        let anyHabitCompleted = false;
        
        for (const habit of habits) {
            if (completions[habit.id] && completions[habit.id][dateKey]) {
                anyHabitCompleted = true;
                break;
            }
        }
        
        if (anyHabitCompleted) {
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        } else {
            currentStreak = 0;
        }
    }
    
    // Update DOM
    const totalCheckInsEl = document.getElementById('totalCheckIns');
    const longestStreakEl = document.getElementById('longestStreak');
    const perfectDaysEl = document.getElementById('perfectDays');
    
    if (totalCheckInsEl) totalCheckInsEl.textContent = totalCheckIns;
    if (longestStreakEl) longestStreakEl.textContent = longestStreak;
    if (perfectDaysEl) perfectDaysEl.textContent = perfectDays;
}

// Update Chart
function updateChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    
    const labels = [];
    const data = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
        labels.push(day);
        const dateKey = getDateKey(day);
        let dayTotal = 0;
        
        habits.forEach(habit => {
            if (completions[habit.id] && completions[habit.id][dateKey]) {
                dayTotal++;
            }
        });
        
        data.push(dayTotal);
    }
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Habits Done',
                data: data,
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: habits.length || 5,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: '#f7fafc'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Utility Functions
function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

// --- History Functions ---
async function loadHistory() {
    if (!currentUser) return;
    
    try {
        // First, sync today's todos to the date-wise system
        await syncTodaysTodos();
        
        // Check if we need to migrate existing todos (one-time operation)
        const hasDateWiseData = await checkForExistingDateWiseData();
        if (!hasDateWiseData) {
            console.log("No date-wise data found. Running migration...");
            const migrationResult = await migrateAllTodos(currentUser.uid);
            if (migrationResult.success) {
                console.log("Migration completed successfully!");
            }
        }
        
        // Then load the history
        const historyData = await getHistoryData(currentUser.uid, 5);
        renderHistory(historyData);
    } catch (error) {
        console.error("Error loading history: ", error);
        renderHistory([]);
    }
}

async function checkForExistingDateWiseData() {
    try {
        // Check if today's date-wise data exists
        const todayKey = todayId();
        const todayTodos = await getTodoList(currentUser.uid, todayKey);
        
        // Also check yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = todayId(yesterday);
        const yesterdayTodos = await getTodoList(currentUser.uid, yesterdayKey);
        
        // If we have data for either today or yesterday, assume migration is done
        return todayTodos.length > 0 || yesterdayTodos.length > 0;
    } catch (error) {
        console.error("Error checking for existing date-wise data: ", error);
        return false;
    }
}

async function syncTodaysTodos() {
    if (!currentUser || todos.length === 0) return;
    
    try {
        const todayKey = todayId();
        // Convert current todos to the format expected by the date-wise system
        const todosForStorage = todos.map(todo => ({
            text: todo.text || '',
            completed: todo.completed || false,
            createdAt: todo.createdAt ? todo.createdAt.toISOString() : new Date().toISOString()
        }));
        
        await saveTodoList(currentUser.uid, todayKey, todosForStorage);
    } catch (error) {
        console.error("Error syncing today's todos: ", error);
    }
}

function renderHistory(historyData) {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    historyData.forEach(dayData => {
        const dayElement = document.createElement('div');
        dayElement.className = `history-day ${dayData.totalCount > 0 ? 'has-tasks' : 'empty'}`;
        
        const headerElement = document.createElement('div');
        headerElement.className = 'history-day-header';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'history-day-title';
        titleElement.textContent = dayData.displayName;
        
        const countElement = document.createElement('div');
        countElement.className = 'history-day-counts';
        
        if (dayData.totalCount > 0) {
            countElement.innerHTML = `
                <span class="count completed">${dayData.completedCount} done</span>
                <span class="count pending">${dayData.incompleteTodos.length} pending</span>
            `;
        } else {
            countElement.innerHTML = '<span class="count empty">No tasks</span>';
        }
        
        headerElement.appendChild(titleElement);
        headerElement.appendChild(countElement);
        dayElement.appendChild(headerElement);
        
        if (dayData.totalCount > 0) {
            const tasksElement = document.createElement('div');
            tasksElement.className = 'history-tasks';
            
            // Show completed todos first
            dayData.completedTodos.forEach(todo => {
                const taskElement = document.createElement('div');
                taskElement.className = 'history-task completed';
                
                const checkElement = document.createElement('div');
                checkElement.className = 'history-task-check completed';
                
                const textElement = document.createElement('div');
                textElement.className = 'history-task-text completed';
                textElement.textContent = todo.text;
                
                taskElement.appendChild(checkElement);
                taskElement.appendChild(textElement);
                tasksElement.appendChild(taskElement);
            });
            
            // Show incomplete todos
            dayData.incompleteTodos.forEach(todo => {
                const taskElement = document.createElement('div');
                taskElement.className = 'history-task pending';
                
                const checkElement = document.createElement('div');
                checkElement.className = 'history-task-check pending';
                
                const textElement = document.createElement('div');
                textElement.className = 'history-task-text pending';
                textElement.textContent = todo.text;
                
                taskElement.appendChild(checkElement);
                taskElement.appendChild(textElement);
                tasksElement.appendChild(taskElement);
            });
            
            dayElement.appendChild(tasksElement);
        } else {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'history-empty';
            emptyElement.textContent = 'No tasks for this day';
            dayElement.appendChild(emptyElement);
        }
        
        container.appendChild(dayElement);
    });
}

function getDateKey(day) {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Data Persistence (Firestore)
async function loadData() {
    if (!currentUser) return;

    try {
        const q = query(collection(db, `users/${currentUser.uid}/habits`));
        const querySnapshot = await getDocs(q);
        
        habits = [];
        completions = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            habits.push({
                id: doc.id,
                name: data.name,
                goal: data.goal
            });
            completions[doc.id] = data.completions || {};
        });

        // If no habits, maybe add defaults? Or just leave empty.
        // For now, let's leave it empty so user starts fresh or sees their data.
        
        // Load Todos
        await loadTodos();
        
        // Load Journal
        await loadJournal();

        // Load Weekly Status
        await loadWeeklyStatus();

        // Load Permanent Todos
        await loadPermanentTodos();

        renderTable();
        updateStats();
        updateChart();
        console.log("Data loaded from Firestore");
    } catch (error) {
        console.error("Error loading data: ", error);
    }
}

// --- Journal Functions ---

async function loadJournal() {
    if (!currentUser) return;
    
    const todayKey = getDateKey(new Date().getDate()); // Uses current year/month/day
    
    try {
        // We'll use the date key (YYYY-MM-DD) as the document ID for simplicity
        // This ensures one entry per day
        const docRef = doc(db, `users/${currentUser.uid}/journal`, todayKey);
        const docSnap = await getDoc(docRef);
        
        const journalInput = document.getElementById('journalInput');
        if (docSnap.exists()) {
            journalInput.value = docSnap.data().text || '';
        } else {
            journalInput.value = '';
        }
    } catch (error) {
        console.error("Error loading journal: ", error);
    }
}

async function saveJournal() {
    if (!currentUser) return;
    
    const text = document.getElementById('journalInput').value;
    const statusSpan = document.getElementById('journalStatus');
    const todayKey = getDateKey(new Date().getDate());
    
    try {
        const docRef = doc(db, `users/${currentUser.uid}/journal`, todayKey);
        await setDoc(docRef, {
            text: text,
            updatedAt: new Date()
        }, { merge: true });
        
        // Show saved status
        statusSpan.textContent = "Saved successfully!";
        statusSpan.classList.add('show');
        
        setTimeout(() => {
            statusSpan.classList.remove('show');
        }, 2000);
        
    } catch (error) {
        console.error("Error saving journal: ", error);
        statusSpan.textContent = "Error saving.";
        statusSpan.style.color = "#e53e3e";
        statusSpan.classList.add('show');
    }
}

async function loadTodos() {
    if (!currentUser) return;
    
    try {
        // Get start and end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Query for todos created today
        const q = query(
            collection(db, `users/${currentUser.uid}/todos`),
            where("createdAt", ">=", startOfDay),
            where("createdAt", "<=", endOfDay)
        );
        
        const querySnapshot = await getDocs(q);
        
        todos = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            todos.push({
                id: doc.id,
                text: data.text,
                completed: data.completed,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
            });
        });
        
        renderTodos();
    } catch (error) {
        console.error("Error loading todos: ", error);
    }
}

function updateTodoChart() {
    const ctx = document.getElementById('todoChart').getContext('2d');
    
    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = todos.length - completedCount;
    
    // If no tasks, show empty state or just 0/0
    if (todos.length === 0) {
        if (todoChart) {
            todoChart.destroy();
            todoChart = null;
        }
        // Optional: Draw "No Tasks" text on canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "14px Inter";
        ctx.fillStyle = "#718096";
        ctx.textAlign = "center";
        ctx.fillText("No tasks for today", ctx.canvas.width/2, ctx.canvas.height/2);
        return;
    }

    if (todoChart) {
        todoChart.destroy();
    }

    todoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completedCount, pendingCount],
                backgroundColor: [
                    '#48bb78', // Green for completed
                    '#e2e8f0'  // Gray for pending
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Daily Progress',
                    font: {
                        size: 16
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// --- Weekly Schedule Functions ---

async function loadWeeklyStatus() {
    if (!currentUser) return;
    weeklyStatus = await getWeeklyStatus(currentUser.uid);
    renderWeeklySchedule();
    updateWeeklyChart();
}

function renderWeeklySchedule() {
    const grid = document.getElementById('weeklyGrid');
    grid.innerHTML = '';

    WEEKLY_SCHEDULE.forEach((item, index) => {
        const isCompleted = weeklyStatus[index] === true;
        const card = document.createElement('div');
        card.className = `weekly-card ${isCompleted ? 'completed' : ''}`;
        
        card.innerHTML = `
            <div class="day-label">${item.day}</div>
            <div class="task-text">${item.task}</div>
            <div class="check-icon">✓</div>
        `;
        
        card.addEventListener('click', (e) => {
             toggleWeeklyTask(index, e);
        });

        grid.appendChild(card);
    });
}

async function toggleWeeklyTask(index, e) {
    if (!currentUser) return;
    
    weeklyStatus[index] = !weeklyStatus[index];
    renderWeeklySchedule();
    updateWeeklyChart();
    
    if (weeklyStatus[index]) {
         confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.7, x: e ? e.clientX / window.innerWidth : 0.5 }
        });
    }
    
    await saveWeeklyStatus(currentUser.uid, weeklyStatus);
}

async function clearWeeklySchedule() {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to clear all weekly progress?')) return;
    
    weeklyStatus = {};
    renderWeeklySchedule();
    updateWeeklyChart();
    
    await saveWeeklyStatus(currentUser.uid, weeklyStatus);
}

function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const completedCount = Object.values(weeklyStatus).filter(v => v).length;
    const totalCount = WEEKLY_SCHEDULE.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [completedCount, totalCount - completedCount],
                backgroundColor: ['#48bb78', '#e2e8f0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        },
        plugins: [{
            id: 'textCenter',
            beforeDraw: function(chart) {
                var width = chart.width,
                    height = chart.height,
                    ctx = chart.ctx;

                ctx.restore();
                var fontSize = (height / 114).toFixed(2);
                ctx.font = "bold " + fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#2d3748";

                var text = percentage + "%",
                    textX = Math.round((width - ctx.measureText(text).width) / 2),
                    textY = height / 2;

                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

// --- Permanent Todo Functions ---

async function loadPermanentTodos() {
    if (!currentUser) return;
    permanentTodos = await getPermanentTodos(currentUser.uid);
    renderPermanentTodos();
}

function renderPermanentTodos() {
    const listBody = document.getElementById('permTodoListBody');
    listBody.innerHTML = '';

    permanentTodos.forEach((todo, index) => {
        const row = document.createElement('tr');
        row.className = todo.completed ? 'completed' : '';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="window.togglePermanentTodo(${index})">
            </td>
            <td class="todo-text">${todo.text}</td>
            <td>
                <button class="btn-delete" onclick="window.deletePermanentTodo(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        listBody.appendChild(row);
    });
}

async function addPermanentTodo() {
    if (!currentUser) return;
    
    const input = document.getElementById('permTodoInput');
    const text = input.value.trim();
    
    if (text) {
        permanentTodos.push({
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        input.value = '';
        renderPermanentTodos();
        await savePermanentTodos(currentUser.uid, permanentTodos);
    }
}

window.togglePermanentTodo = async function(index) {
    if (!currentUser) return;
    
    permanentTodos[index].completed = !permanentTodos[index].completed;
    renderPermanentTodos();
    
    if (permanentTodos[index].completed) {
        confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.7 }
        });
    }
    
    await savePermanentTodos(currentUser.uid, permanentTodos);
};

window.deletePermanentTodo = async function(index) {
    if (!currentUser) return;
    if (!confirm('Delete this permanent task?')) return;
    
    permanentTodos.splice(index, 1);
    renderPermanentTodos();
    await savePermanentTodos(currentUser.uid, permanentTodos);
};
