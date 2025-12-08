// database.js  (type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, // you use email/password auth
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, collection,
  updateDoc, serverTimestamp, Timestamp, getDocs, query, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";



/* 🔧 Your Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCYyTIYCX5bvN7r0BcJvLOKEON1nUaFnQk",
  authDomain: "self-improvement-7c7f6.firebaseapp.com",
  projectId: "self-improvement-7c7f6",
  storageBucket: "self-improvement-7c7f6.firebasestorage.app",
  messagingSenderId: "494829137683",
  appId: "1:494829137683:web:1e9e6f4a910b02b70774e6",
  measurementId: "G-43X839WMSM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ----- Helpers ----- */
// Local calendar date (YYYY-MM-DD) based on your device timezone (India).
export function todayId(date = new Date()) {
  // ensures local date, not UTC
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function asTimestamp(input) {
  // supports <input type="time"> (HH:MM) and <input type="datetime-local">
  if (!input) return null;
  // if only time is given, attach today's date
  if (/^\d{2}:\d{2}$/.test(input)) {
    const [h, mm] = input.split(":");
    const t = new Date();
    t.setHours(Number(h), Number(mm), 0, 0);
    return Timestamp.fromDate(t);
  }
  // datetime-local -> YYYY-MM-DDTHH:MM
  return Timestamp.fromDate(new Date(input));
}
function minutesBetween(tsStart, tsEnd) {
  if (!tsStart || !tsEnd) return 0;
  const ms = tsEnd.toMillis() - tsStart.toMillis();
  return Math.max(0, Math.round(ms / 60000));
}

/* ----- Auth ready ----- */
export function onUserReady(cb) {
  onAuthStateChanged(auth, (user) => cb(user || null));
}

/* ----- Ensure a daily doc exists ----- */
export async function ensureDaily(dateKey = todayId()) {
  const ref = doc(db, "daily", dateKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      date: dateKey,
      // optional summaries you can compute later
      completion: 0,
      focus: null,
      notes: "",
      totals: { routineMinutes: 0 },
      tasks: [],  // your top-3 if you store them
    });
  }
  return ref;
}

/* ----- Sleep data ----- */

// helper: convert datetime-local string or Timestamp to Date (local)
function toDateLocal(input) {
  if (!input) return null;
  // If already a Firestore Timestamp
  if (input instanceof Timestamp) return input.toDate();
  // If ISO / datetime-local string
  const d = new Date(input);
  if (isNaN(d)) return null;
  return d;
}

// helper: minutes since local midnight (0..1439)
function minutesSinceMidnight(date) {
  if (!date) return null;
  return date.getHours() * 60 + date.getMinutes();
}

export async function saveSleepData({ sleptAt, wakeUpAt, dateKey = todayId() }) {
  const ref = await ensureDaily(dateKey);

  // Convert inputs to Date objects (works for datetime-local string or Timestamp)
  const sleptDate = toDateLocal(sleptAt);
  const wakeDate  = toDateLocal(wakeUpAt);

  // compute minutes total (duration) robustly
  let mins = null;
  if (sleptDate && wakeDate) {
    mins = Math.round((wakeDate.getTime() - sleptDate.getTime()) / 60000);
    // handle sleep across midnight
    if (mins < 0) mins += 24 * 60;
  }

  // compute minutes since midnight for each (useful to chart patterns)
  const sleptMin = minutesSinceMidnight(sleptDate);
  const wakeMin  = minutesSinceMidnight(wakeDate);

  const payload = {
    sleep: {
      sleptAt: sleptDate ? Timestamp.fromDate(sleptDate) : null,
      wakeUpAt: wakeDate ? Timestamp.fromDate(wakeDate) : null,
      minutes: mins,
      sleptMin: sleptMin,
      wakeMin: wakeMin,
      savedAt: serverTimestamp()
    }
  };

  await updateDoc(ref, payload);
}

