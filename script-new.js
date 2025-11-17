// script.js
import {
  onUserReady, todayId, saveSleepData, addRoutineActivity,
  saveMorningPlan, updateTaskCompletion, saveEveningReflection, getDay,
  updateActivityCategory
} from "./database.js";

// Helper functions for categories (replaced classify.js)
function classifyActivityLabel(label) {
  // Simple classification based on keywords
  const productiveKeywords = ['work', 'study', 'read', 'exercise', 'learn', 'code', 'plan', 'organize'];
  const wasteKeywords = ['social media', 'scroll', 'tv', 'games', 'youtube', 'netflix', 'procrastinate'];
  
  const lowerLabel = label.toLowerCase();
  
  if (productiveKeywords.some(keyword => lowerLabel.includes(keyword))) {
    return 'productive';
  }
  if (wasteKeywords.some(keyword => lowerLabel.includes(keyword))) {
    return 'waste';
  }
  return 'neutral';
}

function getCategoryColor(category) {
  const colors = {
    'productive': '#4CAF50',
    'neutral': '#9E9E9E', 
    'waste': '#F44336'
  };
  return colors[category?.toLowerCase()] || colors.neutral;
}

function getCategoryEmoji(category) {
  const emojis = {
    'productive': '✅',
    'neutral': '⚪',
    'waste': '❌'
  };
  return emojis[category?.toLowerCase()] || emojis.neutral;
}

/* ---- Date + header ---- */
const currentDateEl = document.getElementById("currentDate");
const datePicker = document.getElementById("datePicker");
const loadDateDataBtn = document.getElementById("loadDateData");
function renderHeaderDate(d = new Date()) {
  currentDateEl.textContent = d.toLocaleDateString(undefined, { weekday: "long", year:"numeric", month:"long", day:"numeric" });
  datePicker.value = todayId(d);
}
renderHeaderDate();

/* ---- Sleep tracker ---- */
const sleptAtEl = document.getElementById("sleptAt");
const wakeUpAtEl = document.getElementById("wakeUpAt");
const saveSleepBtn = document.getElementById("saveSleepData");
const sleepDurationText = document.getElementById("sleepDurationText");

function calcSleepDuration() {
  const s = sleptAtEl.value, w = wakeUpAtEl.value;
  if (!s || !w) { sleepDurationText.textContent = "--"; return; }
  const mins = (new Date(w) - new Date(s)) / 60000;
  if (isNaN(mins) || mins < 0) { sleepDurationText.textContent = "--"; return; }
  const h = Math.floor(mins/60), m = Math.round(mins%60);
  sleepDurationText.textContent = `${h}h ${m}m`;
}
sleptAtEl.addEventListener("change", calcSleepDuration);
wakeUpAtEl.addEventListener("change", calcSleepDuration);

saveSleepBtn.addEventListener("click", async () => {
  await saveSleepData({ sleptAt: sleptAtEl.value, wakeUpAt: wakeUpAtEl.value, dateKey: todayId() });
  alert("Sleep saved!");
});

/* ---- Morning routine activities list ---- */
const routineEntriesEl = document.getElementById("routineEntries");
const addRoutineEntryBtn = document.getElementById("addRoutineEntry");
const saveMorningRoutineBtn = document.getElementById("saveMorningRoutine");

