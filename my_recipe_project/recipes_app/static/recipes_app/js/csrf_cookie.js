// recipes_app/static/recipes_app/js/csrf_cookie.js

/**
 * Retrieves a cookie value by its name.
 * This function is commonly used to get the CSRF token for AJAX requests in Django.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|null} The value of the cookie, or null if not found.
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// console.log("csrf_cookie.js loaded and getCookie function is available."); // Optional: for debugging
