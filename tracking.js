import { getCurrentUser, getDay, saveDailyData } from './database.js';

class ActivityTracker {
    constructor() {
        this.currentDate = new Date();
        this.sleepChart = null;
        this.activityChart = null;
        this.energyChart = null;
        this.dailyData = null;
        
        this.init();
    }

    async init() {
        this.updateDateTime();
        await this.loadUserData();
        this.setupCharts();
        this.renderActivities();
        this.setupEventListeners();
    }

    updateDateTime() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateStr = this.currentDate.toLocaleDateString('en-US', options);
        document.getElementById('currentDate').textContent = dateStr;
        
        // Update user name if available
        const user = getCurrentUser();
        if (user && user.displayName) {
            document.getElementById('userName').textContent = user.displayName;
        }
    }

    async loadUserData() {
        const today = this.currentDate.toISOString().split('T')[0];
        try {
            this.dailyData = await getDay(today);
            console.log('Loaded daily data:', this.dailyData);
        } catch (error) {
            console.error('Error loading daily data:', error);
            this.dailyData = {};
        }
    }

    setupCharts() {
        this.createSleepChart();
        this.createActivityChart();
        this.createEnergyChart();
    }

    createSleepChart() {
        const ctx = document.getElementById('sleepChart').getContext('2d');
        
        // Calculate sleep duration
        let sleepHours = 0;
        let sleepLabel = 'No Data';
        
        if (this.dailyData?.sleep?.sleptAt && this.dailyData?.sleep?.wakeUpAt) {
            const sleptTime = new Date(this.dailyData.sleep.sleptAt);
            const wakeTime = new Date(this.dailyData.sleep.wakeUpAt);
            
            let duration = wakeTime - sleptTime;
            if (duration < 0) {
                duration += 24 * 60 * 60 * 1000; // Add 24 hours if sleep crossed midnight
            }
            
            sleepHours = duration / (1000 * 60 * 60);
            const hours = Math.floor(sleepHours);
            const minutes = Math.round((sleepHours - hours) * 60);
            
            document.getElementById('sleepDuration').textContent = `${hours}h ${minutes}m`;
            
            // Determine sleep quality
            if (sleepHours >= 7 && sleepHours <= 9) {
                sleepLabel = 'Optimal';
            } else if (sleepHours >= 6) {
                sleepLabel = 'Good';
            } else {
                sleepLabel = 'Poor';
            }
        }

        const sleepPercentage = Math.min((sleepHours / 8) * 100, 100); // 8 hours as ideal

        this.sleepChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [sleepPercentage, 100 - sleepPercentage],
                    backgroundColor: ['#2196F3', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });

        // Update label
        const chartLabel = document.querySelector('.sleep-chart .chart-label');
        if (chartLabel) {
            chartLabel.textContent = sleepLabel;
        }
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        // Calculate total activity time from morning routine
        let totalActivityMinutes = 0;
        let activityLabel = 'Active';
        
        if (this.dailyData?.routine) {
            this.dailyData.routine.forEach(activity => {
                if (activity.start && activity.end) {
                    const start = new Date(`1970-01-01T${activity.start}:00`);
                    const end = new Date(`1970-01-01T${activity.end}:00`);
                    const duration = (end - start) / (1000 * 60); // Convert to minutes
                    if (duration > 0) {
                        totalActivityMinutes += duration;
                    }
                }
            });
        }

        const hours = Math.floor(totalActivityMinutes / 60);
        const minutes = Math.round(totalActivityMinutes % 60);
        document.getElementById('activityDuration').textContent = `${hours}h ${minutes}m`;

        const activityPercentage = Math.min((totalActivityMinutes / 180) * 100, 100); // 3 hours as target

        this.activityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [activityPercentage, 100 - activityPercentage],
                    backgroundColor: ['#4CAF50', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });
    }

    createEnergyChart() {
        const ctx = document.getElementById('energyChart').getContext('2d');
        
        // Sample energy data - in a real app, this would come from user input
        const energyData = [
            { time: '6h', value: 20 },
            { time: '9h', value: 80 },
            { time: '12h', value: 60 },
            { time: '15h', value: 40 },
            { time: '18h', value: 70 },
            { time: '21h', value: 30 }
        ];

        this.energyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: energyData.map(d => d.time),
                datasets: [{
                    data: energyData.map(d => d.value),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        min: 0,
                        max: 100
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    renderActivities() {
        const activitiesContainer = document.getElementById('dynamicActivities');
        activitiesContainer.innerHTML = '';

        if (this.dailyData?.routine) {
            this.dailyData.routine.forEach((activity, index) => {
                if (activity.activity && activity.start && activity.end) {
                    const activityElement = this.createActivityBlock(
                        activity.start,
                        activity.end,
                        activity.activity,
                        this.categorizeActivity(activity.activity),
                        true // Mark as completed since it's from routine data
                    );
                    activitiesContainer.appendChild(activityElement);
                }
            });
        }

        // Add stats section
        this.renderStats();
    }

    createActivityBlock(startTime, endTime, activityName, category = 'general', completed = false) {
        const block = document.createElement('div');
        block.className = `activity-block ${category} ${completed ? 'completed' : ''}`;
        
        // Calculate duration
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        const duration = (end - start) / (1000 * 60); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = Math.round(duration % 60);
        
        let durationText = '';
        if (hours > 0) {
            durationText = `${hours}h ${minutes}m`;
        } else {
            durationText = `${minutes}m`;
        }

        block.innerHTML = `
            <div class="time-slot">${this.formatTime(startTime)} - ${this.formatTime(endTime)}</div>
            <div class="activity-content">
                <div class="checkmark">${completed ? '✅' : '⏳'}</div>
                <div class="activity-info">
                    <div class="activity-name">${activityName}</div>
                    <div class="activity-subtitle">Duration: ${durationText}</div>
                </div>
            </div>
        `;

        return block;
    }

    categorizeActivity(activityName) {
        const activity = activityName.toLowerCase();
        
        if (activity.includes('game') || activity.includes('gaming') || activity.includes('play')) {
            return 'gaming';
        } else if (activity.includes('work') || activity.includes('study') || activity.includes('meeting')) {
            return 'work';
        } else if (activity.includes('exercise') || activity.includes('workout') || activity.includes('run') || activity.includes('gym')) {
            return 'exercise';
        }
        
        return 'general';
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }

    renderStats() {
        // Add statistics section if it doesn't exist
        let statsSection = document.querySelector('.stats-section');
        if (!statsSection) {
            statsSection = document.createElement('section');
            statsSection.className = 'stats-section';
            statsSection.innerHTML = `
                <h2>Daily Statistics</h2>
                <div class="stats-grid" id="statsGrid"></div>
            `;
            document.querySelector('.left-column').appendChild(statsSection);
        }

        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = '';

        // Calculate various statistics
        const stats = this.calculateStats();
        
        Object.entries(stats).forEach(([label, value]) => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card fade-in';
            statCard.innerHTML = `
                <span class="stat-value">${value}</span>
                <span class="stat-label">${label}</span>
            `;
            statsGrid.appendChild(statCard);
        });
    }

    calculateStats() {
        const stats = {};
        
        // Total activities
        const totalActivities = this.dailyData?.routine?.length || 0;
        stats['Activities'] = totalActivities;
        
        // Total active time
        let totalMinutes = 0;
        if (this.dailyData?.routine) {
            this.dailyData.routine.forEach(activity => {
                if (activity.start && activity.end) {
                    const start = new Date(`1970-01-01T${activity.start}:00`);
                    const end = new Date(`1970-01-01T${activity.end}:00`);
                    const duration = (end - start) / (1000 * 60);
                    if (duration > 0) {
                        totalMinutes += duration;
                    }
                }
            });
        }
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        stats['Active Time'] = `${hours}h ${minutes}m`;
        
        // Tasks completed
        const completedTasks = this.dailyData?.tasks ? 
            Object.values(this.dailyData.tasks).filter(task => task.completed).length : 0;
        stats['Tasks Done'] = completedTasks;
        
        // Focus score (if available)
        const focusScore = this.dailyData?.reflection?.focused === 'yes' ? '100%' : '0%';
        stats['Focus Score'] = focusScore;
        
        return stats;
    }

    setupEventListeners() {
        // Add any interactive functionality here
        console.log('Activity Tracker initialized successfully');
    }
}

// Initialize the tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ActivityTracker();
});