/* ----- Check if morning routine already saved for a date ----- */
export async function checkMorningRoutineSaved(dateKey = todayId()) {
  const ref = await ensureDaily(dateKey);
  const dailySnap = await getDoc(ref);
  
  if (!dailySnap.exists()) {
    return false;
  }
  
  const data = dailySnap.data();
  return data.morningRoutineSaved === true;
}

/* ----- Mark morning routine as saved ----- */
export async function markMorningRoutineSaved(dateKey = todayId()) {
  const ref = await ensureDaily(dateKey);
  await updateDoc(ref, {
    morningRoutineSaved: true,
    morningRoutineSavedAt: serverTimestamp()
  });
}

/* ----- Remove existing duplicate activities ----- */
export async function removeDuplicateActivities(dateKey = todayId()) {
  const ref = await ensureDaily(dateKey);
  const activitiesSnap = await getDocs(collection(ref, "activities"));
  
  if (activitiesSnap.empty) {
    return { removed: 0, message: 'No activities found' };
  }
  
  const activities = activitiesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Group activities by label, start time, and end time
  const activityGroups = new Map();
  
  activities.forEach(activity => {
    const label = activity.label?.trim().toLowerCase() || '';
    const startTime = activity.startTime?.toMillis() || activity.start?.toMillis() || 0;
    const endTime = activity.endTime?.toMillis() || activity.end?.toMillis() || 0;
    
    const key = `${label}-${startTime}-${endTime}`;
    
    if (!activityGroups.has(key)) {
      activityGroups.set(key, []);
    }
    activityGroups.get(key).push(activity);
  });
  
  let removedCount = 0;
  
  // For each group, keep the oldest (first created) and delete the rest
  for (const [key, group] of activityGroups) {
    if (group.length > 1) {
      // Sort by creation time (oldest first)
      group.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return aTime - bTime;
      });
      
      // Keep the first (oldest), delete the rest
      const toDelete = group.slice(1);
      
      for (const duplicate of toDelete) {
        try {
          await deleteDoc(doc(db, "daily", dateKey, "activities", duplicate.id));
          removedCount++;
          console.log(`Removed duplicate: ${duplicate.label} at ${new Date(duplicate.startTime?.toMillis() || 0).toLocaleTimeString()}`);
        } catch (error) {
          console.error('Error deleting duplicate:', error);
        }
      }
    }
  }
  
  return { removed: removedCount, message: `Removed ${removedCount} duplicate activities` };
}

/* ----- Check for duplicate activities ----- */
export async function checkDuplicateActivity({ start, end, label, dateKey = todayId() }) {
  const ref = await ensureDaily(dateKey);
  const startTS = asTimestamp(start);
  const endTS = asTimestamp(end);
  
  // Get all activities for this date
  const activitiesSnap = await getDocs(collection(ref, "activities"));
  
  // Check if any existing activity matches exactly
  for (const doc of activitiesSnap.docs) {
    const activity = doc.data();
    
    // Compare label, start time, and end time
    const sameLabel = activity.label?.trim().toLowerCase() === label?.trim().toLowerCase();
    const sameStartTime = activity.startTime?.toMillis() === startTS?.toMillis() || activity.start?.toMillis() === startTS?.toMillis();
    const sameEndTime = activity.endTime?.toMillis() === endTS?.toMillis() || activity.end?.toMillis() === endTS?.toMillis();
    
    if (sameLabel && sameStartTime && sameEndTime) {
      return true; // Duplicate found
    }
  }
  
  return false; // No duplicate found
}

