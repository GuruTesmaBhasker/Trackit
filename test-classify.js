// test-classify.js - Unit tests for activity classification
import { classifyActivityLabel } from './classify.js';

// Test cases for verification
const testCases = [
    // Productive activities
    { label: "study python", expected: "productive" },
    { label: "coding project", expected: "productive" },
    { label: "read a book", expected: "productive" },
    { label: "exercise workout", expected: "productive" },
    { label: "practice guitar", expected: "productive" },
    { label: "deep work session", expected: "productive" },
    
    // Neutral activities
    { label: "breakfast", expected: "neutral" },
    { label: "lunch break", expected: "neutral" },
    { label: "shower", expected: "neutral" },
    { label: "commute to work", expected: "neutral" },
    { label: "walk in park", expected: "neutral" },
    { label: "planning day", expected: "neutral" },
    
    // Waste activities
    { label: "scroll instagram", expected: "waste" },
    { label: "youtube videos", expected: "waste" },
    { label: "gaming session", expected: "waste" },
    { label: "tiktok reels", expected: "waste" },
    { label: "social media browsing", expected: "waste" },
    { label: "netflix binge", expected: "waste" },
    
    // Edge cases
    { label: "", expected: "neutral" },
    { label: "random activity", expected: "neutral" },
    { label: "study for 2 hours", minutes: 120, expected: "productive" }
];

function runTests() {
    console.log("🧪 Running Activity Classification Tests...\n");
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const result = classifyActivityLabel(testCase.label, testCase.minutes || 0);
        const success = result === testCase.expected;
        
        if (success) {
            passed++;
            console.log(`✅ Test ${index + 1}: "${testCase.label}" → ${result}`);
        } else {
            failed++;
            console.log(`❌ Test ${index + 1}: "${testCase.label}" → Expected: ${testCase.expected}, Got: ${result}`);
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log("🎉 All tests passed! Classification working correctly.");
    } else {
        console.log("⚠️ Some tests failed. Review classification logic.");
    }
    
    return { passed, failed, total: testCases.length };
}

// Export for use in browser console or other scripts
if (typeof window !== 'undefined') {
    window.testClassification = runTests;
    console.log("🔧 Test function available as: window.testClassification()");
}

export { runTests as testClassification };