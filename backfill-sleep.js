// backfill-sleep.js - One-time script to add sleptMin/wakeMin to existing sleep data
import { db } from './database.js';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Backfill existing sleep documents with sleptMin and wakeMin
export async function backfillSleepData() {
  console.log("Starting sleep data backfill...");
  let processedCount = 0;
  let updatedCount = 0;
  
  try {
    const dailySnap = await getDocs(collection(db, "daily"));
    
    for (const d of dailySnap.docs) {
      const dateKey = d.id;
      const data = d.data();
      
      if (!data?.sleep) continue;
      
      processedCount++;
      
      // Skip if sleptMin and wakeMin already exist
      if (data.sleep.sleptMin !== undefined && data.sleep.wakeMin !== undefined) {
        console.log(`Skipping ${dateKey} - already has minute data`);
        continue;
      }

      const sleptAt = data.sleep.sleptAt?.toDate ? data.sleep.sleptAt.toDate() : new Date(data.sleep.sleptAt);
      const wakeAt  = data.sleep.wakeUpAt?.toDate ? data.sleep.wakeUpAt.toDate() : new Date(data.sleep.wakeUpAt);

      const sleptMin = sleptAt && !isNaN(sleptAt) ? (sleptAt.getHours() * 60 + sleptAt.getMinutes()) : null;
      const wakeMin  = wakeAt && !isNaN(wakeAt) ? (wakeAt.getHours() * 60 + wakeAt.getMinutes()) : null;
      
      let mins = data.sleep.minutes;
      if (!mins && sleptAt && wakeAt && !isNaN(sleptAt) && !isNaN(wakeAt)) {
        mins = Math.round((wakeAt.getTime() - sleptAt.getTime()) / 60000);
        if (mins < 0) mins += 24 * 60; // handle sleep across midnight
      }

      await updateDoc(doc(db, "daily", dateKey), {
        "sleep.sleptMin": sleptMin,
        "sleep.wakeMin": wakeMin,
        "sleep.minutes": mins
      });
      
      updatedCount++;
      console.log(`Updated ${dateKey}:`, { sleptMin, wakeMin, minutes: mins });
    }
    
    console.log(`Sleep data backfill complete: ${updatedCount} documents updated out of ${processedCount} processed`);
    return { processed: processedCount, updated: updatedCount };
    
  } catch (error) {
    console.error("Error during sleep data backfill:", error);
    throw error;
  }
}

// Function to run backfill from browser console
window.backfillSleepData = backfillSleepData;