// ---------------- Authentication ----------------
const authPopup = document.getElementById('authPopup');
const loginForm = document.getElementById('loginForm');
const dashboard = document.getElementById('dashboard');
const dashboardTitle = document.getElementById('dashboardTitle');

let currentUser = { username: '', role: 'player' };

// Handle Login
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const role = document.getElementById('role').value;
  currentUser = { username, role };
  authPopup.style.display = 'none';
  dashboard.classList.remove('hidden');
  updateDashboard();
});

// ---------------- Dashboard Navigation ----------------
const navHome = document.getElementById('navHome');
const navAdmin = document.getElementById('navAdmin');
const navPlayer = document.getElementById('navPlayer');
const navReports = document.getElementById('navReports');
const logoutBtn = document.getElementById('logoutBtn');

const homeSection = document.getElementById('homeSection');
const adminSection = document.getElementById('adminSection');
const playerSection = document.getElementById('playerSection');
const reportsSection = document.getElementById('reportsSection');

function hideAllSections() {
  homeSection.classList.add('hidden');
  adminSection.classList.add('hidden');
  playerSection.classList.add('hidden');
  reportsSection.classList.add('hidden');
}

navHome.addEventListener('click', () => {
  hideAllSections(); homeSection.classList.remove('hidden'); dashboardTitle.textContent='Home';
});
navAdmin.addEventListener('click', () => {
  hideAllSections(); adminSection.classList.remove('hidden'); dashboardTitle.textContent='Manage Sports';
});
navPlayer.addEventListener('click', () => {
  hideAllSections(); playerSection.classList.remove('hidden'); dashboardTitle.textContent='My Sessions';
});
navReports.addEventListener('click', () => {
  hideAllSections(); reportsSection.classList.remove('hidden'); dashboardTitle.textContent='Reports';
  renderChart();
});
logoutBtn.addEventListener('click', () => {
  dashboard.classList.add('hidden');
  authPopup.style.display='flex';
  loginForm.reset();
});

// ---------------- Fetch Sports ----------------
let sportsData = [];

async function fetchSports() {
  try {
    const res = await fetch('/api/sports'); // Node.js backend endpoint
    sportsData = await res.json();
    renderSportsTable();
    renderAdminTable();
    renderPlayerSessions();
  } catch(err) {
    console.error('Error fetching sports', err);
  }
}

// ---------------- Render Tables ----------------
const sportsTableBody = document.querySelector('#sportsTable tbody');
function renderSportsTable() {
  sportsTableBody.innerHTML = '';
  sportsData.forEach((sport, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sport.name}</td>
      <td>${sport.level}</td>
      <td>${sport.sessions || 0}</td>
      <td><button class="primary" onclick="joinSession(${idx})">Join</button></td>
    `;
    sportsTableBody.appendChild(tr);
  });
}

// Admin table
const adminSportsTableBody = document.querySelector('#adminSportsTable tbody');
function renderAdminTable() {
  adminSportsTableBody.innerHTML = '';
  sportsData.forEach((sport, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sport.name}</td>
      <td>${sport.level}</td>
      <td>
        <button class="danger" onclick="deleteSport(${idx})">Delete</button>
      </td>
    `;
    adminSportsTableBody.appendChild(tr);
  });
}

// Player sessions table
const playerSessionsTableBody = document.querySelector('#playerSessionsTable tbody');
let mySessions = [];
function renderPlayerSessions() {
  playerSessionsTableBody.innerHTML = '';
  mySessions.forEach((session, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${session.name}</td>
      <td>${session.date}</td>
      <td>${session.status}</td>
      <td><button class="danger" onclick="cancelSession(${idx})">Cancel</button></td>
    `;
    playerSessionsTableBody.appendChild(tr);
  });
}

// ---------------- Admin Actions ----------------
const addSportBtn = document.getElementById('addSportBtn');
const addSportModal = document.getElementById('addSportModal');
const addSportForm = document.getElementById('addSportForm');
const closeModal = document.querySelector('.modal .close');

addSportBtn.addEventListener('click', () => addSportModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => addSportModal.classList.add('hidden'));

addSportForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('sportName').value;
  const level = document.getElementById('sportLevel').value;
  sportsData.push({ name, level, sessions:0 });
  renderSportsTable(); renderAdminTable();
  addSportForm.reset(); addSportModal.classList.add('hidden');
});

function deleteSport(idx) {
  if(confirm('Are you sure to delete this sport?')) {
    sportsData.splice(idx,1);
    renderSportsTable(); renderAdminTable();
  }
}

// ---------------- Player Actions ----------------
function joinSession(idx) {
  const sport = sportsData[idx];
  const today = new Date().toLocaleDateString();
  mySessions.push({ name: sport.name, date: today, status: 'Joined' });
  renderPlayerSessions();
}

function cancelSession(idx) {
  if(confirm('Cancel this session?')) {
    mySessions.splice(idx,1);
    renderPlayerSessions();
  }
}

// ---------------- Reports ----------------
function renderChart() {
  const ctx = document.getElementById('reportChart').getContext('2d');
  const labels = sportsData.map(s => s.name);
  const data = sportsData.map(s => s.sessions);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total Sessions',
        data,
        backgroundColor: '#3498db'
      }]
    },
    options: { responsive:true, plugins:{ legend:{ display:false } } }
  });
}

// ---------------- Update Dashboard ----------------
function updateDashboard() {
  if(currentUser.role==='admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display='block');
    document.querySelectorAll('.player-only').forEach(el => el.style.display='none');
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display='none');
    document.querySelectorAll('.player-only').forEach(el => el.style.display='block');
  }
  fetchSports();
}
