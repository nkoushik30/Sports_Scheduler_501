document.addEventListener('DOMContentLoaded', () => {
    // --- 1. FIREBASE CONFIGURATION ---
    // IMPORTANT: Replace with your actual Firebase project configuration
       const firebaseConfig = {
  apiKey: "AIzaSyBY5-8gYZrS8jqS5jtIB0iw3fR2QELnKwE",   // 🔹 from console
  authDomain: "sportsscheduler501-2075c.firebaseapp.com",
  projectId: "sportsscheduler501-2075c",
  storageBucket: "sportsscheduler501-2075c.appspot.com",
  messagingSenderId: "100593070892795217818",        // 🔹 matches client_id
  appId: "1:100593070892795217818:web-545458719969" // 🔹 from console
};
  
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- 2. DOM ELEMENT SELECTORS ---
    // Screens
    const loadingScreen = document.getElementById('loading-screen');
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    // Auth Forms & Messages
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const showSignUp = document.getElementById('showSignUp');
    const showSignIn = document.getElementById('showSignIn');
    const authErrorMessage = document.getElementById('auth-error-message');

    // Dashboard Elements
    const sportsContainer = document.getElementById('sports-list');
    const messageBanner = document.getElementById('message-banner');
    const signOutBtn = document.getElementById('sign-out-btn');
    const userEmailDisplay = document.getElementById('user-email-display');
    const userRoleDisplay = document.getElementById('user-role-display');

    // Modals & Forms
    const addSportModal = document.getElementById('add-sport-modal');
    const addSportForm = document.getElementById('add-sport-form');
    
    // --- 3. GLOBAL STATE ---
    let currentUser = null;
    let userRole = null; // 'admin' or 'player'

    // --- 4. MAIN INITIALIZATION & AUTH STATE LISTENER ---
    
    // This listener is the heart of the app. It runs whenever the user's login state changes.
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserRole(user.uid);
            showDashboard();
        } else {
            currentUser = null;
            userRole = null;
            showAuth();
        }
        loadingScreen.style.display = 'none';
    });

    // --- 5. AUTHENTICATION UI & LOGIC ---

    const showAuth = () => {
        authContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
        document.body.classList.add('auth-view'); // <-- ADD THIS LINE
    };
    
    // Form Toggling
    showSignUp.addEventListener('click', () => {
        signInForm.style.display = 'none';
        signUpForm.style.display = 'block';
    });
    showSignIn.addEventListener('click', () => {
        signUpForm.style.display = 'none';
        signInForm.style.display = 'block';
    });

    // Sign-Up Handler
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signUpForm['signUpEmail'].value;
        const password = signUpForm['signUpPassword'].value;
        const role = signUpForm['userRole'].value;

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            // Save the user's role to Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                email: userCredential.user.email,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // onAuthStateChanged will handle the UI switch
        } catch (error) {
            showAuthError(getFirebaseErrorMessage(error.code));
        }
    });
    
    // Sign-In Handler
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signInForm['signInEmail'].value;
        const password = signInForm['signInPassword'].value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle the UI switch
        } catch (error) {
            showAuthError(getFirebaseErrorMessage(error.code));
        }
    });

    // Sign-Out Handler
    signOutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    const loadUserRole = async (userId) => {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                userRole = doc.data().role;
            } else {
                userRole = 'player'; // Default role if not found
            }
        } catch (error) {
            console.error("Error loading user role:", error);
            userRole = 'player';
        }
    };
    
    // --- 6. DASHBOARD UI & LOGIC ---

    const showDashboard = () => {
        authContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        initializeDashboard();
    };
    
    // This runs only once after the user logs in
    const initializeDashboard = () => {
        updateDashboardView();
        setupDashboardEventListeners();
        fetchSportsFromFirestore();
    };
    
    const updateDashboardView = () => {
        userEmailDisplay.textContent = currentUser.email;
        userRoleDisplay.textContent = `Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`;
        // Use CSS classes to show/hide admin-only elements
        document.body.classList.toggle('admin-view', userRole === 'admin');
    };
    
    const setupDashboardEventListeners = () => {
        addSportForm.addEventListener('submit', handleAddSport);
        
        // Use event delegation for dynamically created buttons
        sportsContainer.addEventListener('click', (e) => {
            const target = e.target;
            const sportCard = target.closest('.sport-card');
            if (!sportCard) return;

            const sportId = sportCard.dataset.sportId;

            if (target.classList.contains('delete-btn')) {
                handleDeleteSport(sportId);
            }
            if (target.classList.contains('register-btn')) {
                handleRegisterPlayer(sportId);
            }
            if (target.classList.contains('cancel-btn')) {
                handleCancelRegistration(sportId);
            }
        });
    };

    // --- 7. FIRESTORE CRUD OPERATIONS ---

    const fetchSportsFromFirestore = () => {
        // Use onSnapshot for real-time updates!
        db.collection('sports').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const sports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderSports(sports);
        }, error => {
            console.error("Error fetching sports:", error);
            showMessage("Could not load sports data.", "error");
        });
    };
    
    const renderSports = (sports) => {
        sportsContainer.innerHTML = '';
        if (sports.length === 0) {
            sportsContainer.innerHTML = '<p>No sports scheduled. Admin can add a new sport!</p>';
            return;
        }

        sports.forEach(sport => {
            const isRegistered = sport.registeredPlayers?.some(p => p.uid === currentUser.uid);
            const card = document.createElement('div');
            card.className = 'sport-card';
            card.dataset.sportId = sport.id;
            card.innerHTML = `
                <h3>${sport.name}</h3>
                <p><strong>Date:</strong> ${new Date(sport.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${sport.time}</p>
                <p><strong>Captain:</strong> ${sport.teamCaptain}</p>
                <div class="players-list">
                    <h4>Registered Players (${sport.registeredPlayers?.length || 0} / ${sport.teamSize}):</h4>
                    <ul>
                        ${sport.registeredPlayers?.map(p => `<li>${p.email}</li>`).join('') || '<li>No players yet.</li>'}
                    </ul>
                </div>
                <div class="card-actions">
                    ${userRole === 'admin'
                        ? `<button class="btn delete-btn">Delete Sport</button>`
                        : isRegistered
                            ? `<button class="btn cancel-btn">Cancel Registration</button>`
                            : `<button class="btn register-btn">Register</button>`
                    }
                </div>
            `;
            sportsContainer.appendChild(card);
        });
    };

    const handleAddSport = async (e) => {
        e.preventDefault();
        const newSport = {
            name: addSportForm['sportName'].value,
            date: addSportForm['sportDate'].value,
            time: addSportForm['sportTime'].value,
            teamSize: parseInt(addSportForm['teamSize'].value),
            teamCaptain: addSportForm['teamCaptain'].value,
            registeredPlayers: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('sports').add(newSport);
            showMessage('Sport added successfully!', 'success');
            addSportForm.reset();
            addSportModal.classList.remove('visible'); // Close modal
        } catch (error) {
            showMessage('Failed to add sport.', 'error');
            console.error("Error adding sport:", error);
        }
    };
    
    const handleDeleteSport = async (sportId) => {
        if (!confirm('Are you sure you want to permanently delete this sport?')) return;
        try {
            await db.collection('sports').doc(sportId).delete();
            showMessage('Sport deleted successfully.', 'success');
        } catch (error) {
            showMessage('Failed to delete sport.', 'error');
            console.error("Error deleting sport:", error);
        }
    };
    
    const handleRegisterPlayer = async (sportId) => {
        const playerInfo = { uid: currentUser.uid, email: currentUser.email };
        try {
            await db.collection('sports').doc(sportId).update({
                registeredPlayers: firebase.firestore.FieldValue.arrayUnion(playerInfo)
            });
            showMessage('You are registered!', 'success');
        } catch (error) {
            showMessage('Registration failed. The session might be full.', 'error');
            console.error("Error registering:", error);
        }
    };
    
    const handleCancelRegistration = async (sportId) => {
        const playerInfo = { uid: currentUser.uid, email: currentUser.email };
        try {
            await db.collection('sports').doc(sportId).update({
                registeredPlayers: firebase.firestore.FieldValue.arrayRemove(playerInfo)
            });
            showMessage('Your registration has been cancelled.', 'success');
        } catch (error) {
            showMessage('Failed to cancel registration.', 'error');
            console.error("Error cancelling registration:", error);
        }
    };

    // --- 8. UTILITY & HELPER FUNCTIONS ---
    
    const showMessage = (message, type = 'success') => {
        messageBanner.textContent = message;
        messageBanner.className = `message-banner ${type} visible`;
        setTimeout(() => messageBanner.classList.remove('visible'), 4000);
    };
    
    const showAuthError = (message) => {
        authErrorMessage.textContent = message;
        authErrorMessage.style.display = 'block';
        setTimeout(() => authErrorMessage.style.display = 'none', 5000);
// --- 5. AUTHENTICATION UI & LOGIC ---

// (showAuth is already defined above, so this duplicate block is removed)

// --- 6. DASHBOARD UI & LOGIC ---

const showDashboard = () => {
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';
    document.body.classList.remove('auth-view'); // <-- ADD THIS LINE
    initializeDashboard();
};
};
    const getFirebaseErrorMessage = (errorCode) => {
        const messages = {
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
        };
        return messages[errorCode] || 'An unexpected error occurred.';
    };
});