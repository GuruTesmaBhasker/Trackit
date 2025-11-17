// analytics.js - Custom analytics for productivity tracking
import { db, todayId, getDay } from "./database.js";

// ---- Helper Functions (Data Fetching Logic Remains the Same) ----

// Get sleep data for the last 7 days
async function getLast7DaysSleepData() {
  const results = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = todayId(d);
    
    try {
      const dayData = await getDay(key);
      const sleepMinutes = dayData?.sleep?.minutes || 0;
      const sleepHours = sleepMinutes > 0 ? (sleepMinutes / 60).toFixed(1) : 0;
      
      results.push({
        date: key,
        minutes: sleepMinutes,
        hours: parseFloat(sleepHours),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }) // Shortened label for cleaner look
      });
    } catch (error) {
      const demoHours = 6 + Math.random() * 3;
      results.push({
        date: key,
        minutes: Math.round(demoHours * 60),
        hours: parseFloat(demoHours.toFixed(1)),
        label: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
  }
  
  const hasData = results.some(r => r.hours > 0);
  if (!hasData) {
    return results.map((r) => ({
      ...r,
      hours: parseFloat((7 + Math.random() * 2).toFixed(1)),
      minutes: Math.round((7 + Math.random() * 2) * 60)
    }));
  }
  
  return results;
}

// Get today's productivity breakdown
async function getTodayProductivityBreakdown() {
  try {
    const todayData = await getDay();
    if (!todayData || !todayData.activities) {
      return { productive: 180, neutral: 240, waste: 120 };
    }
    
    const totals = { productive: 0, neutral: 0, waste: 0 };
    
    todayData.activities.forEach(activity => {
      const minutes = activity.minutes || 0;
      const category = (activity.category || "neutral").toLowerCase();
      
      if (category === "productive") totals.productive += minutes;
      else if (category === "waste") totals.waste += minutes;
      else totals.neutral += minutes;
    });
    
    const hasData = totals.productive + totals.neutral + totals.waste > 0;
    if (!hasData) return { productive: 180, neutral: 240, waste: 120 };
    
    return totals;
  } catch (error) {
    return { productive: 180, neutral: 240, waste: 120 };
  }
}

// Get last 7 days productivity trends
async function getLast7DaysProductivityTrends() {
  const results = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = todayId(d);
    
    try {
      const dayData = await getDay(key);
      let totals = { productive: 0, neutral: 0, waste: 0 };
      
      if (dayData && dayData.activities) {
        dayData.activities.forEach(activity => {
          const minutes = activity.minutes || 0;
          const category = (activity.category || "neutral").toLowerCase();
          
          if (category === "productive") totals.productive += minutes;
          else if (category === "waste") totals.waste += minutes;
          else totals.neutral += minutes;
        });
      }
      
      results.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        ...totals
      });
    } catch (error) {
      results.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        productive: 0, neutral: 0, waste: 0
      });
    }
  }
  
  return results;
}

const commonOptions = {
  color: '#a0a6b0', // Matches --color-text-secondary
  font: {
    family: "'Inter', sans-serif", // Keeping Inter for data labels
    size: 12 // Slightly larger font size
  },
  gridColor: 'rgba(255, 255, 255, 0.05)' // Slightly more visible grid
};

// ---- Chart Variables ----
let sleepBarChart = null;
let dailyProductivityChart = null;
let productivityTrendsChart = null;
let todayActivityChart = null;

// ---- Main Render Function ----
export async function renderAnalytics() {
  if (typeof Chart === 'undefined') return;
  
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#a0a6b0"; // Matches --color-text-secondary
    Chart.defaults.scale.grid.color = "transparent";
    Chart.defaults.elements.bar.borderColor = 'transparent'; // No bar border
  
  await renderSleepBarChart();
  await renderTodayActivityChart();
  await renderDailyProductivityChart();
  await renderProductivityTrendsChart();
}

window.renderAnalytics = renderAnalytics;

// ---- Individual Chart Renderers ----

