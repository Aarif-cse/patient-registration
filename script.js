// Mock Data Source - State Management
let patients = [
    { id: 'PT-1001', name: 'John Doe', age: 45, blood: 'A+', allergies: 'Penicillin', contact: '+1 234 567 8901', address: '123 Health Ave, Springfield', date: '2023-11-01' },
    { id: 'PT-1002', name: 'Jane Smith', age: 32, blood: 'O-', allergies: 'None', contact: '+1 987 654 3210', address: '456 Wellness Blvd, Springfield', date: '2023-11-02' },
    { id: 'PT-1003', name: 'Robert Johnson', age: 58, blood: 'B+', allergies: 'Aspirin', contact: '+1 555 123 4567', address: '789 Care Lane, Springfield', date: '2023-11-03' }
];

let visitHistory = [
    { patientId: 'PT-1001', date: '2023-11-01', note: 'Initial consultation. Prescribed physical therapy.' },
    { patientId: 'PT-1002', date: '2023-11-02', note: 'Routine checkup. All healthy.' }
];

let queue = ['PT-1002', 'PT-1003']; 

// Application Nodes
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const themeToggle = document.getElementById('themeToggle');
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');
const pageTitle = document.getElementById('pageTitle');

// Initialize Lifecycle
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    generatePatientId();
    updateDashboard();
    populateQueue();
    initCharts();
});

// Sidebar & Routing Logic
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Exposed globally for onclick handlers in HTML
window.navigateTo = function(target) {
    // Nav Items Active styling
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === target) item.classList.add('active');
    });

    // Toggle Section visibility
    pageSections.forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(target);
    activeSection.classList.add('active');
    
    // Header Title
    const titleMap = {
        'dashboard': 'Dashboard',
        'registration': 'Patient Registration',
        'search': 'Search Patient',
        'queue': 'Daily Queue',
        'analytics': 'Analytics Overview'
    };
    pageTitle.textContent = titleMap[target];

    // Mobile specific: auto-close sidebar
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }

    // Refresh charts when entering analytics module
    if (target === 'analytics') {
        initCharts();
    }
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navigateTo(item.dataset.target);
    });
});

// Theme Management
function initTheme() {
    const isDark = localStorage.getItem('medsys_theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('medsys_theme', isDark ? 'dark' : 'light');
    
    // Animation for icon
    themeToggle.style.transform = 'scale(0.8)';
    setTimeout(() => {
        themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-regular fa-moon"></i>';
        themeToggle.style.transform = 'scale(1)';
    }, 150);

    // Re-render charts
    initCharts();
});