/* ----- Morning routine activities (time blocks) ----- */
// Stored under: /daily/{dateKey}/activities/{autoId}
export async function addRoutineActivity({ start, end, label, category = null, dateKey = todayId(), isBatch = false }) {
  // Check for duplicates first
  const isDuplicate = await checkDuplicateActivity({ start, end, label, dateKey });
  if (isDuplicate) {
    console.log('Duplicate activity detected, skipping save:', label);
    return { success: false, message: 'Duplicate activity - not saved' };
  }
  
  const ref = await ensureDaily(dateKey);
  const startTS = asTimestamp(start);
  const endTS   = asTimestamp(end);
  const mins = minutesBetween(startTS, endTS);
  
  // Auto-classify if no category provided
  const finalCategory = category;

  await addDoc(collection(ref, "activities"), {
    label: (label || "").trim() || "Activity",
    startTime: startTS,  // Changed from 'start' to 'startTime'
    endTime: endTS,      // Changed from 'end' to 'endTime'
    minutes: mins,       // Keep minutes for compatibility
    category: finalCategory,
    createdAt: serverTimestamp()
  });

  // bump daily total minutes (simple re-save; you can compute server-side later)
  const snap = await getDoc(ref);
  const prev = snap.exists() && snap.data().totals?.routineMinutes || 0;
  await updateDoc(ref, { "totals.routineMinutes": prev + mins });
  
  // If this is part of a batch save (morning routine), mark it as saved
  if (isBatch) {
    await markMorningRoutineSaved(dateKey);
  }
  
  return { success: true, message: 'Activity saved successfully' };
}

/* ----- Save Top-3 + avoidance ----- */
export async function saveMorningPlan({ task1, task2, task3, avoidance, dateKey = todayId() }) {
  const ref = await ensureDaily(dateKey);
  await updateDoc(ref, {
    tasks: [
      { text: task1 || "", done: false },
      { text: task2 || "", done: false },
      { text: task3 || "", done: false },
    ],
    avoidance: avoidance || "",
    morningSavedAt: serverTimestamp()
  });
}

/* ----- Update task completion (evening checkboxes) ----- */
export async function updateTaskCompletion({ index, done, dateKey = todayId() }) {
  const ref = await ensureDaily(dateKey);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];

  if (!(index in tasks)) return;

  tasks[index].done = !!done;
  const doneCount = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  await updateDoc(ref, {
    tasks,
    completion: pct,
    lastUpdated: serverTimestamp()
  });
}

/* ----- Save evening reflection ----- */
export async function saveEveningReflection({ focused, improvement, dateKey = todayId() }) {
  const ref = await ensureDaily(dateKey);
  await updateDoc(ref, {
    reflection: {
      focused: focused ?? null, // "yes" | "no"
      improvement: improvement || "",
      savedAt: serverTimestamp()
    }
  });
}

/* ----- Fetch activities for a given day (to render charts) ----- */
export async function getDay(dateKey = todayId()) {
  const ref = doc(db, "daily", dateKey);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) return null;
  
  const data = { id: dateKey, ...snap.data() };
  
  // Also fetch activities subcollection
  const activitiesSnap = await getDocs(collection(ref, "activities"));
  data.activities = activitiesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return data;
}

