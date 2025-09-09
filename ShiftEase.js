let workers = [];

// Add worker with enhanced UI feedback
function addWorker() {
    let input = document.getElementById('workerName');
    let name = input.value.trim();
    
    if (name) {
        if (workers.includes(name)) {
            showNotification('Worker already exists!', 'warning');
            return;
        }
        
        workers.push(name);
        input.value = '';
        renderWorkers();
        showNotification(`${name} added successfully!`, 'success');
    } else {
        showNotification('Please enter a worker name', 'error');
    }
}

// Enhanced worker list rendering
function renderWorkers() {
    let list = document.getElementById('workerList');
    list.innerHTML = '';
    
    if (workers.length === 0) {
        return; // CSS handles empty state
    }
    
    workers.forEach((worker, index) => {
        let div = document.createElement('div');
        div.className = 'worker-item fade-in';
        div.innerHTML = `
            <span class="worker-name">${worker}</span>
            <button class="btn btn-danger" onclick="removeWorker(${index})" title="Remove ${worker}">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        list.appendChild(div);
    });
}

// Remove worker with confirmation
function removeWorker(index) {
    const workerName = workers[index];
    if (confirm(`Are you sure you want to remove ${workerName}?`)) {
        workers.splice(index, 1);
        renderWorkers();
        showNotification(`${workerName} removed`, 'info');
    }
}

// Enhanced shift rendering with better UI
function renderShifts() {
    let shiftCount = parseInt(document.getElementById('shift').value);
    let container = document.getElementById('shiftsContainer');
    container.innerHTML = '';

    const defaultShifts = [
        { name: 'Morning', start: '08:00', end: '16:00' },
        { name: 'Afternoon', start: '16:00', end: '00:00' },
        { name: 'Night', start: '00:00', end: '08:00' },
        { name: 'Late Night', start: '22:00', end: '06:00' }
    ];

    for (let i = 0; i < shiftCount; i++) {
        let div = document.createElement('div');
        div.className = 'shift-card fade-in';
        
        const shift = defaultShifts[i] || { name: `Shift ${i + 1}`, start: '09:00', end: '17:00' };
        
        div.innerHTML = `
            <div class="shift-header">Shift ${i + 1}</div>
            <div class="shift-fields">
                <div>
                    <label for="shift${i}Label">Shift Name</label>
                    <input type="text" id="shift${i}Label" value="${shift.name}" placeholder="e.g., Morning Shift">
                </div>
                <div>
                    <label for="shift${i}Start">Start Time</label>
                    <input type="time" id="shift${i}Start" value="${shift.start}">
                </div>
                <div>
                    <label for="shift${i}End">End Time</label>
                    <input type="time" id="shift${i}End" value="${shift.end}">
                </div>
                <div>
                    <label for="shift${i}People">Staff Required</label>
                    <input type="number" id="shift${i}People" min="1" max="10" value="2">
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

// Enhanced schedule generation with better error handling
function generateSchedule() {
    // Validation
    if (workers.length === 0) {
        showNotification('Please add at least one worker before generating schedule', 'error');
        return;
    }

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.classList.add('loading');
    generateBtn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="animate-spin">
            <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M9.464 18.536l-2.828 2.828M18.536 15.364l-2.828-2.828M6.464 6.464L3.636 3.636"></path>
        </svg>
        Generating...
    `;

    // Simulate processing time for better UX
    setTimeout(() => {
        try {
            performScheduleGeneration();
            showNotification('Schedule generated successfully!', 'success');
        } catch (error) {
            showNotification('Error generating schedule. Please try again.', 'error');
            console.error('Schedule generation error:', error);
        } finally {
            generateBtn.classList.remove('loading');
            generateBtn.innerHTML = `
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Generate Schedule
            `;
        }
    }, 500);
}

function performScheduleGeneration() {
    // Get month and year from input
    let input = document.getElementById("monthPicker").value;
    let year, month;

    if (input) {
        [year, month] = input.split("-").map(Number);
    } else {
        let today = new Date();
        year = today.getFullYear();
        month = today.getMonth() + 1;
    }

    // Days in selected month
    let daysInMonth = new Date(year, month, 0).getDate();
    let shifts = parseInt(document.getElementById('shift').value);
    let schedule = [];

    // Collect shift information
    for (let i = 0; i < shifts; i++) {
        const shiftName = document.getElementById(`shift${i}Label`).value || `Shift ${i + 1}`;
        const peopleRequired = parseInt(document.getElementById(`shift${i}People`).value) || 1;
        
        schedule.push({
            name: shiftName,
            start: document.getElementById(`shift${i}Start`).value,
            end: document.getElementById(`shift${i}End`).value,
            people: peopleRequired,
            isNight: shiftName.toLowerCase().includes('night')
        });
    }

    // Initialize worker schedules
    let workerSchedules = {};
    workers.forEach(worker => {
        workerSchedules[worker] = Array(daysInMonth).fill("Day Off");
    });

    // Track worker monthly and weekly states
    let workerMonthlyStats = {};
    let workerWeeklyStats = {};
    workers.forEach(worker => {
        workerMonthlyStats[worker] = {
            totalShifts: 0,
            nightShifts: 0
        };
        workerWeeklyStats[worker] = {
            shiftsThisWeek: 0,
            restDaysNeeded: 0,
            daysOffThisWeek: 0
        };
    });

    const TARGET_SHIFTS_PER_PERSON = 21;

    // Process each day of the month
    for (let day = 0; day < daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day + 1);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Reset weekly counters on Monday
        if (dayOfWeek === 1) {
            workers.forEach(worker => {
                workerWeeklyStats[worker].shiftsThisWeek = 0;
                workerWeeklyStats[worker].daysOffThisWeek = 0;
            });
        }

        // Handle mandatory rest days after night shifts
        workers.forEach(worker => {
            if (workerWeeklyStats[worker].restDaysNeeded > 0) {
                workerSchedules[worker][day] = "Rest Day";
                workerWeeklyStats[worker].restDaysNeeded--;
                workerWeeklyStats[worker].daysOffThisWeek++;
            }
        });

        // Assign shifts for this day
        for (let shift of schedule) {
            let assignedCount = 0;
            let availableWorkers = [];

            // Find workers available for this shift
            workers.forEach(worker => {
                const weeklyStats = workerWeeklyStats[worker];
                const monthlyStats = workerMonthlyStats[worker];
                
                // Skip if already assigned today
                if (workerSchedules[worker][day] !== "Day Off") {
                    return;
                }
                
                // Skip if already worked 4 shifts this week (weekly limit)
                if (weeklyStats.shiftsThisWeek >= 4) {
                    return;
                }
                
                // Skip if already reached monthly target of 21 shifts
                if (monthlyStats.totalShifts >= TARGET_SHIFTS_PER_PERSON) {
                    return;
                }
                
                // Check if worker can maintain weekly pattern (4 shifts, 2-3 days off)
                const totalDaysThisWeek = weeklyStats.shiftsThisWeek + weeklyStats.daysOffThisWeek;
                const remainingDaysInWeek = 7 - totalDaysThisWeek;
                const requiredDaysOff = 2; // Base requirement, will be adjusted for night shifts
                const remainingDaysOffNeeded = requiredDaysOff - weeklyStats.daysOffThisWeek;
                
                if (remainingDaysOffNeeded > remainingDaysInWeek - 1) {
                    return; // Need to preserve days for required days off
                }

                availableWorkers.push(worker);
            });

            // Sort by priority: fewest monthly shifts first, then fewest weekly shifts
            availableWorkers.sort((a, b) => {
                const monthlyDiff = workerMonthlyStats[a].totalShifts - workerMonthlyStats[b].totalShifts;
                if (monthlyDiff !== 0) return monthlyDiff;
                return workerWeeklyStats[a].shiftsThisWeek - workerWeeklyStats[b].shiftsThisWeek;
            });

            // Assign workers to this shift
            for (let worker of availableWorkers) {
                if (assignedCount >= shift.people) break;

                workerSchedules[worker][day] = shift.name;
                workerWeeklyStats[worker].shiftsThisWeek++;
                workerMonthlyStats[worker].totalShifts++;
                assignedCount++;

                // If this is a night shift, schedule additional rest days
                if (shift.isNight) {
                    workerWeeklyStats[worker].restDaysNeeded = 2; // 2 extra days (total 3 days off)
                    workerMonthlyStats[worker].nightShifts++;
                }
            }
        }

        // Count days off for workers not assigned
        workers.forEach(worker => {
            if (workerSchedules[worker][day] === "Day Off" || workerSchedules[worker][day] === "Rest Day") {
                workerWeeklyStats[worker].daysOffThisWeek++;
            }
        });
    }

    // Display monthly statistics
    console.log("Monthly Shift Distribution:");
    workers.forEach(worker => {
        const stats = workerMonthlyStats[worker];
        console.log(`${worker}: ${stats.totalShifts} total shifts (${stats.nightShifts} night shifts)`);
    });
    renderSchedule(workerSchedules, daysInMonth, year, month);
}

// Enhanced schedule rendering with better styling
function renderSchedule(schedules, daysInMonth, year, month) {
    let output = document.getElementById('scheduleOutput');
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let html = `
        <div class="schedule-header">
            Schedule for ${monthNames[month - 1]} ${year}
        </div>
        <div class="table-container">
            <table id="tableSchedule">
                <thead>
                    <tr>
                        <th>Worker</th>
    `;

    // Add day headers
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        html += `<th><div>${d}</div><div style="font-size: 0.75em; opacity: 0.8;">${dayName}</div></th>`;
    }
    html += `</tr></thead><tbody>`;

    // Add worker rows
    for (let worker in schedules) {
        html += `<tr><td><strong>${worker}</strong></td>`;
        schedules[worker].forEach(shift => {
            let cellClass = '';
            if (shift === "Day Off" || shift === "Rest Day") {
                cellClass = 'off';
            } else if (shift.toLowerCase().includes("night")) {
                cellClass = 'night';
            }
            html += `<td class="${cellClass}">${shift}</td>`;
        });
        html += `</tr>`;
    }

    html += `</tbody></table></div>`;
    output.innerHTML = html;
    output.classList.add('fade-in');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(notificationStyles);

// Enhanced keyboard support
document.getElementById('workerName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addWorker();
    }
});

// Initialize default shifts on page load
document.addEventListener('DOMContentLoaded', function() {
    renderShifts();
    
    // Set current month as default
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    document.getElementById('monthPicker').value = currentMonth;
});