// Dashboard Data Update
function updateDashboard() {
    // Counters
    document.getElementById('totalPatientsStat').textContent = patients.length;
    document.getElementById('queueLengthStat').textContent = queue.length;
    
    // Simulate some logic for daily visits
    const visitsToday = Math.floor(Math.random() * 20) + 15;
    document.getElementById('todayVisitsStat').textContent = visitsToday;

    // Recent Activity Table
    const tbody = document.querySelector('#recentPatientsTable tbody');
    tbody.innerHTML = '';
    
    const recent = [...patients].reverse().slice(0, 5); // Latest 5
    recent.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><span class="badge badge-primary">${p.id}</span></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.date}</td>
                <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> Registered</span></td>
            </tr>
        `;
    });
}

// Global search bar handler (dummy action for aesthetics)
const globalSearch = document.getElementById('globalSearch');
if(globalSearch) {
    globalSearch.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && globalSearch.value.trim() !== '') {
            navigateTo('search');
            document.getElementById('searchInput').value = globalSearch.value;
            performSearch();
            globalSearch.value = '';
        }
    });
}

// Patient Registration
const registrationForm = document.getElementById('registrationForm');

function generatePatientId() {
    const nextNum = patients.length + 1001;
    document.getElementById('regPatientId').value = `PT-${nextNum}`;
}

registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect Form Data
    const newPatient = {
        id: document.getElementById('regPatientId').value,
        name: document.getElementById('regName').value,
        age: parseInt(document.getElementById('regAge').value),
        blood: document.getElementById('regBloodGroup').value,
        allergies: document.getElementById('regAllergies').value || 'None',
        contact: document.getElementById('regContact').value,
        address: document.getElementById('regAddress').value,
        date: new Date().toISOString().split('T')[0]
    };

    // Save Data
    patients.push(newPatient);
    
    // UX feedback
    showToast('Patient registered successfully!', 'success');
    
    // Cleanup & Refresh
    registrationForm.reset();
    generatePatientId();
    updateDashboard();
    
    // Optional: auto-redirect to search or queue
});

// Patient Search
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const addToQueueBtn = document.getElementById('addToQueueBtn');

let currentSearchedPatient = null;

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;

    // Find by ID exact match, or name partial match
    const patient = patients.find(p => 
        p.id.toLowerCase() === query || 
        p.name.toLowerCase().includes(query)
    );

    if (patient) {
        currentSearchedPatient = patient;
        
        // Populate DOM elements
        document.getElementById('spName').textContent = patient.name;
        document.getElementById('spId').textContent = patient.id;
        document.getElementById('spAge').textContent = `${patient.age} yrs`;
        document.getElementById('spBlood').textContent = patient.blood || 'N/A';
        document.getElementById('spContact').textContent = patient.contact;
        document.getElementById('spAllergies').textContent = patient.allergies;

        // Render Visit Timeline
        const timeline = document.getElementById('visitTimeline');
        timeline.innerHTML = '';
        const pVisits = visitHistory.filter(v => v.patientId === patient.id);
        
        if (pVisits.length > 0) {
            pVisits.forEach(visit => {
                timeline.innerHTML += `
                    <li>
                        <div class="timeline-date">${visit.date}</div>
                        <div class="timeline-content">${visit.note}</div>
                    </li>
                `;
            });
        } else {
            timeline.innerHTML = `
                <li>
                    <div class="timeline-content" style="color: var(--text-secondary); background: transparent; border: 1px dashed var(--border-color);">
                        No visit history found.
                    </div>
                </li>
            `;
        }

        searchResults.style.display = 'block';
    } else {
        searchResults.style.display = 'none';
        showToast(`No patient found matching "${query}"`, 'error');
    }
}

addToQueueBtn.addEventListener('click', () => {
    if (currentSearchedPatient) {
        if (!queue.includes(currentSearchedPatient.id)) {
            queue.push(currentSearchedPatient.id);
            populateQueue();
            updateDashboard();
            showToast(`${currentSearchedPatient.name} added to the daily queue.`, 'success');
        } else {
            showToast('Patient is already in the queue.', 'warning');
        }
    }
});

// Queue System
function populateQueue() {
    const queueList = document.getElementById('queueList');
    document.getElementById('queueCountLabel').textContent = queue.length;
    queueList.innerHTML = '';

    if (queue.length === 0) {
        queueList.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px; border-style: dashed;">
                <i class="fa-solid fa-mug-hot" style="font-size: 3rem; color: var(--border-color); margin-bottom: 16px;"></i>
                <p style="color: var(--text-secondary); font-size: 1.1rem;">The queue is currently empty.</p>
            </div>
        `;
        return;
    }

    queue.forEach((pid, index) => {
        const patient = patients.find(p => p.id === pid);
        if (patient) {
            queueList.innerHTML += `
                <div class="queue-item fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="queue-number">#${index + 1}</div>
                    <div class="queue-info">
                        <h4>${patient.name}</h4>
                        <p><span class="badge ${index === 0 ? 'badge-primary' : 'badge-warning'}">${patient.id}</span> &bull; ${patient.age} yrs &bull; Blood: ${patient.blood}</p>
                    </div>
                    <button class="btn btn-outline" onclick="removeFromQueue('${pid}')" title="Mark Visit Complete">
                        <i class="fa-solid fa-check"></i> ${index === 0 ? 'Complete Visit' : 'Skip/Remove'}
                    </button>
                </div>
            `;
        }
    });
}

// Global hook for inline HTML clicks
window.removeFromQueue = function(pid) {
    const patientIndex = queue.indexOf(pid);
    if(patientIndex > -1) {
        queue.splice(patientIndex, 1);
        populateQueue();
        updateDashboard();
        showToast('Patient removed from queue.', 'success');
        
        // Optionally auto-add visit record
        visitHistory.unshift({
            patientId: pid,
            date: new Date().toISOString().split('T')[0],
            note: 'Visit completed from queue.'
        });
    }
};

// Toast Notification Engine
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => toast.remove(), 400); // Wait for anim
    }, 4000);
}

// Chart.js Data Visualization
let visitChartInstance = null;
let deptChartInstance = null;

function initCharts() {
    const ctxVisits = document.getElementById('visitsChart');
    const ctxDept = document.getElementById('departmentChart');
    
    if(!ctxVisits || !ctxDept) return; // Charts not in DOM yet or failed

    // Determine colors based on theme
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#A3AED0' : '#A3AED0';
    const gridColor = isDark ? '#2B3674' : '#E2E8F0';
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim();

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 13;

    // Destroy existing to prevent render overlap
    if(visitChartInstance) visitChartInstance.destroy();
    
    visitChartInstance = new Chart(ctxVisits, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Patient Visits',
                data: [45, 52, 38, 65, 48, 25, 15],
                backgroundColor: primaryColor,
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#111C44' : '#fff',
                    titleColor: isDark ? '#fff' : '#1B2559',
                    bodyColor: isDark ? '#A3AED0' : '#A3AED0',
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6
                }
            },
            scales: {
                x: { 
                    grid: { display: false } 
                },
                y: { 
                    grid: { color: gridColor, drawBorder: false }, 
                    beginAtZero: true 
                }
            }
        }
    });

    if(deptChartInstance) deptChartInstance.destroy();

    deptChartInstance = new Chart(ctxDept, {
        type: 'doughnut',
        data: {
            labels: ['General', 'Cardiology', 'Neurology', 'Pediatrics'],
            datasets: [{
                data: [45, 15, 10, 30],
                backgroundColor: [primaryColor, secondaryColor, '#F59E0B', '#EF4444'],
                borderWidth: isDark ? 2 : 2,
                borderColor: isDark ? '#111C44' : '#fff',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        }
    });
}
