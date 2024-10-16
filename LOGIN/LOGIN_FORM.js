// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import { setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz0s6YhO_x58A1CU8n6rp1jTrhMXDDAhY",
  authDomain: "bulldogs-exchange.firebaseapp.com",
  projectId: "bulldogs-exchange",
  storageBucket: "bulldogs-exchange.appspot.com",
  messagingSenderId: "756908205528",
  appId: "1:756908205528:web:da9563b3e3fc10f40ebead",
  measurementId: "G-Z2H16L9JKM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// OAuth provider for Microsoft
const microsoftProvider = new OAuthProvider("microsoft.com");

// Function to show toast notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.className = `toast show ${type}`;
    toast.innerText = message;

    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000); // Hide after 3 seconds
  } else {
    console.warn("Toast element not found.");
  }
}

// Function to handle Microsoft sign-in
function signInWithMicrosoft() {
  signInWithPopup(auth, microsoftProvider)
    .then((result) => {
      const user = result.user;
      console.log("Sign-in successful", user);

      // Listen for authentication state changes
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("User is signed in:", user);

          // Reference to the user document in Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          // Save userID in localStorage for later use
          localStorage.setItem("userID", user.uid);
          console.log("User ID saved in localStorage:", user.uid);

          if (!userDoc.exists()) {
            // If the user document does not exist, create it
            const userData = {
              email: user.email,
              displayName: user.displayName,
              areyouadmin: false, // Set this based on your logic
            };

            await setDoc(userDocRef, userData);
            console.log("User document created in Firestore:", userData);
          }

          const userData = (await getDoc(userDocRef)).data();

          if (userData.areyouadmin) {
            console.log("Redirecting to admin page...");
            window.location.href = "./Admin-Hp/admin.html";
          } else {
            console.log("Redirecting to homepage...");
            window.location.href = "/LoginForm/Homepage1/test3.html";
          }
        } else {
          console.warn("No user is signed in.");
        }
      });
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error("Error during Microsoft sign-in:", error);
      showToast(`Error during Microsoft sign-in: ${errorMessage}`, "error");
    });
}

// Event listener for the Microsoft login using the logo container
document
  .querySelector(".logo-container")
  .addEventListener("click", signInWithMicrosoft);

// Event listener for the Microsoft register link
document
  .getElementById("microsoftRegisterButton")
  .addEventListener("click", (event) => {
    event.preventDefault(); // Prevent default anchor behavior
    window.location.href = "https://signup.live.com/"; // Redirect to Microsoft account creation page
  });
