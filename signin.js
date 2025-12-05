// Firebase configuration and initialization
import { auth } from "./database.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

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
          
          if (signInMessage) {
            signInMessage.textContent = "Sign in successful! Redirecting...";
            signInMessage.className = "success";
            signInMessage.style.display = "block";
          }
          
          // Redirect to main app after successful sign in
          setTimeout(() => {
            window.location.href = "habits.html";
          }, 1000);
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
          
          if (signInMessage) {
            signInMessage.textContent = "Error: " + userFriendlyMessage;
            signInMessage.className = "error";
            signInMessage.style.display = "block";
          }
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