// firebase.service.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, collection,
  updateDoc, serverTimestamp, getDocs, query, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

/* Firebase config */
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

/* Helper functions */
export function todayId(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

/* Auth ready */
export function onUserReady(cb) {
  onAuthStateChanged(auth, (user) => cb(user || null));
}

/* Get current user */
export function getCurrentUser() {
  return auth.currentUser;
}

/* Task Bank System */
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

/* Task generation functions */
export function generateDailyTasks() {
  const result = {};
  
  Object.keys(TASK_BANK).forEach(category => {
    const tasks = TASK_BANK[category];
    const shuffled = [...tasks].sort(() => Math.random() - 0.5);
    result[category] = shuffled.slice(0, 3);
  });
  
  return result;
}

export function getTasksFromCategory(category, count = 3) {
  const tasks = TASK_BANK[category.toUpperCase()];
  if (!tasks) return [];
  
  const shuffled = [...tasks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getTaskCategories() {
  return Object.keys(TASK_BANK);
}

/* To-Do List Firebase Functions */
export async function saveTodoList(userId, dateKey, todos) {
  const ref = doc(db, `users/${userId}/todos`, dateKey);
  await setDoc(ref, {
    todos: Array.isArray(todos) ? todos : [],
    updatedAt: serverTimestamp()
  });
}

export async function getTodoList(userId, dateKey) {
  const ref = doc(db, `users/${userId}/todos`, dateKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data();
  return Array.isArray(data.todos) ? data.todos : [];
}

export async function getHistoryData(userId, days = 5) {
  const history = [];
  const today = new Date();
  
  // First try to get data from date-wise storage
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = todayId(date);
    
    let todos = await getTodoList(userId, dateKey);
    
    // If no date-wise data found, try to get from the old collection and migrate
    if (todos.length === 0 && i > 0) {
      todos = await migrateTodosForDate(userId, date);
    }
    
    const completedTodos = todos.filter(todo => todo.completed);
    const incompleteTodos = todos.filter(todo => !todo.completed);
    
    history.push({
      date,
      dateKey,
      displayName: i === 0 ? 'TODAY' : i === 1 ? 'YESTERDAY' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
      todos: todos, // All todos
      completedTodos,
      incompleteTodos,
      totalCount: todos.length,
      completedCount: completedTodos.length
    });
  }
  
  return history;
}

async function migrateTodosForDate(userId, targetDate) {
  try {
    // Get all todos from the old collection
    const todosRef = collection(db, `users/${userId}/todos`);
    const snapshot = await getDocs(todosRef);
    
    const targetDateStr = targetDate.toDateString();
    const todosForDate = [];
    
    snapshot.forEach((doc) => {
      const todo = doc.data();
      if (todo.createdAt) {
        let todoDate;
        
        // Handle both Firestore Timestamp and regular Date
        if (todo.createdAt.toDate) {
          todoDate = todo.createdAt.toDate();
        } else if (todo.createdAt instanceof Date) {
          todoDate = todo.createdAt;
        } else {
          todoDate = new Date(todo.createdAt);
        }
        
        // Check if this todo was created on the target date
        if (todoDate.toDateString() === targetDateStr) {
          todosForDate.push({
            text: todo.text || '',
            completed: todo.completed || false,
            createdAt: todoDate.toISOString()
          });
        }
      }
    });
    
    // If we found todos for this date, save them to the date-wise collection
    if (todosForDate.length > 0) {
      const dateKey = todayId(targetDate);
      await saveTodoList(userId, dateKey, todosForDate);
    }
    
    return todosForDate;
  } catch (error) {
    console.error("Error migrating todos for date: ", error);
    return [];
  }
}

// One-time migration function to organize all existing todos by date
export async function migrateAllTodos(userId) {
  try {
    console.log("Starting todo migration...");
    
    const todosRef = collection(db, `users/${userId}/todos`);
    const snapshot = await getDocs(todosRef);
    
    // Group todos by date
    const todosByDate = new Map();
    
    snapshot.forEach((doc) => {
      const todo = doc.data();
      if (todo.createdAt) {
        let todoDate;
        
        // Handle both Firestore Timestamp and regular Date
        if (todo.createdAt.toDate) {
          todoDate = todo.createdAt.toDate();
        } else if (todo.createdAt instanceof Date) {
          todoDate = todo.createdAt;
        } else {
          todoDate = new Date(todo.createdAt);
        }
        
        const dateKey = todayId(todoDate);
        
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, []);
        }
        
        todosByDate.get(dateKey).push({
          text: todo.text || '',
          completed: todo.completed || false,
          createdAt: todoDate.toISOString()
        });
      }
    });
    
    // Save each date's todos to the date-wise collection
    const promises = [];
    for (const [dateKey, todos] of todosByDate) {
      promises.push(saveTodoList(userId, dateKey, todos));
    }
    
    await Promise.all(promises);
    
    console.log(`Migration completed! Organized ${todosByDate.size} days of todos.`);
    return { success: true, daysProcessed: todosByDate.size };
    
  } catch (error) {
    console.error("Error migrating all todos: ", error);
    return { success: false, error: error.message };
  }
}
