document.addEventListener("DOMContentLoaded", function () {
    const recipeContainer = document.getElementById("recipeContainer");
    const logoutBtn = document.getElementById("logout-btn"); // Logout button in the main header
    const featuredLoadingErrorDiv = document.getElementById("featured-loading-error-message");

    // --- Check if essential elements are present ---
    if (!recipeContainer) {
        console.error("Recipe container ('recipeContainer') not found.");
        if (featuredLoadingErrorDiv) featuredLoadingErrorDiv.textContent = 'Page structure error: Recipe container missing.';
        return;
    }

    // Get AJAX URLs and other data from HTML data attributes
    const featuredRecipesUrl = recipeContainer.dataset.featuredRecipesUrl;
    let recipeDetailUrlBase = recipeContainer.dataset.recipeDetailUrlBase; // From Home.html data attribute

    if (!featuredRecipesUrl || !recipeDetailUrlBase) {
        console.error("Required data attributes for URLs not found on recipeContainer element.");
        if (featuredLoadingErrorDiv) featuredLoadingErrorDiv.textContent = 'Configuration error: Missing API URLs.';
        recipeContainer.innerHTML = '<p>Could not load featured recipes due to a configuration error.</p>';
        return;
    }
    // Ensure the base URL for recipe details ends correctly for replacement
    if (recipeDetailUrlBase.includes('/0/')) {
        // Designed to replace '/0/'
    } else if (recipeDetailUrlBase.endsWith('0')) { // If it's just '.../recipe/0'
        recipeDetailUrlBase = recipeDetailUrlBase.substring(0, recipeDetailUrlBase.length -1); // Make it '.../recipe/'
    }


    // --- Function to Display Featured Recipes ---
    function displayFeaturedRecipes(recipes) {
        recipeContainer.innerHTML = ""; // Clear existing content or loading message

        if (!Array.isArray(recipes) || recipes.length === 0) {
            recipeContainer.innerHTML = '<p>No featured recipes available at the moment.</p>';
            return;
        }

        recipes.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.className = "recipe"; // Use class from home.css or a new specific one

            // Construct the detail URL
            const detailUrl = recipeDetailUrlBase.replace('0/', `${recipe.id}/`);

            // Image URL should come complete from the server.
            // Using a hardcoded static path as a robust fallback.
            const imageUrl = recipe.image_url || '/static/recipes_app/images/placeholder_image.png';

            recipeCard.innerHTML = `
                <a href="${detailUrl}">
                  <img src="${imageUrl}" alt="${recipe.title || 'Recipe Image'}" onerror="this.onerror=null;this.src='/static/recipes_app/images/placeholder_image.png';">
                  <p>${recipe.title || 'Untitled Recipe'}</p>
                </a>
            `;
            recipeContainer.appendChild(recipeCard);
        });
    }

    // --- Function to Fetch and Display Featured Recipes via AJAX ---
    function fetchAndDisplayFeaturedRecipes() {
        recipeContainer.innerHTML = "<p>Loading recipes...</p>"; // Show loading message
        if (featuredLoadingErrorDiv) featuredLoadingErrorDiv.textContent = ''; // Clear previous errors

        fetch(featuredRecipesUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.recipes) { // Assuming your AJAX view returns { "recipes": [...] }
                    displayFeaturedRecipes(data.recipes);
                } else {
                    console.error("No 'recipes' key found in featured recipes JSON response:", data);
                    displayFeaturedRecipes([]);
                }
            })
            .catch(error => {
                console.error('Error fetching featured recipes:', error);
                recipeContainer.innerHTML = '<p>Could not load featured recipes. Please try again later.</p>';
                if (featuredLoadingErrorDiv) featuredLoadingErrorDiv.textContent = 'Failed to load featured recipes. ' + error.message;
            });
    }

    // --- Initial Load of Featured Recipes ---
    fetchAndDisplayFeaturedRecipes();

    // --- Logout Functionality ---
    if (logoutBtn) {
        const logoutUrl = logoutBtn.dataset.logoutUrl; // Get URL from data attribute on logout button
        if (logoutUrl) {
            logoutBtn.addEventListener("click", function () {
                fetch(logoutUrl, {
                    method: 'POST', // Or GET, depending on your ajax_logout_view
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'), // From csrf_cookie.js
                         // 'Content-Type': 'application/json' // Only if sending a JSON body
                    }
                    // body: JSON.stringify({}) // If your logout view expects a JSON body
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.redirect_url) {
                        alert(data.message || "You have been logged out.");
                        window.location.href = data.redirect_url;
                    } else {
                        alert(data.error || 'Logout failed. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    alert('An error occurred during logout.');
                });
            });
        } else {
            console.warn("Logout button ('logout-btn') does not have a data-logout-url attribute.");
        }
    }
    // No explicit welcome message handling here, as it's rendered by the Django template.
    // If JS needs to interact with user data passed from the server (e.g., from a <script type="application/json"> tag),
    // that logic would go here.
});

// Note: The getCookie function should be available globally or imported if using modules.
// It's assumed to be in `csrf_cookie.js` and loaded in the HTML.
// function getCookie(name) { ... }