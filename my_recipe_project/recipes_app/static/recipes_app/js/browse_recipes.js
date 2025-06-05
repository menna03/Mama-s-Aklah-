document.addEventListener("DOMContentLoaded", function () {
    const recipeGrid = document.getElementById("recipeGrid");
    const searchInput = document.getElementById("searchInput");
    const logoutBtn = document.getElementById("logout-btn-browse");
    const loadingErrorMessageDiv = document.getElementById("loading-error-message"); // Get the error message div

    // --- Check if essential elements are present ---
    if (!recipeGrid) {
        console.error("Recipe grid container ('recipeGrid') not found.");
        if (loadingErrorMessageDiv) loadingErrorMessageDiv.textContent = 'Page structure error: Recipe grid missing.';
        return;
    }

    // Get AJAX URLs and other data from HTML data attributes
    const recipesUrl = recipeGrid.dataset.recipesUrl;
    let recipeDetailUrlBase = recipeGrid.dataset.recipeDetailUrlBase;

    if (!recipesUrl || !recipeDetailUrlBase) {
        console.error("Required data attributes for URLs not found on recipeGrid element.");
        if (loadingErrorMessageDiv) loadingErrorMessageDiv.textContent = 'Configuration error: Missing API URLs.';
        recipeGrid.innerHTML = '<p class="no-results">Could not load recipes due to a configuration error.</p>';
        return;
    }
    // Ensure the base URL for recipe details ends with a slash if it's part of a path structure
    // This is to correctly replace the placeholder '0/'
    if (recipeDetailUrlBase.includes('/0/')) {
        // It's fine as is, designed to replace '/0/'
    } else if (recipeDetailUrlBase.endsWith('0')) { // If it's just '.../recipe/0'
        recipeDetailUrlBase = recipeDetailUrlBase.substring(0, recipeDetailUrlBase.length -1); // Make it '.../recipe/'
    }


    // --- Function to Display Recipes ---
    function displayRecipes(recipesToDisplay) {
        recipeGrid.innerHTML = ""; // Clear current recipes or loading message

        if (!Array.isArray(recipesToDisplay) || recipesToDisplay.length === 0) {
            recipeGrid.innerHTML = '<p class="no-results">No recipes found.</p>';
            return;
        }

        recipesToDisplay.forEach(recipe => {
            const card = document.createElement("div");
            card.className = "recipe-card"; // Add a class for styling if needed

            // Construct the detail URL by replacing the placeholder
            // The server should provide the ID.
            const detailUrl = recipeDetailUrlBase.replace('0/', `${recipe.id}/`);


            // Image URL should come complete from the server.
            // If not, you might need a default static placeholder.
            // For this example, assume `recipe.image` is a valid URL or null.
            const imageUrl = recipe.image || "{% static 'recipes_app/images/placeholder_image.png' %}"; // Fallback needs to be a real static path
                                                                                                    // This {% static %} tag won't work here directly.
                                                                                                    // Better: const imageUrl = recipe.image || '/static/recipes_app/images/placeholder_image.png';
                                                                                                    // Or have the server provide a default image URL.

            card.innerHTML = `
                <a href="${detailUrl}">
                    <img src="${recipe.image_url || '/static/recipes_app/images/placeholder_image.png'}" alt="${recipe.title || 'Recipe Image'}" onerror="this.onerror=null;this.src='/static/recipes_app/images/placeholder_image.png';">
                    <p>${recipe.title || 'Untitled Recipe'}</p>
                    ${recipe.description ? `<small>${recipe.description.substring(0, 100)}...</small>` : ''}
                </a>
            `;
            recipeGrid.appendChild(card);
        });
    }

    // --- Function to Fetch and Display Recipes via AJAX ---
    function fetchAndDisplayRecipes(searchTerm = '') {
        recipeGrid.innerHTML = "<p>Loading recipes...</p>"; // Show loading message
        if (loadingErrorMessageDiv) loadingErrorMessageDiv.textContent = ''; // Clear previous errors

        let fetchUrl = recipesUrl;
        if (searchTerm) {
            // Append search term as a query parameter
            // Assumes your Django view `get_recipes_ajax` handles a 'search' query param
            fetchUrl += `?search=${encodeURIComponent(searchTerm)}`;
        }

        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.recipes) {
                    displayRecipes(data.recipes);
                } else {
                    console.error("No 'recipes' key found in JSON response:", data);
                    displayRecipes([]); // Display "No recipes found"
                }
            })
            .catch(error => {
                console.error('Error fetching recipes:', error);
                recipeGrid.innerHTML = '<p class="no-results">Could not load recipes. Please try again later.</p>';
                if (loadingErrorMessageDiv) loadingErrorMessageDiv.textContent = 'Failed to load recipes. ' + error.message;
            });
    }

    // --- Initial Display ---
    fetchAndDisplayRecipes();

    // --- Search Functionality ---
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                fetchAndDisplayRecipes(searchTerm); // Fetch recipes based on the current search term
            }, 300); // Debounce to avoid too many requests
        });
    } else {
        console.warn("Search input ('searchInput') not found.");
    }

    // --- Logout Functionality ---
    if (logoutBtn) {
        const logoutUrl = logoutBtn.dataset.logoutUrl;
        if (logoutUrl) {
            logoutBtn.addEventListener("click", () => {
                fetch(logoutUrl, {
                    method: 'POST', // Or GET, depending on your ajax_logout_view
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'), // From csrf_cookie.js
                        'Content-Type': 'application/json' // If sending JSON body, not needed for simple POST
                    },
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
            console.warn("Logout button ('logout-btn-browse') does not have a data-logout-url attribute.");
        }
    } else {
        // console.log("Logout button not found on this page (this might be intentional if user is not logged in).");
    }

});

// Note: The getCookie function should be available globally or imported if using modules.
// It's assumed to be in `csrf_cookie.js` and loaded in the HTML.
// function getCookie(name) { ... }