// analytics.js - Updated to work with actual database structure
import { db, todayId, getDay } from "./database.js";

// ---- helpers ----

// Get today's activities from the actual subcollection structure
async function getTodayActivities() {
  try {
    console.log("Fetching today's activities...");
    const todayData = await getDay(); // This already includes activities subcollection
    console.log("Today's data:", todayData);
    
    if (!todayData || !todayData.activities) {
      console.log("No activities found for today");
      return [];
    }
    
    console.log("Found activities:", todayData.activities);
    return todayData.activities;
  } catch (error) {
    console.error("Error fetching today's activities:", error);
    return [];
  }
}

// Calculate category totals from activities array
function calculateCategoryTotals(activities) {
  const totals = { productive: 0, neutral: 0, waste: 0 };
  
  activities.forEach(activity => {
    const minutes = activity.minutes || 0;
    const category = (activity.category || "neutral").toLowerCase();
    
    if (category === "productive") totals.productive += minutes;
    else if (category === "waste") totals.waste += minutes;
    else totals.neutral += minutes;
  });
  
  console.log("Category totals:", totals);
  return totals;
}

// Get category data for multiple days
async function getCategorySeries(days = 7) {
  const results = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = todayId(d);
    
    try {
      const dayData = await getDay(key);
      let totals = { productive: 0, neutral: 0, waste: 0 };
      
      if (dayData && dayData.activities) {
        totals = calculateCategoryTotals(dayData.activities);
      }
      
      results.push({ date: key, ...totals });
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error);
      results.push({ date: key, productive: 0, neutral: 0, waste: 0 });
    }
  }
  
  console.log("Category series:", results);
  return results;
}

// Utility: convert minutes -> hours (1 decimal)
function toHours(mins) {
  if (mins == null) return 0;
  return Math.round((mins / 60) * 10) / 10;
}

// ---- Chart renderers ----

let activityChart = null;
let categoryChart = null;
let isRendering = false; // Guard to prevent multiple executions

export async function renderAnalytics() {
  if (isRendering) {
    console.log("Analytics already rendering, skipping...");
    return;
  }
  
  isRendering = true;
  console.log("=== Starting analytics render ===");
  
  try {
    // Simple DOM ready check without event listeners
    if (document.readyState !== 'complete') {
      console.log("DOM not ready, waiting...");
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 1) Today's Activity Donut Chart
    console.log("1. Rendering today's activity breakdown...");
    const todayActivities = await getTodayActivities();
    const todayTotals = calculateCategoryTotals(todayActivities);
    
    const activityCanvas = document.getElementById("activityCircle");
    if (activityCanvas) {
      const activityCtx = activityCanvas.getContext("2d");

      const donutLabels = ["Productive", "Neutral", "Waste"];
      const donutData = [todayTotals.productive || 0, todayTotals.neutral || 0, todayTotals.waste || 0];

      console.log("Activity donut data:", { labels: donutLabels, data: donutData });

      if (activityChart) {
        activityChart.destroy();
        activityChart = null;
      }
      
      activityChart = new Chart(activityCtx, {
        type: "doughnut",
        data: {
          labels: donutLabels,
          datasets: [{
            data: donutData,
            backgroundColor: ["#3ecf8e", "#9aa0a6", "#ff6b6b"], // green / gray / red
            borderWidth: 0
          }]
        },
        options: {
          plugins: {
            legend: { 
              position: "bottom",
              labels: { color: "#cccccc" }
            },
            tooltip: { 
              callbacks: { 
                label: ctx => `${ctx.label}: ${ctx.formattedValue} min (${toHours(+ctx.raw)} h)` 
              } 
            }
          },
          cutout: "60%",
          maintainAspectRatio: false
        }
      });
      console.log("✅ Activity donut chart rendered");
    } else {
      console.warn("❌ Activity circle canvas not found");
    }

    // 2) Category Stacked Bar Chart (last 7 days)
    console.log("3. Rendering category bar chart...");
    const catSeries = await getCategorySeries(7);
    
    const catLabels = catSeries.map(s => s.date.slice(5)); // "MM-DD" format
    const productiveData = catSeries.map(s => s.productive || 0);
    const neutralData = catSeries.map(s => s.neutral || 0);
    const wasteData = catSeries.map(s => s.waste || 0);

    console.log("Category chart data:", { 
      labels: catLabels, 
      productive: productiveData, 
      neutral: neutralData, 
      waste: wasteData 
    });

    const catCanvas = document.getElementById("categoryBar");
    if (catCanvas) {
      const catCtx = catCanvas.getContext("2d");
      if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
      }
      
      categoryChart = new Chart(catCtx, {
        type: "bar",
        data: {
          labels: catLabels,
          datasets: [
            { 
              label: "Productive (min)", 
              data: productiveData, 
              stack: "stack1", 
              backgroundColor: "#3ecf8e" 
            },
            { 
              label: "Neutral (min)", 
              data: neutralData, 
              stack: "stack1", 
              backgroundColor: "#9aa0a6" 
            },
            { 
              label: "Waste (min)", 
              data: wasteData, 
              stack: "stack1", 
              backgroundColor: "#ff6b6b" 
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} min`
              }
            },
            legend: { 
              position: "bottom",
              labels: { color: "#cccccc" }
            }
          },
          responsive: true,
          scales: {
            x: { 
              stacked: true,
              ticks: { color: "#888" },
              grid: { color: "rgba(255, 255, 255, 0.1)" }
            },
            y: { 
              stacked: true, 
              title: { display: true, text: "Minutes", color: "#cccccc" },
              ticks: { color: "#888" },
              grid: { color: "rgba(255, 255, 255, 0.1)" }
            }
          }
        }
      });
      console.log("✅ Category bar chart rendered");
    } else {
      console.warn("❌ Category bar canvas not found");
    }

    console.log("🎉 All analytics rendered successfully!");
    
    // Print data summary
    const totalToday = todayTotals.productive + todayTotals.neutral + todayTotals.waste;
    console.log(`📊 Today's Summary: ${totalToday} total minutes (${toHours(totalToday)} hours)`);
    console.log(`   - Productive: ${todayTotals.productive}min (${toHours(todayTotals.productive)}h)`);
    console.log(`   - Neutral: ${todayTotals.neutral}min (${toHours(todayTotals.neutral)}h)`);
    console.log(`   - Waste: ${todayTotals.waste}min (${toHours(todayTotals.waste)}h)`);
    
  } catch (error) {
    console.error("💥 Analytics render error:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    isRendering = false; // Reset guard
  }
}