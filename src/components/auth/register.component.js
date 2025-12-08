// Firebase configuration and initialization
import { auth } from "../../services/firebase.service.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get form and message elements at the top
  const signUpForm = document.getElementById("signUpForm");
  const signUpMessage = document.getElementById("signUpMessage");

  if (signUpForm) {
    signUpForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const emailInput = document.getElementById("signUpEmail").value;
      const passwordInput = document.getElementById("signUpPassword").value;

      console.log("Form submitted with:", emailInput); // Debug log

      createUserWithEmailAndPassword(auth, emailInput, passwordInput)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          console.log("User created:", user.uid);
          
          if (signUpMessage) {
            signUpMessage.textContent = "User registered successfully! Redirecting...";
            signUpMessage.className = "success";
            signUpMessage.style.display = "block";
          }
          
          // Redirect to main app after successful registration
          setTimeout(() => {
            window.location.href = "habits.html";
          }, 1000);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error("Firebase error code:", errorCode);
          console.error("Firebase error message:", errorMessage);
          
          let userFriendlyMessage = "";
          switch(errorCode) {
            case 'auth/api-key-not-valid':
              userFriendlyMessage = "Firebase configuration error. Please check your API key.";
              break;
            case 'auth/email-already-in-use':
              userFriendlyMessage = "This email is already registered.";
              break;
            case 'auth/weak-password':
              userFriendlyMessage = "Password should be at least 6 characters.";
              break;
            case 'auth/invalid-email':
              userFriendlyMessage = "Please enter a valid email address.";
              break;
            default:
              userFriendlyMessage = errorMessage;
          }
          
          if (signUpMessage) {
            signUpMessage.textContent = "Error: " + userFriendlyMessage;
            signUpMessage.className = "error";
            signUpMessage.style.display = "block";
          }
        });
    });
  } else {
    console.error("signUpForm not found!");
  }
});
