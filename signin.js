// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYyTIYCX5bvN7r0BcJvLOKEON1nUaFnQk",
  authDomain: "self-improvement-7c7f6.firebaseapp.com",
  projectId: "self-improvement-7c7f6",
  storageBucket: "self-improvement-7c7f6.firebasestorage.app",
  messagingSenderId: "494829137683",
  appId: "1:494829137683:web:1e9e6f4a910b02b70774e6",
  measurementId: "G-43X839WMSM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get form and message elements
  const signInForm = document.getElementById("signInForm");
  const signInMessage = document.getElementById("signInMessage");

  if (signInForm) {
    signInForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const emailInput = document.getElementById("signInEmail").value;
      const passwordInput = document.getElementById("signInPassword").value;

      console.log("Sign in attempt for:", emailInput);

      signInWithEmailAndPassword(auth, emailInput, passwordInput)
        .then((userCredential) => {
          // Signed in successfully
          const user = userCredential.user;
          console.log("User signed in:", user.uid);
          alert("Sign in successful!");
          signInMessage.textContent = "Sign in successful! Redirecting...";
          signInMessage.style.color = "green";
          signInMessage.style.display = "block";
          
          // Redirect to main app after successful sign in
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error("Firebase sign in error:", errorCode, errorMessage);
          
          let userFriendlyMessage = "";
          switch(errorCode) {
            case 'auth/user-not-found':
              userFriendlyMessage = "No account found with this email. Please sign up first.";
              break;
            case 'auth/wrong-password':
              userFriendlyMessage = "Incorrect password. Please try again.";
              break;
            case 'auth/invalid-email':
              userFriendlyMessage = "Please enter a valid email address.";
              break;
            case 'auth/user-disabled':
              userFriendlyMessage = "This account has been disabled.";
              break;
            case 'auth/too-many-requests':
              userFriendlyMessage = "Too many failed attempts. Please try again later.";
              break;
            default:
              userFriendlyMessage = errorMessage;
          }
          
          alert("Error: " + userFriendlyMessage);
          signInMessage.textContent = "Error: " + userFriendlyMessage;
          signInMessage.style.color = "red";
          signInMessage.style.display = "block";
        });
    });
  } else {
    console.error("signInForm not found!");
  }

  // Hide the message box if empty on load
  if (signInMessage) {
    if (!signInMessage.textContent.trim()) {
      signInMessage.style.display = "none";
    }
  }
});