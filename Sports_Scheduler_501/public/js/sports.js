let sports = [];

fetch('js/sports.json')
  .then(response => response.json())
  .then(data => {
    sports = data;
    console.log(sports);
    // You can now use the sports data here
  })
  .catch(error => console.error('Error loading sports data:', error));
       const firebaseConfig = {
  apiKey: "AIzaSyBY5-8gYZrS8jqS5jtIB0iw3fR2QELnKwE",   // 🔹 from console
  authDomain: "sportsscheduler501-2075c.firebaseapp.com",
  projectId: "sportsscheduler501-2075c",
  storageBucket: "sportsscheduler501-2075c.appspot.com",
  messagingSenderId: "100593070892795217818",        // 🔹 matches client_id
  appId: "1:100593070892795217818:web-545458719969" // 🔹 from console
};
  
// Admin toggle
let isAdmin = false;
const adminToggle = document.getElementById('adminToggle');
if(adminToggle){
  adminToggle.addEventListener('change', function(){
    isAdmin = this.checked;
    renderSports();
  });
}

// DOM Elements
const sportInput = document.getElementById('sportName');
const suggestionBox = document.createElement('div');
suggestionBox.className = 'suggestions';
if(sportInput) sportInput.parentNode.appendChild(suggestionBox);

const searchInput = document.getElementById("sportSearch");
const resultsDiv = document.getElementById("searchResults");
const recommendationsDiv = document.getElementById("recommendations");

// Predefined list of sport names for autocomplete
const sportSuggestions = [
  "Football", "Cricket", "Basketball", "Volleyball", "Tennis",
  "Badminton", "Hockey", "Rugby", "Swimming", "Table Tennis",
  "Athletics", "Gymnastics", "Wrestling", "Boxing", "Golf"
];

// Render sports dynamically
function renderSports() {
  const container = document.getElementById('sports-listing');
  const selectSport = document.getElementById('select-sport');
  if(!container || !selectSport) return;

  container.innerHTML = "";
  selectSport.innerHTML = "<option value=''>--Select Sport--</option>";

  sports.forEach(sport=>{
    // Card for display
    const card = document.createElement('div');
    card.className = "sport-card";
    card.innerHTML = `
      <h3>${sport.name}</h3>
      <p><strong>Date:</strong> ${sport.date}</p>
      <p><strong>Time:</strong> ${sport.time}</p>
      <p><strong>Team Size:</strong> ${sport.teamSize}</p>
      ${isAdmin ? `<button onclick="deleteSport(${sport.id})">Delete</button>` : ""}
    `;
    container.appendChild(card);

    // Option for registration
    const opt = document.createElement('option');
    opt.value = sport.id;
    opt.textContent = sport.name;
    selectSport.appendChild(opt);
  });

  // Update recommendations dynamically
  showRecommendations();
}

// Delete sport (admin only)
function deleteSport(id){
  if(!confirm("Delete this sport?")) return;
  sports = sports.filter(s=>s.id !== id);
  renderSports();
  showStatus("Sport deleted successfully", "success");
}

// Registration form
const regForm = document.getElementById('registration-form');
if(regForm){
  regForm.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    const email = document.getElementById('player-email').value.trim();
    const sportId = parseInt(document.getElementById('select-sport').value);
    const team = document.getElementById('team-choice').value.trim();

    if(!name || !email || !sportId){
      showStatus("Please fill in all required fields", "error");
      return;
    }

    const sport = sports.find(s=>s.id===sportId);
    showStatus(`You (${name}) registered for ${sport.name}${team? " in team "+team:""}!`, "success");
    this.reset();
  });
}

// Show status messages
function showStatus(msg, type="success"){
  const p = document.getElementById('registration-status');
  if(p){
    p.textContent = msg;
    p.style.color = type==="success"? "#2ecc71":"#e74c3c";
  }
}

// Autocomplete for create sport input
if(sportInput){
  sportInput.addEventListener('input', function() {
    const val = this.value.toLowerCase();
    suggestionBox.innerHTML = '';
    if(!val) return;

    const matches = sportSuggestions.filter(s => s.toLowerCase().includes(val));
    matches.forEach(match => {
      const div = document.createElement('div');
      div.textContent = match;
      div.addEventListener('click', () => {
        sportInput.value = match;
        suggestionBox.innerHTML = '';
      });
      suggestionBox.appendChild(div);
    });
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', e => {
    if(e.target !== sportInput) suggestionBox.innerHTML = '';
  });
}

// Function to display recommended sports
function showRecommendations() {
  if(!recommendationsDiv) return;
  recommendationsDiv.innerHTML = "";
  sports.forEach(sport => {
    const sportItem = document.createElement("div");
    sportItem.textContent = sport.name;
    recommendationsDiv.appendChild(sportItem);
  });
}

// Function to search sports
function searchSport() {
  if(!searchInput || !resultsDiv) return;
  const query = searchInput.value.toLowerCase();
  resultsDiv.innerHTML = "";

  const filteredSports = sports.filter(sport => sport.name.toLowerCase().includes(query));

  if (filteredSports.length === 0) {
    resultsDiv.textContent = "No matching sports found.";
  } else {
    filteredSports.forEach(sport => {
      const sportItem = document.createElement("div");
      sportItem.textContent = `${sport.name} - ${sport.date} at ${sport.time} | Team Size: ${sport.teamSize}`;
      resultsDiv.appendChild(sportItem);
    });
  }
}

// Event listener for search input
if(searchInput) searchInput.addEventListener("input", searchSport);

// Initial render on page load
document.addEventListener("DOMContentLoaded", renderSports);