// 1. Sleep Bar Chart - CLEAN & NEON
async function renderSleepBarChart() {
  const sleepData = await getLast7DaysSleepData();
  const canvas = document.getElementById("sleepBarChart");
  if (!canvas) return;
  if (sleepBarChart) sleepBarChart.destroy();

  const ctx = canvas.getContext("2d");
  
  // Neon Blue Gradient
  const gradient = ctx.createLinearGradient(0, 400, 0, 0);
  gradient.addColorStop(0, 'rgba(79, 172, 254, 0.1)');
  gradient.addColorStop(1, '#4facfe');

  sleepBarChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sleepData.map(d => d.label),
      datasets: [{
        label: "Sleep Hours",
        data: sleepData.map(d => d.hours),
        backgroundColor: gradient,
        borderRadius: 6, // Rounded tops
        borderSkipped: false,
        barThickness: 20, // Slimmer bars
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // Hide legend for cleaner look
        tooltip: {
          backgroundColor: '#1e222d',
          titleColor: '#fff',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.raw} Hours`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: commonOptions.gridColor,
            drawBorder: false,
          },
          ticks: { color: commonOptions.color }
        },
        x: {
          grid: { display: false },
          ticks: { color: commonOptions.color }
        }
      }
    }
  });
}

// 2. Today's Activity Breakdown (Doughnut) - THIN & MODERN
async function renderTodayActivityChart() {
  const todayData = await getTodayProductivityBreakdown();
  const canvas = document.getElementById("activityCircle");
  if (!canvas) return;
  if (todayActivityChart) todayActivityChart.destroy();

  todayActivityChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Productive", "Neutral", "Waste"],
      datasets: [{
        data: [todayData.productive, todayData.neutral, todayData.waste],
        backgroundColor: [
          '#00ff80', // Neon Green (var(--color-accent-green))
          '#5c626e', // Darker Neutral (var(--color-text-tertiary))
          '#ff3366'  // Neon Red (var(--color-accent-red))
        ],
        borderColor: '#12141c', // Matches new glass background (var(--color-bg-secondary))
        borderWidth: 4,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%', // Thinner ring
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            color: '#cbd5e1'
          }
        }
      }
    }
  });
}

// 3. Daily Productivity (Pie) - CLEAN
async function renderDailyProductivityChart() {
  const todayData = await getTodayProductivityBreakdown();
  const canvas = document.getElementById("dailyProductivityChart");
  if (!canvas) return;
  if (dailyProductivityChart) dailyProductivityChart.destroy();

  dailyProductivityChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: ["Productive", "Neutral", "Waste"],
      datasets: [{
        data: [todayData.productive, todayData.neutral, todayData.waste],
        backgroundColor: [
          '#00ff80', // Neon Green (var(--color-accent-green))
          '#5c626e', // Darker Neutral (var(--color-text-tertiary))
          '#ff3366'  // Neon Red (var(--color-accent-red))
        ],
        borderColor: '#12141c', // Matches new glass background (var(--color-bg-secondary))
        borderWidth: 4
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
            pointStyle: 'circle',
            padding: 20,
            color: '#cbd5e1'
          }
        }
      }
    }
  });
}

// 4. Trends (Stacked Bar) - ROUNDED & MINIMAL
async function renderProductivityTrendsChart() {
  const trendsData = await getLast7DaysProductivityTrends();
  const canvas = document.getElementById("productivityTrendsChart");
  if (!canvas) return;
  if (productivityTrendsChart) productivityTrendsChart.destroy();

  const ctx = canvas.getContext("2d");

  productivityTrendsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: trendsData.map(d => d.label),
      datasets: [
        {
          label: "Productive",
          data: trendsData.map(d => d.productive),
          backgroundColor: '#00ff80', // Neon Green (var(--color-accent-green))
          borderRadius: 4,
        },
        {
          label: "Neutral",
          data: trendsData.map(d => d.neutral),
          backgroundColor: '#5c626e', // Darker Neutral (var(--color-text-tertiary))
          borderRadius: 4,
        },
        {
          label: "Waste",
          data: trendsData.map(d => d.waste),
          backgroundColor: '#ff3366', // Neon Red (var(--color-accent-red))
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: commonOptions.color }
        },
        y: {
          stacked: true,
          grid: { 
            color: commonOptions.gridColor,
            drawBorder: false
          },
          ticks: { color: commonOptions.color }
        }
      },
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            color: '#cbd5e1'
          }
        }
      }
    }
  });
}