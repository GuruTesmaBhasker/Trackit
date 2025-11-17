// script.js
import {
  onUserReady, todayId, saveSleepData, addRoutineActivity,
  saveMorningPlan, updateTaskCompletion, saveEveningReflection, getDay,
  updateActivityCategory, formatDateForDisplay
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

function renderHeaderDate(d = new Date()) {
  currentDateEl.textContent = d.toLocaleDateString(undefined, { weekday: "long", year:"numeric", month:"long", day:"numeric" });
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



/* ---- Calendar functionality ---- */
function setupCalendarFunctionality() {
  const calendarDates = document.querySelectorAll('.clickable-date');
  
  if (calendarDates.length === 0) {
    console.warn('No clickable calendar dates found');
    return;
  }
  
  calendarDates.forEach(dateElement => {
    dateElement.addEventListener('click', async () => {
      // Remove previous selection
      document.querySelectorAll('.clickable-date.selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Add selection to clicked date
      dateElement.classList.add('selected');
      
      // Get the date from data attribute
      const selectedDate = dateElement.getAttribute('data-date');
      
      // Load and display data for this date
      await loadDateData(selectedDate);
    });
  });
}

/* ---- Load and display data for a specific date ---- */
async function loadDateData(dateKey) {
  try {
    const dayData = await getDay(dateKey);
    
    // Show the analytics widget
    const analyticsWidget = document.getElementById('analyticsWidget');
    if (analyticsWidget) {
      analyticsWidget.style.display = 'block';
    }
    
    // Show the selected date section
    const selectedDateSection = document.getElementById('selectedDateSection');
    if (selectedDateSection) {
      selectedDateSection.style.display = 'block';
      
      // Smooth scroll to the selected date section after a short delay
      setTimeout(() => {
        selectedDateSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
    
    // Update analytics widget
    updateAnalyticsWidget(dateKey, dayData);
    
    // Update dashboard display
    updateDashboardDisplay(dateKey, dayData);
    
    if (!dayData) { 
      console.log("No data found for date:", dateKey);
      return; 
    }
    
  } catch (error) {
    console.error("Error loading date data:", error);
    // Still show widgets even if there's an error, but with no data
    const analyticsWidget = document.getElementById('analyticsWidget');
    const selectedDateSection = document.getElementById('selectedDateSection');
    if (analyticsWidget) analyticsWidget.style.display = 'block';
    if (selectedDateSection) selectedDateSection.style.display = 'block';
    updateAnalyticsWidget(dateKey, null);
    updateDashboardDisplay(dateKey, null);
  }
}

/* ---- Update analytics widget with productivity stats ---- */
function updateAnalyticsWidget(dateKey, dayData) {
  const analyticsDate = document.getElementById('analyticsDate');
  const productiveTimeEl = document.getElementById('productiveTime');
  const neutralTimeEl = document.getElementById('neutralTime');
  const wasteTimeEl = document.getElementById('wasteTime');
  const productiveBar = document.getElementById('productiveBar');
  const neutralBar = document.getElementById('neutralBar');
  const wasteBar = document.getElementById('wasteBar');
  
  // Format the date nicely
  const dateObj = new Date(dateKey + 'T12:00:00');
  analyticsDate.textContent = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  console.log('Updating analytics for:', dateKey, 'with data:', dayData);
  
  if (!dayData || !dayData.activities || dayData.activities.length === 0) {
    console.log('No activities data found for', dateKey);
    // No data available
    productiveTimeEl.textContent = '0h 0m';
    neutralTimeEl.textContent = '0h 0m';
    wasteTimeEl.textContent = '0h 0m';
    productiveBar.style.width = '0%';
    neutralBar.style.width = '0%';
    wasteBar.style.width = '0%';
    return;
  }
  
  // Calculate category totals with better error handling
  const categoryTotals = { productive: 0, neutral: 0, waste: 0 };
  
  dayData.activities.forEach((activity, index) => {
    console.log(`Processing activity ${index}:`, activity);
    
    // Handle both old format (start/end) and new format (startTime/endTime)
    const startTime = activity.startTime || activity.start;
    const endTime = activity.endTime || activity.end;
    
    if (startTime && endTime) {
      let startDate, endDate;
      
      // Handle Firestore Timestamp objects
      try {
        startDate = startTime.toDate ? startTime.toDate() : new Date(startTime);
        endDate = endTime.toDate ? endTime.toDate() : new Date(endTime);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Invalid date found in activity:', activity);
          return;
        }
        
        // Calculate duration in minutes
        const minutes = Math.max(0, (endDate - startDate) / (1000 * 60));
        
        const category = (activity.category || 'neutral').toLowerCase();
        
        // Ensure category is valid
        if (['productive', 'neutral', 'waste'].includes(category)) {
          categoryTotals[category] = (categoryTotals[category] || 0) + minutes;
          console.log(`Added ${minutes.toFixed(1)} minutes to ${category} category`);
        } else {
          console.warn('Unknown category:', category, 'defaulting to neutral');
          categoryTotals.neutral = (categoryTotals.neutral || 0) + minutes;
        }
      } catch (error) {
        console.error('Error processing activity time:', error, activity);
      }
    } else if (activity.minutes && typeof activity.minutes === 'number') {
      // Fallback: if only minutes are stored without start/end times
      const category = (activity.category || 'neutral').toLowerCase();
      const minutes = Math.max(0, activity.minutes);
      
      if (['productive', 'neutral', 'waste'].includes(category)) {
        categoryTotals[category] = (categoryTotals[category] || 0) + minutes;
        console.log(`Added ${minutes} minutes (from minutes field) to ${category} category`);
      } else {
        categoryTotals.neutral = (categoryTotals.neutral || 0) + minutes;
      }
    } else {
      console.warn('Activity missing time data:', activity);
    }
  });
  
  console.log('Final category totals:', categoryTotals);
  
  // Format time display with better formatting
  const formatTime = (minutes) => {
    if (minutes < 1) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };
  
  productiveTimeEl.textContent = formatTime(categoryTotals.productive);
  neutralTimeEl.textContent = formatTime(categoryTotals.neutral);
  wasteTimeEl.textContent = formatTime(categoryTotals.waste);
  
  // Calculate percentages for progress bar
  const totalTime = categoryTotals.productive + categoryTotals.neutral + categoryTotals.waste;
  console.log('Total tracked time:', formatTime(totalTime));
  
  if (totalTime > 0) {
    const productivePct = Math.round((categoryTotals.productive / totalTime) * 100);
    const neutralPct = Math.round((categoryTotals.neutral / totalTime) * 100);
    const wastePct = Math.round((categoryTotals.waste / totalTime) * 100);
    
    console.log('Percentages - Productive:', productivePct, 'Neutral:', neutralPct, 'Waste:', wastePct);
    
    productiveBar.style.width = `${productivePct}%`;
    neutralBar.style.width = `${neutralPct}%`;
    wasteBar.style.width = `${wastePct}%`;
  } else {
    productiveBar.style.width = '0%';
    neutralBar.style.width = '0%';
    wasteBar.style.width = '0%';
  }
}

/* ---- Update dashboard display with detailed data ---- */
function updateDashboardDisplay(dateKey, dayData) {
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateSubtitle = document.getElementById('selectedDateSubtitle');
  const sleepInfo = document.getElementById('sleepInfo');
  const activitiesList = document.getElementById('activitiesList');
  const tasksInfo = document.getElementById('tasksInfo');
  
  // Format the date for title
  const dateObj = new Date(dateKey + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  selectedDateTitle.textContent = `📅 Data for ${formattedDate}`;
  selectedDateSubtitle.textContent = `Your activities and analytics for ${formattedDate}`;
  
  if (!dayData) {
    sleepInfo.innerHTML = '<p>No sleep data available for this date</p>';
    activitiesList.innerHTML = '<p>No activities recorded for this date</p>';
    tasksInfo.innerHTML = '<p>No tasks set for this date</p>';
    return;
  }
  
  // Display sleep data
  if (dayData.sleep) {
    const sleep = dayData.sleep;
    let sleepContent = '<div class="sleep-info">';
    
    if (sleep.sleptAt) {
      const sleptAtTime = sleep.sleptAt.toDate ? sleep.sleptAt.toDate() : new Date(sleep.sleptAt);
      sleepContent += `<div class="sleep-stat"><span>💤 Slept at:</span><span>${sleptAtTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>`;
    }
    
    if (sleep.wakeUpAt) {
      const wakeUpTime = sleep.wakeUpAt.toDate ? sleep.wakeUpAt.toDate() : new Date(sleep.wakeUpAt);
      sleepContent += `<div class="sleep-stat"><span>⏰ Wake up at:</span><span>${wakeUpTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>`;
    }
    
    if (sleep.sleptAt && sleep.wakeUpAt) {
      const sleptTime = sleep.sleptAt.toDate ? sleep.sleptAt.toDate() : new Date(sleep.sleptAt);
      const wakeTime = sleep.wakeUpAt.toDate ? sleep.wakeUpAt.toDate() : new Date(sleep.wakeUpAt);
      const duration = (wakeTime - sleptTime) / (1000 * 60); // minutes
      const hours = Math.floor(duration / 60);
      const minutes = Math.round(duration % 60);
      sleepContent += `<div class="sleep-stat"><span>🛌 Duration:</span><span>${hours}h ${minutes}m</span></div>`;
    }
    
    sleepContent += '</div>';
    sleepInfo.innerHTML = sleepContent;
  } else {
    sleepInfo.innerHTML = '<p>No sleep data available for this date</p>';
  }
  
  // Display activities
  if (dayData.activities && dayData.activities.length > 0) {
    let activitiesContent = '';
    
    // Sort activities by start time with better error handling
    const sortedActivities = dayData.activities
      .filter(activity => {
        // Accept activities with either format or just minutes
        const hasTimeRange = (activity.startTime || activity.start) && (activity.endTime || activity.end);
        const hasMinutes = activity.minutes && typeof activity.minutes === 'number';
        return hasTimeRange || hasMinutes;
      })
      .sort((a, b) => {
        try {
          // Handle both field name formats
          const aStart = a.startTime || a.start;
          const bStart = b.startTime || b.start;
          
          if (!aStart || !bStart) return 0; // Keep relative order if no start times
          
          const aTime = aStart.toDate ? aStart.toDate() : new Date(aStart);
          const bTime = bStart.toDate ? bStart.toDate() : new Date(bStart);
          return aTime - bTime;
        } catch (error) {
          console.error('Error sorting activities:', error);
          return 0;
        }
      });
    
    console.log('Displaying', sortedActivities.length, 'sorted activities');
    
    sortedActivities.forEach((activity, index) => {
      const category = (activity.category || 'neutral').toLowerCase();
      const emoji = getCategoryEmoji(category);
      
      let timeString = '';
      try {
        // Handle both field name formats
        const startTime = activity.startTime || activity.start;
        const endTime = activity.endTime || activity.end;
        
        if (startTime && endTime) {
          const startDate = startTime.toDate ? startTime.toDate() : new Date(startTime);
          const endDate = endTime.toDate ? endTime.toDate() : new Date(endTime);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const duration = Math.max(0, (endDate - startDate) / (1000 * 60)); // minutes
            
            const formatDuration = (mins) => {
              if (mins < 1) return '< 1m';
              const hours = Math.floor(mins / 60);
              const minutes = Math.round(mins % 60);
              if (hours === 0) return `${minutes}m`;
              if (minutes === 0) return `${hours}h`;
              return `${hours}h ${minutes}m`;
            };
            
            timeString = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${formatDuration(duration)})`;
          }
        } else if (activity.minutes && typeof activity.minutes === 'number') {
          // Fallback for activities with only minutes
          const formatDuration = (mins) => {
            if (mins < 1) return '< 1m';
            const hours = Math.floor(mins / 60);
            const minutes = Math.round(mins % 60);
            if (hours === 0) return `${minutes}m`;
            if (minutes === 0) return `${hours}h`;
            return `${hours}h ${minutes}m`;
          };
          timeString = `Duration: ${formatDuration(activity.minutes)}`;
        }
        
        if (!timeString) {
          timeString = 'No time data';
        }
      } catch (error) {
        console.error('Error formatting activity time:', error, activity);
        timeString = 'Time formatting error';
      }
      
      const activityLabel = activity.label || activity.activity || `Activity ${index + 1}`;
      
      activitiesContent += `
        <div class="activity-item ${category}">
          <div class="activity-time">${timeString}</div>
          <div class="activity-description">${activityLabel}</div>
          <span class="activity-category ${category}">${emoji} ${category}</span>
        </div>
      `;
    });
    
    activitiesList.innerHTML = activitiesContent || '<p>No activities recorded for this date</p>';
  } else {
    activitiesList.innerHTML = '<p>No activities recorded for this date</p>';
  }
  
  // Display tasks
  if (dayData.tasks && dayData.tasks.length > 0) {
    let tasksContent = '<div class="tasks-info">';
    
    dayData.tasks.forEach((task, index) => {
      const isCompleted = task.done || false;
      tasksContent += `
        <div class="task-item ${isCompleted ? 'completed' : ''}">
          <div class="task-checkbox ${isCompleted ? 'completed' : ''}"></div>
          <div class="task-text">${task.text || `Task ${index + 1}`}</div>
        </div>
      `;
    });
    
    if (dayData.avoidance) {
      tasksContent += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);"><strong>🚫 Avoid:</strong> ${dayData.avoidance}</div>`;
    }
    
    tasksContent += '</div>';
    tasksInfo.innerHTML = tasksContent;
  } else {
    tasksInfo.innerHTML = '<p>No tasks set for this date</p>';
  }
}

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
    console.log('No user authenticated - redirecting to sign-in...');
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } else {
    console.log('User authenticated successfully');
    setupCalendarFunctionality();
    
    // Auto-load today's data on page load
    const today = todayId();
    const todayElement = document.querySelector(`[data-date="${today}"]`);
    if (todayElement) {
      todayElement.classList.add('selected');
      loadDateData(today);
    }
  }
});

// Backup initialization after DOM load in case auth doesn't trigger
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded - backup calendar initialization');
  setTimeout(() => {
    setupCalendarFunctionality();
  }, 1000); // Wait 1 second for auth to potentially complete
});

// Test function for manual debugging
window.testCalendar = function() {
  console.log('Testing calendar manually...');
  setupCalendarFunctionality();
  
  // Test showing analytics widget
  const analyticsWidget = document.getElementById('analyticsWidget');
  if (analyticsWidget) {
    analyticsWidget.style.display = 'block';
    console.log('Analytics widget should now be visible');
  }
  
  // Test showing selected date section
  const selectedDateSection = document.getElementById('selectedDateSection');
  if (selectedDateSection) {
    selectedDateSection.style.display = 'block';
    console.log('Selected date section should now be visible');
  }
};