let workers = [];

// Add worker
function addWorker() {
    let input = document.getElementById('workerName');
    let name = input.value.trim();
    if (name) {
        workers.push(name);
        input.value = '';
        renderWorkers();
    }
}

// Render worker list
function renderWorkers() {
    let list = document.getElementById('workerList');
    list.innerHTML = '';
    workers.forEach((worker, index) => {
        let li = document.createElement('li');
        li.innerHTML = `<span>${worker}</span><button id="removeButton" onclick="removeWorker(${index})">X</button>`;
        list.appendChild(li);
    });
}

// Remove worker
function removeWorker(index) {
    workers.splice(index, 1);
    renderWorkers();
}

// Render shifts inputs
function renderShifts() {
    let shift = parseInt(document.getElementById('shift').value);
    let container = document.getElementById('shiftsContainer');
    container.innerHTML = '';

    for (let i = 0; i < shift; i++) {
        let div = document.createElement('div');
        div.className = "shift-row";
        div.innerHTML = `
          <h4>Shift ${i + 1}</h4>
          <label>Name: <input type="text" id="shift${i}Label" value="${i === 0 ? 'Morning' : i === 1 ? 'Afternoon' : 'Night'}"></label>
          <label>Start: <input type="time" id="shift${i}Start" value="${i === 0 ? '08:00' : i === 1 ? '16:00' : '00:00'}"></label>
          <label>End: <input type="time" id="shift${i}End" value="${i === 0 ? '16:00' : i === 1 ? '00:00' : '08:00'}"></label>
          <label>People Required: <input type="number" id="shift${i}People" min="1" value="2"></label>
        `;
        container.appendChild(div);
    }
}

// Generate schedule
function generateSchedule() {
    if (workers.length === 0) {
        alert('Please add at least one worker');
        return;
    }

    // Get month and year from input
    let input = document.getElementById("monthPicker").value; // format: "2025-09"
    let year, month;

    if (input) {
        [year, month] = input.split("-").map(Number);
    } else {
        let today = new Date();
        year = today.getFullYear();
        month = today.getMonth() + 1; // JS months are 0-based
    }

    // Days in selected month
    let daysInMonth = new Date(year, month, 0).getDate();

    let shifts = parseInt(document.getElementById('shift').value);
    let schedule = [];

    for (let i = 0; i < shifts; i++) {
        schedule.push({
            name: document.getElementById(`shift${i}Label`).value,
            start: document.getElementById(`shift${i}Start`).value,
            end: document.getElementById(`shift${i}End`).value,
            people: parseInt(document.getElementById(`shift${i}People`).value),
            isNight: (i === shifts - 1) // last shift is night
        });
    }

    let schedule1 = {};
    workers.forEach(worker => schedule1[worker] = Array(daysInMonth).fill("Day Off"));

    let workerIndex = 0;

    for (let d = 0; d < daysInMonth; d++) {
        for (let s of schedule) {
            let assigned = 0;
            while (assigned < s.people) {
                let worker = workers[workerIndex % workers.length];

                if (schedule1[worker][d] === "Day Off") {
                    schedule1[worker][d] = s.name;

                    if (s.isNight) {
                        if (d + 1 < daysInMonth) schedule1[worker][d + 1] = "Day Off";
                        if (d + 2 < daysInMonth) schedule1[worker][d + 2] = "Day Off";
                    }
                    assigned++;
                }
                workerIndex++;
            }
        }
    }

    renderSchedule(schedule1, daysInMonth, year, month);
}

// Render schedule table
function renderSchedule(schedule1, daysInMonth, year, month) {
    let output = document.getElementById('scheduleOutput');
    let html = `<h3>Schedule for ${year}-${String(month).padStart(2, '0')}</h3>`;
    html += `<table id="tableSchedule"><tr><th>Worker</th>`;

    for (let d = 1; d <= daysInMonth; d++) {
        html += `<th>${d}</th>`;
    }
    html += `</tr>`;

    for (let worker in schedule1) {
        html += `<tr><td><b>${worker}</b></td>`;
        schedule1[worker].forEach(shift => {
            if (shift === "Day Off") {
                html += `<td class="off">Day Off</td>`;
            } else if (shift.toLowerCase().includes("night")) {
                html += `<td class="night">${shift}</td>`;
            } else {
                html += `<td>${shift}</td>`;
            }
        });
        html += `</tr>`;
    }

    html += `</table>`;
    output.innerHTML = html;
}

// Initialize default shifts
renderShifts();
