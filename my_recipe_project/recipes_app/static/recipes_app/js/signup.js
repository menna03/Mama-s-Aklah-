document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const isStaffCheckbox = document.getElementById("is_staff");
    const signupMessageDiv = document.getElementById("signup-message");
    const submitButton = document.getElementById("signup-submit-button");

    if (!signupForm || !usernameInput || !emailInput || !passwordInput || !confirmPasswordInput || !isStaffCheckbox || !signupMessageDiv || !submitButton) {
        console.error("One or more required elements for signup form not found.");
        if (signupMessageDiv) {
            signupMessageDiv.textContent = "Page error. Please try refreshing.";
            signupMessageDiv.className = "error";
            signupMessageDiv.style.display = "block";
        }
        return;
    }

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        signupMessageDiv.textContent = "";
        signupMessageDiv.className = "";
        signupMessageDiv.style.display = "none";
        submitButton.disabled = true;
        submitButton.textContent = "Signing Up...";

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const isStaff = isStaffCheckbox.checked;

        if (!username || !email || !password || !confirmPassword) {
            displayMessage("Please fill in all fields.", "error");
            enableSubmitButton();
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            displayMessage("Please enter a valid email address.", "error");
            enableSubmitButton();
            return;
        }

        if (password.length < 6) {
            displayMessage("Password must be at least 6 characters long.", "error");
            enableSubmitButton();
            return;
        }

        if (password !== confirmPassword) {
            displayMessage("Passwords do not match.", "error");
            enableSubmitButton();
            return;
        }

        const signupUrl = signupForm.dataset.signupUrl;
        const csrfToken = getCookie('csrftoken');

        if (!signupUrl || !csrfToken) {
            displayMessage("Configuration error. Cannot submit form.", "error");
            enableSubmitButton();
            return;
        }

        const formData = {
            username: username,
            email: email,
            password1: password,        // Fixed here
            password2: confirmPassword,
            is_staff: isStaff
        };

        console.log("Submitting signup data:", JSON.stringify(formData));

        fetch(signupUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
        .then(({ ok, status, data }) => {
            console.log("Signup response data:", data);
            if (ok && data.success) {
                displayMessage(data.message || "Account created successfully! Redirecting to login...", "success");
                if (data.redirect_url) {
                    setTimeout(() => { window.location.href = data.redirect_url; }, 2000);
                }
            } else {
                let errorMessages = [];
                if (data.errors) {
                    for (const field in data.errors) {
                        data.errors[field].forEach(errDetail => {
                            let message = errDetail.message || errDetail;
                            errorMessages.push(`<strong>${field === '__all__' ? 'Form' : field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${message}`);
                        });
                    }
                } else if (data.error) {
                    errorMessages.push(data.error);
                } else {
                    errorMessages.push("An unknown error occurred during signup.");
                }
                displayMessage(errorMessages.join("<br>"), "error", true);
                enableSubmitButton();
            }
        })
        .catch(error => {
            console.error('Signup AJAX error:', error);
            displayMessage("A network error occurred. Please try again.", "error");
            enableSubmitButton();
        });
    });

    function displayMessage(message, type, allowHtml = false) {
        if (allowHtml) {
            signupMessageDiv.innerHTML = message;
        } else {
            signupMessageDiv.textContent = message;
        }
        signupMessageDiv.className = "message-area " + type;
        signupMessageDiv.style.display = "block";
    }

    function enableSubmitButton() {
        submitButton.disabled = false;
        submitButton.textContent = "Sign Up";
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
