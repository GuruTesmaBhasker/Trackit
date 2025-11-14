// script.js
import {
  onUserReady, todayId, saveSleepData, addRoutineActivity,
  saveMorningPlan, updateTaskCompletion, saveEveningReflection, getDay,
  updateActivityCategory, backfillActivityCategories, getRecentSleepSeries
} from "./database.js";

import { classifyActivityLabel, getCategoryColor, getCategoryEmoji } from "./classify.js";

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

/* ---- Generate Tasks Button ---- */
const regenerateTasksBtn = document.getElementById("regenerateTasks");
regenerateTasksBtn?.addEventListener("click", async () => {
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
  
  // Randomly select 3 unique tasks
  const shuffled = [...taskBank].sort(() => 0.5 - Math.random());
  const selectedTasks = shuffled.slice(0, 3);
  const randomAvoidance = avoidanceSuggestions[Math.floor(Math.random() * avoidanceSuggestions.length)];
  
  // Fill the task inputs with generated tasks
  document.getElementById("task1").value = selectedTasks[0];
  document.getElementById("task2").value = selectedTasks[1];
  document.getElementById("task3").value = selectedTasks[2];
  document.getElementById("avoidance").value = randomAvoidance;
  
  // Save the generated tasks to database (persists for the entire day)
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
  
  alert(`Tasks generated for ${todayId()}! These will persist all day. 🎯`);
});

/* ---- Backfill functionality ---- */
const backfillCategoriesBtn = document.getElementById("backfillCategories");
const backfillSleepBtn = document.getElementById("backfillSleep");

if (backfillCategoriesBtn) {
  backfillCategoriesBtn.addEventListener("click", async () => {
    if (!confirm("This will auto-categorize all existing activities. Continue?")) return;
    
    try {
      backfillCategoriesBtn.disabled = true;
      backfillCategoriesBtn.textContent = "Processing...";
      
      const result = await backfillActivityCategories();
      alert(`Backfill complete! ${result.updated} activities categorized out of ${result.processed} processed.`);
    } catch (error) {
      console.error("Backfill error:", error);
      alert("Error during backfill: " + error.message);
    } finally {
      backfillCategoriesBtn.disabled = false;
      backfillCategoriesBtn.textContent = "🔧 Auto-categorize Existing Activities";
    }
  });
}

if (backfillSleepBtn) {
  backfillSleepBtn.addEventListener("click", async () => {
    if (!confirm("This will update existing sleep data with analytics fields. Continue?")) return;
    
    try {
      backfillSleepBtn.disabled = true;
      backfillSleepBtn.textContent = "Processing...";
      
      // Import and run sleep backfill
      const { backfillSleepData } = await import('./backfill-sleep.js');
      const result = await backfillSleepData();
      alert(`Sleep data backfill complete! ${result.updated} documents updated out of ${result.processed} processed.`);
    } catch (error) {
      console.error("Sleep backfill error:", error);
      alert("Error during sleep backfill: " + error.message);
    } finally {
      backfillSleepBtn.disabled = false;
      backfillSleepBtn.textContent = "💤 Update Sleep Analytics Data";
    }
  });
}

/* ---- Backfill Categories Button ---- */
const backfillBtn = document.getElementById("backfillCategories");
if (backfillBtn) {
  backfillBtn.addEventListener("click", async () => {
    if (!confirm("This will automatically categorize all existing activities. Continue?")) {
      return;
    }
    
    backfillBtn.textContent = "Processing...";
    backfillBtn.disabled = true;
    
    try {
      const result = await backfillActivityCategories();
      alert(`Backfill complete! Updated ${result.updated} activities out of ${result.processed} processed.`);
      backfillBtn.textContent = "✅ Categorization Complete";
      backfillBtn.style.background = "rgba(76, 175, 80, 0.2)";
      setTimeout(() => {
        backfillBtn.style.display = "none";
      }, 3000);
    } catch (error) {
      console.error("Backfill error:", error);
      alert("Error during backfill: " + error.message);
      backfillBtn.textContent = "🔧 Auto-categorize Existing Activities";
      backfillBtn.disabled = false;
    }
  });
}

/* ---- Auth check: only proceed if user is signed in ---- */
onUserReady((user) => {
  if (!user) {
    // Redirect to sign-in if not authenticated
    window.location.href = "index.html";
  } else {
    console.log("User signed in:", user.email);
  }
});