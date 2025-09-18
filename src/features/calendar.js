// ========================================
// WORKOUT CALENDAR
// ========================================

// Global Variables
let currentCalendarDate = new Date();
let workoutData = JSON.parse(localStorage.getItem('workoutData')) || {};

// Initialize calendar
function initCalendar() {
    renderCalendar();
    updateStats();
    setupCalendarEventListeners();
}

// Render calendar for current month
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');
    
    // Add loading animation
    calendarGrid.style.opacity = '0.5';
    calendarGrid.style.transform = 'scale(0.95)';
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Set month/year display with animation
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthYear.style.opacity = '0';
    monthYear.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        monthYear.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
        monthYear.style.opacity = '1';
        monthYear.style.transform = 'translateY(0)';
        monthYear.style.transition = 'all 0.4s ease';
    }, 200);
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month with staggered animation
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day);
        dayElement.style.opacity = '0';
        dayElement.style.transform = 'translateY(20px) scale(0.8)';
        calendarGrid.appendChild(dayElement);
        
        // Staggered animation
        setTimeout(() => {
            dayElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            dayElement.style.opacity = '1';
            dayElement.style.transform = 'translateY(0) scale(1)';
        }, (day - 1) * 20 + 300);
    }
    
    // Add empty cells for days after month ends
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Restore grid animation
    setTimeout(() => {
        calendarGrid.style.opacity = '1';
        calendarGrid.style.transform = 'scale(1)';
        calendarGrid.style.transition = 'all 0.4s ease';
    }, 500);
}

// Create day element
function createDayElement(day) {
    const dayElement = document.createElement('div');
    const dateString = getDateString(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const isToday = isTodayDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const isWorkoutDay = workoutData[dateString];
    
    dayElement.className = 'calendar-day';
    if (isToday) dayElement.classList.add('today');
    if (isWorkoutDay) dayElement.classList.add('workout-day');
    
    // Create day content with better structure
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    
    dayElement.appendChild(dayNumber);
    
    // Add duration if workout day
    if (isWorkoutDay && isWorkoutDay.duration) {
        const durationElement = document.createElement('div');
        durationElement.className = 'day-duration';
        durationElement.textContent = isWorkoutDay.duration;
        dayElement.appendChild(durationElement);
    }
    
    // Add click event with ripple effect
    dayElement.addEventListener('click', (e) => {
        if (!dayElement.classList.contains('other-month')) {
            // Add ripple effect
            createRippleEffect(e, dayElement);
            
            // Open modal after a short delay
            setTimeout(() => {
                openDurationModal(dateString, isWorkoutDay);
            }, 150);
        }
    });
    
    return dayElement;
}

// Create ripple effect on click
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Get date string in YYYY-MM-DD format
function getDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Check if date is today
function isTodayDate(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
}

// Open duration modal
function openDurationModal(dateString, existingData) {
    const modal = document.getElementById('durationModal');
    const title = document.getElementById('durationModalTitle');
    const input = document.getElementById('durationInput');
    const removeBtn = document.getElementById('durationRemove');
    
    // Set title and input value
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    
    title.textContent = existingData ? `Edit Workout - ${dayName}, ${monthName} ${day}` : `Add Workout - ${dayName}, ${monthName} ${day}`;
    input.value = existingData ? (existingData.duration || '') : '';
    
    // Show/hide remove button
    removeBtn.style.display = existingData ? 'block' : 'none';
    
    // Show modal
    modal.classList.add('active');
    input.focus();
    
    // Store current date for modal actions
    modal.dataset.currentDate = dateString;
}

// Close duration modal
function closeDurationModal() {
    const modal = document.getElementById('durationModal');
    modal.classList.remove('active');
    modal.dataset.currentDate = '';
}

// Save workout duration
function saveWorkoutDuration() {
    const modal = document.getElementById('durationModal');
    const input = document.getElementById('durationInput');
    const dateString = modal.dataset.currentDate;
    const duration = input.value.trim();
    
    if (duration) {
        workoutData[dateString] = {
            duration: duration,
            timestamp: new Date().toISOString()
        };
    } else {
        // If no duration, just mark as workout day
        workoutData[dateString] = {
            duration: '',
            timestamp: new Date().toISOString()
        };
    }
    
    saveWorkoutData();
    renderCalendar();
    updateStats();
    closeDurationModal();
    
    showNotification('Workout saved!', 'success');
}

// Remove workout
function removeWorkout() {
    const modal = document.getElementById('durationModal');
    const dateString = modal.dataset.currentDate;
    
    if (confirm('Are you sure you want to remove this workout?')) {
        delete workoutData[dateString];
        saveWorkoutData();
        renderCalendar();
        updateStats();
        closeDurationModal();
        
        showNotification('Workout removed!', 'success');
    }
}

// Save workout data to localStorage
function saveWorkoutData() {
    localStorage.setItem('workoutData', JSON.stringify(workoutData));
}

// Update statistics
function updateStats() {
    const totalWorkouts = Object.keys(workoutData).length;
    const currentStreak = calculateCurrentStreak();
    const monthWorkouts = calculateMonthWorkouts();
    
    // Update values with animation
    animateNumber(document.getElementById('totalWorkouts'), totalWorkouts);
    animateNumber(document.getElementById('currentStreak'), currentStreak, ' days');
    animateNumber(document.getElementById('monthWorkouts'), monthWorkouts);
    
    // Update stats container layout dynamically
    updateStatsLayout(totalWorkouts, currentStreak, monthWorkouts);
}

// Animate number changes
function animateNumber(element, targetValue, suffix = '') {
    const currentValue = parseInt(element.textContent.replace(/\D/g, '')) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    const duration = 800;
    const stepTime = duration / Math.abs(targetValue - currentValue);
    
    if (currentValue === targetValue) return;
    
    let current = currentValue;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current + suffix;
        
        if (current === targetValue) {
            clearInterval(timer);
            element.classList.add('fade-in');
        }
    }, stepTime);
}

