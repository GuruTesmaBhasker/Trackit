// test-sleep-analytics.js - Simple test script
import { saveSleepData, getRecentSleepSeries, todayId } from './database.js';

// Test function to verify sleep analytics
export async function testSleepAnalytics() {
    console.log("🧪 Testing sleep analytics...");
    
    try {
        // Test 1: Save some test sleep data
        console.log("1. Testing saveSleepData with analytics fields...");
        await saveSleepData({
            sleptAt: "2025-11-14T23:30", // 11:30 PM
            wakeUpAt: "2025-11-15T07:15", // 7:15 AM
            dateKey: todayId()
        });
        console.log("✅ Sleep data saved successfully");
        
        // Test 2: Get recent sleep series
        console.log("2. Testing getRecentSleepSeries...");
        const sleepSeries = await getRecentSleepSeries(7);
        console.log("✅ Sleep series retrieved:", sleepSeries);
        
        // Test 3: Verify data structure
        const todayData = sleepSeries.find(d => d.date === todayId());
        if (todayData && todayData.minutes !== null && todayData.sleptMin !== null && todayData.wakeMin !== null) {
            console.log("✅ Analytics fields present:", {
                minutes: todayData.minutes,
                sleptMin: todayData.sleptMin, // Should be 1410 (23:30 = 23*60 + 30)
                wakeMin: todayData.wakeMin   // Should be 435 (7:15 = 7*60 + 15)
            });
            
            // Verify calculations
            if (todayData.sleptMin === 1410 && todayData.wakeMin === 435) {
                console.log("✅ Minutes since midnight calculated correctly");
            } else {
                console.log("❌ Minutes since midnight calculation error");
            }
            
            // Verify duration (should handle cross-midnight correctly)
            const expectedDuration = (435 + 1440) - 1410; // 465 minutes = 7h 45m
            if (Math.abs(todayData.minutes - expectedDuration) < 5) {
                console.log("✅ Cross-midnight duration calculated correctly");
            } else {
                console.log("❌ Duration calculation error. Expected ~465 minutes, got:", todayData.minutes);
            }
        } else {
            console.log("❌ Analytics fields missing in today's data");
        }
        
        console.log("🎉 Sleep analytics test complete!");
        return true;
        
    } catch (error) {
        console.error("❌ Sleep analytics test failed:", error);
        return false;
    }
}

// Make available globally for console testing
window.testSleepAnalytics = testSleepAnalytics;