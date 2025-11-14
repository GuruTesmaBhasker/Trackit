// classify.js — category classifier for daily activities
export function classifyActivityLabel(label = "", minutes = 0) {
  if (!label) return "neutral";
  const s = label.toLowerCase();

  const productive = ["study","studying","learn","learning","practice","read","reading","focus","project","code","coding","sql","python","pandas","analysis","research","assignment","revise","review","deep work","homework","exercise","workout","gym","running","meditation","writing","work"];
  const neutral = ["breakfast","lunch","dinner","walk","walking","commute","planning","plan","meeting","call","chat","groceries","cook","cooking","shower","tea","coffee","break","nap","rest","sleep","wake up","brush","clean","organize","shopping"];
  const waste = ["scroll","scrolling","reel","reels","instagram","tiktok","youtube","game","gaming","play","playing","social","facebook","snapchat","idle","boredom","memes","shorts","video","videos","feed","browsing","tv","television","netflix","series"];

  // exact keyword match (word boundary)
  const wordMatch = (arr) => arr.some(k => new RegExp("\\b" + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "i").test(s));

  if (wordMatch(productive)) return "productive";
  if (wordMatch(waste)) return "waste";
  if (wordMatch(neutral)) return "neutral";

  // regex catch-alls
  if (/\b(scroll|reel|tiktok|instagram|shorts|youtube|video|gaming|netflix)\b/i.test(s)) return "waste";
  if (/\b(study|practice|project|work|coding|exercise|read|learning|research)\b/i.test(s)) return "productive";

  // heuristics
  if (minutes >= 60 && /\b(study|practice|project|work|code|coding|exercise|learning)\b/i.test(s)) return "productive";
  if (s.split(/\s+/).length <= 2 && /^(game|play|scroll|reel|tiktok|instagram)$/i.test(s.trim())) return "waste";

  // default
  return "neutral";
}

// Get category color for UI display
export function getCategoryColor(category) {
  switch (category) {
    case "productive": return "#4caf50";
    case "neutral": return "#757575";
    case "waste": return "#f44336";
    default: return "#757575";
  }
}

// Get category emoji for UI display
export function getCategoryEmoji(category) {
  switch (category) {
    case "productive": return "✅";
    case "neutral": return "⚪";
    case "waste": return "🔴";
    default: return "⚪";
  }
}

// Calculate category totals from activities array
export function calculateCategoryTotals(activities) {
  const totals = {
    productive: 0,
    neutral: 0,
    waste: 0
  };

  activities.forEach(activity => {
    if (activity.minutes && activity.category) {
      totals[activity.category] += activity.minutes;
    }
  });

  const total = totals.productive + totals.neutral + totals.waste;
  
  return {
    ...totals,
    total,
    productivePercentage: total > 0 ? Math.round((totals.productive / total) * 100) : 0,
    neutralPercentage: total > 0 ? Math.round((totals.neutral / total) * 100) : 0,
    wastePercentage: total > 0 ? Math.round((totals.waste / total) * 100) : 0
  };
}