// Update stats layout based on available data
function updateStatsLayout(totalWorkouts, currentStreak, monthWorkouts) {
    const statsContainer = document.getElementById('statsContainer');
    const totalCard = document.getElementById('totalWorkoutsCard');
    const streakCard = document.getElementById('currentStreakCard');
    const monthCard = document.getElementById('monthWorkoutsCard');
    
    // Reset all cards
    [totalCard, streakCard, monthCard].forEach(card => {
        card.classList.remove('hidden', 'fade-in');
    });
    
    // Determine which cards to show
    const visibleCards = [];
    if (totalWorkouts > 0) visibleCards.push(totalCard);
    if (currentStreak > 0) visibleCards.push(streakCard);
    if (monthWorkouts > 0) visibleCards.push(monthCard);
    
    // If no data, show all cards with zero values
    if (visibleCards.length === 0) {
        visibleCards.push(totalCard, streakCard, monthCard);
    }
    
    // Hide cards with no data
    [totalCard, streakCard, monthCard].forEach(card => {
        if (!visibleCards.includes(card)) {
            card.classList.add('hidden');
        } else {
            card.classList.add('fade-in');
        }
    });
    
    // Update grid layout
    const visibleCount = visibleCards.length;
    statsContainer.className = `stats-grid cols-${Math.min(visibleCount, 3)} mb-8`;
    
    // Add staggered animation
    visibleCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animationDelay = `${index * 0.1}s`;
        }, 100);
    });
}

// Calculate current streak
function calculateCurrentStreak() {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) { // Check up to 1 year back
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = getDateString(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        
        if (workoutData[dateString]) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Calculate workouts this month
function calculateMonthWorkouts() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    let count = 0;
    
    for (let day = 1; day <= 31; day++) {
        const dateString = getDateString(year, month, day);
        if (workoutData[dateString]) {
            count++;
        }
    }
    
    return count;
}

// Navigate to previous month
function goToPreviousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
    updateStats();
}

// Navigate to next month
function goToNextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
    updateStats();
}

// Setup event listeners
function setupCalendarEventListeners() {
    // Month navigation
    document.getElementById('prevMonthBtn').addEventListener('click', goToPreviousMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', goToNextMonth);
    
    // Back button
    document.getElementById('backToHomeFromCalendar').addEventListener('click', () => {
        showPage('homePage');
    });
    
    // Duration modal
    document.getElementById('durationSave').addEventListener('click', saveWorkoutDuration);
    document.getElementById('durationRemove').addEventListener('click', removeWorkout);
    document.getElementById('durationCancel').addEventListener('click', closeDurationModal);
    
    // Close modal when clicking outside
    document.getElementById('durationModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeDurationModal();
        }
    });
    
    // Enter key in duration input
    document.getElementById('durationInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveWorkoutDuration();
        }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDurationModal();
        }
    });
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if calendar page exists
    if (document.getElementById('calendarPage')) {
        initCalendar();
    }
});

// Make functions globally available
window.initCalendar = initCalendar;
window.goToPreviousMonth = goToPreviousMonth;
window.goToNextMonth = goToNextMonth;