// add new entry row
addRoutineEntryBtn.addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "routine-entry";
  row.innerHTML = `
    <input type="time" class="routine-start" placeholder="Start">
    <input type="time" class="routine-end" placeholder="End">
    <input type="text" class="routine-activity" placeholder="What did you do?" maxlength="100">
    <div class="category-display">
      <span class="category-chip" data-category="neutral">⚪ neutral</span>
      <select class="category-override" style="display: none;">
        <option value="productive">✅ productive</option>
        <option value="neutral">⚪ neutral</option>
        <option value="waste">🔴 waste</option>
      </select>
    </div>
    <button type="button" class="btn-remove-entry">×</button>`;
  
  const activityInput = row.querySelector(".routine-activity");
  const categoryChip = row.querySelector(".category-chip");
  const categorySelect = row.querySelector(".category-override");
  
  // Live classification as user types
  activityInput.addEventListener("input", () => {
    const label = activityInput.value;
    const category = classifyActivityLabel(label);
    const emoji = getCategoryEmoji(category);
    const color = getCategoryColor(category);
    
    categoryChip.textContent = `${emoji} ${category}`;
    categoryChip.style.backgroundColor = color + "20";
    categoryChip.style.borderColor = color + "60";
    categoryChip.dataset.category = category;
    categorySelect.value = category;
  });
  
  // Toggle between auto and manual category selection
  categoryChip.addEventListener("click", () => {
    categoryChip.style.display = "none";
    categorySelect.style.display = "inline";
    categorySelect.focus();
  });
  
  categorySelect.addEventListener("change", () => {
    const category = categorySelect.value;
    const emoji = getCategoryEmoji(category);
    const color = getCategoryColor(category);
    
    categoryChip.textContent = `${emoji} ${category}`;
    categoryChip.style.backgroundColor = color + "20";
    categoryChip.style.borderColor = color + "60";
    categoryChip.dataset.category = category;
  });
  
  categorySelect.addEventListener("blur", () => {
    categoryChip.style.display = "inline";
    categorySelect.style.display = "none";
  });
  
  row.querySelector(".btn-remove-entry").onclick = () => row.remove();
  routineEntriesEl.appendChild(row);
});

// remove hook for first default row (already in HTML)
routineEntriesEl.querySelector(".btn-remove-entry")?.addEventListener("click", (e)=> {
  e.currentTarget.closest(".routine-entry")?.remove();
});

// Initialize the default entry with classification functionality
function initializeRoutineEntry(row) {
  const activityInput = row.querySelector(".routine-activity");
  const categoryChip = row.querySelector(".category-chip");
  const categorySelect = row.querySelector(".category-override");
  
  if (!activityInput || !categoryChip || !categorySelect) return;
  
  // Live classification as user types
  activityInput.addEventListener("input", () => {
    const label = activityInput.value;
    const category = classifyActivityLabel(label);
    const emoji = getCategoryEmoji(category);
    const color = getCategoryColor(category);
    
    categoryChip.textContent = `${emoji} ${category}`;
    categoryChip.style.backgroundColor = color + "20";
    categoryChip.style.borderColor = color + "60";
    categoryChip.dataset.category = category;
    categorySelect.value = category;
  });
  
  // Toggle between auto and manual category selection
  categoryChip.addEventListener("click", () => {
    categoryChip.style.display = "none";
    categorySelect.style.display = "inline";
    categorySelect.focus();
  });
  
  categorySelect.addEventListener("change", () => {
    const category = categorySelect.value;
    const emoji = getCategoryEmoji(category);
    const color = getCategoryColor(category);
    
    categoryChip.textContent = `${emoji} ${category}`;
    categoryChip.style.backgroundColor = color + "20";
    categoryChip.style.borderColor = color + "60";
    categoryChip.dataset.category = category;
  });
  
  categorySelect.addEventListener("blur", () => {
    categoryChip.style.display = "inline";
    categorySelect.style.display = "none";
  });
}

// Initialize the default entry
const defaultEntry = routineEntriesEl.querySelector(".routine-entry");
if (defaultEntry) {
  initializeRoutineEntry(defaultEntry);
}

// save all routine entries to Firestore
saveMorningRoutineBtn.addEventListener("click", async () => {
  const rows = Array.from(routineEntriesEl.querySelectorAll(".routine-entry"));
  for (const row of rows) {
    const start = row.querySelector(".routine-start")?.value;
    const end   = row.querySelector(".routine-end")?.value;
    const label = row.querySelector(".routine-activity")?.value;
    const categoryChip = row.querySelector(".category-chip");
    const category = categoryChip?.dataset.category || "neutral";
    
    if (start && end && label) {
      await addRoutineActivity({ start, end, label, category, dateKey: todayId() });
    }
  }
  alert("Morning routine saved!");
});

/* ---- Morning plan (Top 3 + avoidance) ---- */
const task1El = document.getElementById("task1");
const task2El = document.getElementById("task2");
const task3El = document.getElementById("task3");
const avoidanceEl = document.getElementById("avoidance");
const saveMorningBtn = document.getElementById("saveMorning");

