document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const loginMessageDiv = document.getElementById("login-message"); // Assumes this div exists in your login.html
    const submitButton = document.getElementById("login-submit-button"); // Get the submit button

    if (!loginForm || !emailInput || !passwordInput || !loginMessageDiv || !submitButton) {
        console.error("One or more required elements (login-form, login-email, login-password, login-message, login-submit-button) not found.");
        return;
    }

    loginForm.addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent default form submission
        loginMessageDiv.textContent = ""; // Clear previous messages
        loginMessageDiv.className = ""; // Reset message class
        submitButton.disabled = true; // Disable button during submission
        submitButton.textContent = "Logging In..."; // Change button text

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // --- Client-side validation (optional, but good for UX) ---
        if (!email || !password) {
            displayMessage("Please enter both email and password.", "error");
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            displayMessage("Please enter a valid email address.", "error");
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
            return;
        }

        // Password length check could be added here if desired,
        // but server-side validation is more critical.

        // --- AJAX Call to Django Backend ---
        const loginUrl = loginForm.dataset.loginUrl; // Get URL from data attribute in login.html
        const csrfToken = getCookie('csrftoken'); // Function from csrf_cookie.js

        if (!loginUrl) {
            displayMessage("Login configuration error. Please try again later.", "error");
            console.error("Login URL not found on form data attribute.");
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
            return;
        }

        if (!csrfToken) {
            displayMessage("Could not verify your request. Please refresh the page.", "error");
            console.error("CSRF token not found.");
            submitButton.disabled = false;
            submitButton.textContent = "Log In";
            return;
        }

        fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ email: email, password: password }) // Or 'username': email if your Django auth uses username
        })
        .then(response => {
            // Try to parse JSON regardless of response.ok status, as error responses might also be JSON
            return response.json().then(data => ({ ok: response.ok, status: response.status, data }));
        })
        .then(({ ok, status, data }) => {
            if (ok && data.success) {
                displayMessage(data.message || "Login successful! Redirecting...", "success");
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                } else {
                    // Fallback if no redirect URL is provided, though it's expected
                    window.location.href = '/'; // Redirect to home or dashboard
                }
            } else {
                // Handle errors from the server (e.g., invalid credentials, validation errors)
                let errorMessage = data.error || "Invalid email or password.";
                if (data.errors) { // If Django sends back form-like errors
                    errorMessage = Object.values(data.errors).flat().join(" ");
                }
                displayMessage(errorMessage, "error");
            }
        })
        .catch(error => {
            console.error('Login AJAX error:', error);
            displayMessage("An error occurred during login. Please try again.", "error");
        })
        .finally(() => {
            // Re-enable the button if not redirected
            if (!window.location.href.endsWith("redirecting...")) { // Basic check
                 submitButton.disabled = false;
                 submitButton.textContent = "Log In";
            }
        });
    });

    function displayMessage(message, type) {
        if (loginMessageDiv) {
            loginMessageDiv.textContent = message;
            loginMessageDiv.className = type; // 'success' or 'error'
        } else {
            // Fallback if message div isn't there for some reason
            alert(message);
        }
    }
});
