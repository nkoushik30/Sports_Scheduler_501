// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
       const firebaseConfig = {
  apiKey: "AIzaSyBY5-8gYZrS8jqS5jtIB0iw3fR2QELnKwE",   // 🔹 from console
  authDomain: "sportsscheduler501-2075c.firebaseapp.com",
  projectId: "sportsscheduler501-2075c",
  storageBucket: "sportsscheduler501-2075c.appspot.com",
  messagingSenderId: "100593070892795217818",        // 🔹 matches client_id
  appId: "1:100593070892795217818:web-545458719969" // 🔹 from console
};
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- SIGNUP ----------------
async function signUp(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: new Date()
    });

    alert("Signup successful!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// ---------------- LOGIN ----------------
async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// ---------------- GET NAME ----------------
async function getUserName(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().name;
    } else {
      return "Unknown Player";
    }
  } catch (error) {
    console.error("Error retrieving name:", error);
    return "Error";
  }
}

// ---------------- LISTEN FOR LOGIN STATE ----------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const name = await getUserName(user.uid);
    document.getElementById("welcome").innerText = `Welcome, ${name}!`;
  } else {
    document.getElementById("welcome").innerText = "Please login.";
  }
});

// 🔹 Example form binding
document.getElementById("signupForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = e.target.name.value;
  const email = e.target.email.value;
  const password = e.target.password.value;
  signUp(email, password, name);
});

document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  login(email, password);
});
// ---------------- SPORTS MANAGEMENT ----------------
const sportInput = document.getElementById('sport-name');
const suggestionBox = document.getElementById('suggestions');
const sportSuggestions = ["Football", "Cricket", "Basketball", "Tennis", "Hockey", "Volleyball", "Baseball", "Rugby", "Swimming", "Athletics"]; 