saveMorningBtn.addEventListener("click", async () => {
  await saveMorningPlan({
    task1: task1El.value, task2: task2El.value, task3: task3El.value,
    avoidance: avoidanceEl.value, dateKey: todayId()
  });
  // Also mirror labels in evening checkboxes for clarity
  document.getElementById("task1Label").textContent = task1El.value || "Task 1";
  document.getElementById("task2Label").textContent = task2El.value || "Task 2";
  document.getElementById("task3Label").textContent = task3El.value || "Task 3";
  alert("Morning plan saved!");
});

/* ---- Evening reflection (checkboxes + focus + improvement) ---- */
const t1Ck = document.getElementById("task1Complete");
const t2Ck = document.getElementById("task2Complete");
const t3Ck = document.getElementById("task3Complete");
[t1Ck, t2Ck, t3Ck].forEach((el, idx) => {
  el.addEventListener("change", () => {
    updateTaskCompletion({ index: idx, done: el.checked, dateKey: todayId() });
  });
});
document.getElementById("saveEvening").addEventListener("click", async () => {
  const focused = (document.querySelector('input[name="focused"]:checked')?.value) || null;
  const improvement = document.getElementById("improvement").value;
  await saveEveningReflection({ focused, improvement, dateKey: todayId() });
  alert("Evening reflection saved!");
});

/* ---- Date picker: load another day (you'll render charts yourself) ---- */
loadDateDataBtn.addEventListener("click", async () => {
  const key = datePicker.value || todayId();
  const day = await getDay(key);
  if (!day) { alert("No data for that date."); return; }
  console.log("Day data:", day); // you can now visualize activities & stats
});

/* ---- Show today's date nicely ---- */
document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });

/* ---- Optional: auto-fill evening labels and load today's tasks ---- */
(async function loadTodaysTasks() {
  const d = await getDay(todayId());
  if (d?.tasks?.length) {
    // Load existing tasks for today
    document.getElementById("task1").value = d.tasks[0]?.text || "";
    document.getElementById("task2").value = d.tasks[1]?.text || "";
    document.getElementById("task3").value = d.tasks[2]?.text || "";
    document.getElementById("avoidance").value = d.avoidance || "";
    
    // Update evening labels
    document.getElementById("task1Label").textContent = d.tasks[0]?.text || "Task 1";
    document.getElementById("task2Label").textContent = d.tasks[1]?.text || "Task 2";
    document.getElementById("task3Label").textContent = d.tasks[2]?.text || "Task 3";
    
    console.log("Loaded existing tasks for today:", d.tasks.map(t => t.text));
  }
})();