/* ----- Get all activities for a specific date ----- */
export async function getActivities(dateKey = todayId()) {
  const ref = doc(db, "daily", dateKey);
  const activitiesSnap = await getDocs(collection(ref, "activities"));
  return activitiesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/* ----- Update activity category ----- */
export async function updateActivityCategory(activityId, newCategory, dateKey = todayId()) {
  const activityRef = doc(db, "daily", dateKey, "activities", activityId);
  await updateDoc(activityRef, {
    category: newCategory,
    lastUpdated: serverTimestamp()
  });
}



/* ----- Get current user ----- */
export function getCurrentUser() {
  return auth.currentUser;
}

/* ----- Get all daily documents for a date range (for analytics) ----- */
export async function getDateRange(startDate, endDate) {
  const dailyRef = collection(db, "daily");
  const q = query(
    dailyRef, 
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/* ----- Task Bank System ----- */
const TASK_BANK = {
  "LEARN": [
    "Revise one Statistics concept",
    "Solve 3 SQL queries",
    "Practice Pandas for 20 minutes",
    "Learn one new Excel feature (Pivot, XLOOKUP, Power Query)",
    "Review yesterday's notes",
    "Study one probability topic (conditional, Bayes, distributions)",
    "Watch a 10-min data analysis tutorial",
    "Practice Matplotlib/Plotly for 15 minutes",
    "Read Python documentation for a function you rarely use",
    "Complete one LeetCode easy problem",
    "Solve 1 case study (data/business)",
    "Revise DAX formulas",
    "Study Power BI visual formatting",
    "Revise OOP concepts in Python",
    "Learn one regex pattern and test it",
    "Practice typing for 10 minutes",
    "Read one article on decision-making",
    "Learn a new shortcut in Excel or VS Code",
    "Practice debugging Python code",
    "Apply a statistics formula in a small example",
    "Review one dataset and identify patterns",
    "Study an algorithm or data structure",
    "Learn one cybersecurity basic concept",
    "Solve 5 MCQs of aptitude",
    "Study one real-world analytics case (Google, Uber, Swiggy)",
    "Learn 10 new vocabulary words",
    "Watch a TED talk on leadership",
    "Study a new programming language for 20 minutes",
    "Learn about blockchain basics",
    "Read about machine learning concepts",
    "Study design patterns in software",
    "Learn basic photography techniques",
    "Study body language and communication",
    "Learn about time management techniques",
    "Study memory improvement methods",
    "Learn basic music theory",
    "Study speed reading techniques",
    "Learn about emotional intelligence",
    "Study public speaking tips",
    "Learn basic cooking techniques"
  ],
  "CREATE": [
    "Update today's progress on GitHub",
    "Improve a section of your portfolio website",
    "Create a mini Excel dashboard",
    "Write 1 page of clean documentation",
    "Add responsive design improvements to your site",
    "Clean a dataset and upload to GitHub",
    "Build a simple automation script (Python)",
    "Add one new feature to SeeEvent",
    "Create a quick Power BI visualization",
    "Build a small HTML/CSS component from scratch",
    "Write a blog post about what you learned today",
    "Record a 2–3 min explanation video for yourself",
    "Redesign a small UI component to look cleaner",
    "Make a dataset profile summary (mean, mode, IQR)",
    "Build a helper library function in Python",
    "Write a simple SQL stored procedure",
    "Optimize a piece of code in your project",
    "Improve your README.md files",
    "Create a simple statistical chart (histogram/scatter) with Python",
    "Add one new personal project idea to your list",
    "Design a simple app mockup",
    "Create a daily habit tracker template",
    "Build a simple calculator",
    "Design a personal logo or brand",
    "Create a mind map of your goals",
    "Write a short story or poem",
    "Create a budget planner template",
    "Design social media graphics",
    "Build a simple game (tic-tac-toe)",
    "Create a recipe collection",
    "Design a workout routine",
    "Build a password generator",
    "Create a learning resource list",
    "Design a time-blocking schedule",
    "Build a simple chatbot",
    "Create presentation slides template",
    "Design a vision board",
    "Build a weather app",
    "Create a book reading list",
    "Design a business card"
  ],
  "REFLECT": [
    "Journal for 3 minutes",
    "Write 3 things you're grateful for",
    "Plan tomorrow's top 3 tasks",
    "Identify what distracted you today",
    "Review your top achievements this week",
    "Write down one fear and break it logically",
    "Ask: 'What is one thing I must improve tomorrow?'",
    "Rate today's productivity from 1–10",
    "Write a micro-journal: 'How did I use my time?'",
    "Write one thing that made you feel proud today",
    "Set a daily intention for tomorrow",
    "Reflect on one mistake & what you learned",
    "Ask yourself: 'Why do I want to succeed?'",
    "Write a 3-line summary of your day",
    "Note one improvement for your morning routine",
    "List 5 things that make you happy",
    "Reflect on your biggest strength today",
    "Write about a challenge you overcame",
    "Think about someone who inspired you",
    "Reflect on your progress this month",
    "Write about your ideal day",
    "Think about what you're most excited about",
    "Reflect on how you helped someone today",
    "Write about a lesson you learned recently",
    "Think about what makes you unique",
    "Reflect on your core values",
    "Write about your biggest dream",
    "Think about what you're most grateful for",
    "Reflect on how you've grown this year",
    "Write about what motivates you most"
  ],
  "CAREER": [
    "Search for 3 internships",
    "Read one job description fully",
    "Update your LinkedIn headline",
    "Add a new project to your resume",
    "Practice 3 HR interview questions",
    "Note 5 skills required for your dream role",
    "Watch a productivity/career video (5–10 min)",
    "Improve your resume formatting",
    "Apply to 1 internship or job",
    "Study company case studies",
    "Create a list of companies you want to apply to",
    "Write a career vision paragraph",
    "Analyze one skill gap",
    "Clean your LinkedIn followers & feed",
    "Update your 'About Me' in portfolio",
    "Research salary ranges for your target role",
    "Practice elevator pitch for 5 minutes",
    "Connect with 3 professionals on LinkedIn",
    "Update your portfolio with recent work",
    "Research industry trends and news",
    "Practice common interview answers",
    "Write a cover letter template",
    "Research your target companies' culture",
    "Update your GitHub profile",
    "Practice technical interview questions",
    "Research networking events in your area",
    "Create a 30-60-90 day plan template",
    "Research certification requirements",
    "Update your professional bio",
    "Research mentors in your field"
  ],
  "DISCIPLINE": [
    "Avoid social media for 1 hour",
    "Follow your planned schedule strictly for 2 hours",
    "Drink 3–4 glasses of water",
    "Practice focus mode for 20 minutes",
    "Set phone away while working for 30 minutes",
    "Clean and organize your desk",
    "Meditate for 2 minutes",
    "Do a mini digital detox (10 min no phone)",
    "Fix a small problem immediately (no procrastination)",
    "Spend 5 minutes thinking about your long-term goals",
    "Do 10 pushups or stretches",
    "Take 5 deep breaths mindfully",
    "Organize your digital files for 10 minutes",
    "Practice good posture for 30 minutes",
    "Eat a healthy snack mindfully",
    "Take a 10-minute walk outside",
    "Practice saying 'no' to distractions",
    "Use a productivity technique (Pomodoro)",
    "Do a 5-minute brain dump",
    "Practice single-tasking for 25 minutes",
    "Turn off notifications for 1 hour",
    "Do a quick room cleanup (5 minutes)",
    "Practice mindful breathing",
    "Drink a glass of water before checking phone",
    "Do a quick gratitude practice",
    "Practice delayed gratification (wait before buying something)",
    "Do a 2-minute cold shower",
    "Practice waking up without snooze",
    "Do a quick digital detox check",
    "Practice eating without distractions"
  ],
  "LIFE_SKILLS": [
    "Clean or organize one section of your room",
    "Track your monthly spending",
    "Review your personal goals",
    "Learn one finance concept (very basic)",
    "Reply to pending emails/messages",
    "Practice basic first aid knowledge",
    "Learn a new cooking recipe",
    "Practice time management techniques",
    "Learn about personal insurance basics",
    "Practice negotiation skills",
    "Learn about investment basics",
    "Practice conflict resolution",
    "Learn about tax basics",
    "Practice active listening",
    "Learn about home maintenance basics",
    "Practice networking conversations",
    "Learn about credit scores",
    "Practice public speaking",
    "Learn about emergency preparedness",
    "Practice decision-making frameworks",
    "Learn about healthy meal planning",
    "Practice stress management techniques",
    "Learn about car maintenance basics",
    "Practice setting boundaries",
    "Learn about retirement planning basics",
    "Practice leadership skills",
    "Learn about digital privacy",
    "Practice critical thinking",
    "Learn about sustainable living",
    "Practice emotional regulation"
  ],
  "WELLNESS": [
    "Do 5 minutes of yoga or stretching",
    "Take 10 deep breaths with focus",
    "Drink an extra glass of water",
    "Do 20 jumping jacks or quick cardio",
    "Practice gratitude for 3 minutes",
    "Take a 10-minute nature walk",
    "Do a 5-minute meditation",
    "Practice good posture for 30 minutes",
    "Eat a piece of fruit mindfully",
    "Do some neck and shoulder rolls",
    "Practice the 20-20-20 rule (screen breaks)",
    "Do a quick body scan relaxation",
    "Practice belly breathing",
    "Do some light desk exercises",
    "Take a cold shower or splash face with cold water",
    "Practice progressive muscle relaxation",
    "Do a quick dance or movement break",
    "Practice mindful eating during next meal",
    "Do some eye exercises",
    "Take a power nap (10-20 minutes)",
    "Practice loving-kindness meditation",
    "Do some gentle spinal twists",
    "Practice forest bathing (if outdoors available)",
    "Do a digital sunset (no screens 1 hour before bed)",
    "Practice box breathing (4-4-4-4)",
    "Do some ankle and wrist rotations",
    "Practice smiling meditation",
    "Take vitamin D (go outside for 10 minutes)",
    "Practice mindful walking",
    "Do a quick self-massage (neck, hands, feet)"
  ],
  "SOCIAL": [
    "Call a family member or friend",
    "Send a thoughtful text to someone",
    "Compliment a stranger genuinely",
    "Practice active listening in next conversation",
    "Write a thank you note to someone",
    "Reach out to an old friend",
    "Practice asking better questions",
    "Share something positive on social media",
    "Help someone with a small task",
    "Practice empathy in difficult conversation",
    "Join an online community related to your interests",
    "Give constructive feedback to someone",
    "Practice being fully present in conversations",
    "Offer to help a colleague or classmate",
    "Practice expressing appreciation",
    "Network with someone new",
    "Practice conflict resolution skills",
    "Be a good listener to someone today",
    "Practice asking for help when needed",
    "Share knowledge or teach someone something",
    "Practice setting healthy boundaries",
    "Show interest in someone else's hobbies",
    "Practice forgiveness (yourself or others)",
    "Be supportive to someone going through difficulties",
    "Practice cultural curiosity and learning",
    "Volunteer for a cause you care about",
    "Practice inclusive language and behavior",
    "Mentor someone in an area you're good at",
    "Practice building trust through consistency",
    "Create or strengthen a professional relationship"
  ]
};

/* ----- Generate 3 random tasks from each category ----- */
export function generateDailyTasks() {
  const result = {};
  
  Object.keys(TASK_BANK).forEach(category => {
    const tasks = TASK_BANK[category];
    const shuffled = [...tasks].sort(() => Math.random() - 0.5);
    result[category] = shuffled.slice(0, 3);
  });
  
  return result;
}

/* ----- Get a specific number of tasks from a category ----- */
export function getTasksFromCategory(category, count = 3) {
  const tasks = TASK_BANK[category.toUpperCase()];
  if (!tasks) return [];
  
  const shuffled = [...tasks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* ----- Get all available categories ----- */
export function getTaskCategories() {
  return Object.keys(TASK_BANK);
}

/* ----- Save generated tasks for a specific date ----- */
export async function saveGeneratedTasks(generatedTasks, dateKey = todayId()) {
  const ref = await ensureDaily(dateKey);
  await updateDoc(ref, {
    generatedTasks: generatedTasks,
    tasksGeneratedAt: serverTimestamp()
  });
}

/* ----- Get generated tasks for a specific date ----- */
export async function getGeneratedTasks(dateKey = todayId()) {
  const ref = doc(db, "daily", dateKey);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) return null;
  
  const data = snap.data();
  return data.generatedTasks || null;
}

/* ----- Helper to format date for display ----- */
export function formatDateForDisplay(dateKey) {
  const date = new Date(dateKey + 'T12:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