/* ---- Check if tasks already generated today ---- */
async function checkAndLoadTodaysTasks() {
  try {
    const todayData = await getDay(todayId());
    const regenerateTasksBtn = document.getElementById("regenerateTasks");
    
    if (todayData && todayData.tasks && todayData.tasks.length >= 3) {
      // Tasks already generated - load them and disable button
      document.getElementById("task1").value = todayData.tasks[0]?.text || "";
      document.getElementById("task2").value = todayData.tasks[1]?.text || "";
      document.getElementById("task3").value = todayData.tasks[2]?.text || "";
      document.getElementById("avoidance").value = todayData.avoidance || "";
      
      // Update evening labels
      document.getElementById("task1Label").textContent = todayData.tasks[0]?.text || "Task 1";
      document.getElementById("task2Label").textContent = todayData.tasks[1]?.text || "Task 2";
      document.getElementById("task3Label").textContent = todayData.tasks[2]?.text || "Task 3";
      
      // Disable the generate button
      if (regenerateTasksBtn) {
        regenerateTasksBtn.disabled = true;
        regenerateTasksBtn.textContent = "✅ Tasks Generated for Today";
        regenerateTasksBtn.style.background = "#28a745";
        regenerateTasksBtn.style.cursor = "not-allowed";
        regenerateTasksBtn.title = "Tasks are already generated for today. Try again tomorrow!";
      }
      
      return true; // Tasks already exist
    }
    
    return false; // No tasks generated yet
  } catch (error) {
    console.error("Error checking today's tasks:", error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const regenerateTasksBtn = document.getElementById("regenerateTasks");
  
  if (!regenerateTasksBtn) {
    return;
  }
  
  // Check if tasks are already generated for today
  const tasksAlreadyGenerated = await checkAndLoadTodaysTasks();
  
  if (tasksAlreadyGenerated) {
    return; // Don't add click listener if tasks already exist
  }
  regenerateTasksBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    
    const taskBank = [
      "Read 20 pages of a book",
      "Exercise for 30 minutes", 
      "Meditate for 10 minutes",
      "Learn something new for 1 hour",
      "Call a friend or family member",
      "Organize your workspace",
      "Practice a skill for 30 minutes",
      "Write in a journal",
      "Take a walk in nature",
      "Complete a creative project",
      "Plan your week ahead",
      "Clean and declutter your space",
      "Cook a healthy meal",
      "Practice gratitude - list 5 things",
      "Work on a personal goal",
      "Listen to an educational podcast",
      "Do breathing exercises",
      "Review and update your goals",
      "Spend time in sunlight",
      "Connect with nature"
    ];
    
    const avoidanceSuggestions = [
      "Social media scrolling",
      "Procrastination",
      "Negative self-talk",
      "Junk food",
      "Excessive phone use",
      "Complaining",
      "Making excuses",
      "Overthinking",
      "Comparing to others",
      "Wasting time"
    ];
    
    try {
      // Randomly select 3 unique tasks
      const shuffled = [...taskBank].sort(() => 0.5 - Math.random());
      const selectedTasks = shuffled.slice(0, 3);
      const randomAvoidance = avoidanceSuggestions[Math.floor(Math.random() * avoidanceSuggestions.length)];
      
      // Fill the task inputs with generated tasks
      document.getElementById("task1").value = selectedTasks[0];
      document.getElementById("task2").value = selectedTasks[1];
      document.getElementById("task3").value = selectedTasks[2];
      document.getElementById("avoidance").value = randomAvoidance;
      
      // Save the generated tasks to database with proper structure
      await saveMorningPlan({
        task1: selectedTasks[0],
        task2: selectedTasks[1], 
        task3: selectedTasks[2],
        avoidance: randomAvoidance,
        dateKey: todayId()
      });
      
      // Update evening labels immediately
      document.getElementById("task1Label").textContent = selectedTasks[0];
      document.getElementById("task2Label").textContent = selectedTasks[1];
      document.getElementById("task3Label").textContent = selectedTasks[2];
      
      // Disable the generate button
      regenerateTasksBtn.disabled = true;
      regenerateTasksBtn.textContent = "✅ Tasks Generated for Today";
      regenerateTasksBtn.style.background = "#28a745";
      regenerateTasksBtn.style.cursor = "not-allowed";
      regenerateTasksBtn.title = "Tasks are already generated for today. Try again tomorrow!";
      
      alert(`Tasks generated for ${todayId()}! These will persist all day and sync across all your devices. 🎯`);
      
    } catch (error) {
      alert("Sorry, there was an error generating tasks. Please try again.");
    }
  });
});

// Live Clock for the Widget
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const clockElement = document.getElementById('liveClock');
    if(clockElement) clockElement.innerText = timeString;
}
setInterval(updateClock, 1000);
updateClock(); // Run immediately

// Sidebar Clock Update Function
function updateSidebarClock() {
    const now = new Date();
    const timeEl = document.getElementById('sidebarClock');
    if(timeEl) {
        timeEl.innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
}
setInterval(updateSidebarClock, 1000);
updateSidebarClock();

// Global function for removing routine entries (needed for onclick handlers)
window.removeRoutineEntry = function(button) {
  const entry = button.closest('.routine-entry');
  const container = document.getElementById('routineEntries');
  
  // Keep at least one entry
  if (container.children.length > 1) {
    entry.remove();
  }
};

/* ---- Auth check: only proceed if user is signed in ---- */
onUserReady((user) => {
  if (!user) {
    // Redirect to sign-in if not authenticated
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000); // Give user 2 seconds to see the page before redirect
  }
});