document.addEventListener("DOMContentLoaded", function () {
    // --- DOM Elements ---
    const recipeDataContainer = document.getElementById("recipeDataContainer");
    const recipeNameEl = document.getElementById("recipe-name");
    const recipeIntroEl = document.getElementById("recipe-intro");
    const recipeImageEl = document.getElementById("recipe-image");
    const ingredientsListEl = document.getElementById("ingredients-list");
    const instructionsListEl = document.getElementById("instructions-list");
    const loadingErrorDiv = document.getElementById("loading-error-message");
    const actionMessageDiv = document.getElementById("action-message");

    const editBtn = document.getElementById("edit-btn");
    const deleteBtn = document.getElementById("delete-btn");
    const favoriteBtn = document.getElementById("favorite-btn");

    // --- Check for essential container ---
    if (!recipeDataContainer || !recipeNameEl || !recipeIntroEl || !recipeImageEl || !ingredientsListEl || !instructionsListEl || !loadingErrorDiv ||!actionMessageDiv) {
        console.error("One or more essential recipe page elements are missing.");
        if (recipeNameEl) recipeNameEl.textContent = "Error: Page structure incomplete.";
        return;
    }

    // --- Get Data from HTML Attributes & Context ---
    const recipeId = recipeDataContainer.dataset.recipeId;
    const recipeDetailUrl = recipeDataContainer.dataset.recipeDetailUrl;
    const editUrlBase = recipeDataContainer.dataset.editUrlBase;
    const deleteUrlBase = recipeDataContainer.dataset.deleteUrlBase;
    const favoriteUrlBase = recipeDataContainer.dataset.favoriteUrlBase;

    const pageContextDataEl = document.getElementById("page-context-data");
    let pageContext = { isAuthenticated: false, isStaff: false, userId: null };
    if (pageContextDataEl) {
        try {
            pageContext = JSON.parse(pageContextDataEl.textContent);
        } catch (e) {
            console.error("Error parsing page context data:", e);
        }
    }

    if (!recipeId || !recipeDetailUrl) {
        displayLoadingError("Configuration error: Recipe ID or detail URL is missing. Cannot load recipe.");
        return;
    }

    // --- Helper to Display Loading Error ---
    function displayLoadingError(message) {
        recipeNameEl.textContent = "Error";
        recipeIntroEl.textContent = "";
        ingredientsListEl.innerHTML = "";
        instructionsListEl.innerHTML = "";
        if (recipeImageEl) recipeImageEl.style.display = 'none';
        if (loadingErrorDiv) loadingErrorDiv.textContent = message;
    }

    // --- Helper to Display Action Feedback ---
    function displayActionMessage(message, type) {
        if (actionMessageDiv) {
            actionMessageDiv.textContent = message;
            actionMessageDiv.className = type; // 'success' or 'error'
            actionMessageDiv.style.display = 'block';
            setTimeout(() => { actionMessageDiv.style.display = 'none'; }, 5000); // Hide after 5 seconds
        }
    }

    // --- Function to Populate Recipe Details ---
    function populateRecipeDetails(recipe) {
        if (!recipe) {
            displayLoadingError("Recipe data could not be loaded or is invalid.");
            return;
        }

        document.title = `${recipe.title || 'Recipe'} - Mama's Aklah`; // Update page title
        recipeNameEl.textContent = recipe.title || "Untitled Recipe";
        recipeIntroEl.textContent = recipe.intro || recipe.description || "";

        if (recipeImageEl) {
            recipeImageEl.src = recipe.image_url || "{% static 'recipes_app/images/placeholder_image.png' %}"; // Fallback needs real path
            recipeImageEl.alt = recipe.title || "Recipe Image";
            recipeImageEl.onerror = function() {
                this.src = '/static/recipes_app/images/placeholder_image.png'; // Ensure this path is correct
                this.alt = 'Image not found';
            };
        }

        if (ingredientsListEl) {
            if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
                ingredientsListEl.innerHTML = recipe.ingredients.map(ing => `<li>${escapeHtml(ing)}</li>`).join('');
            } else {
                ingredientsListEl.innerHTML = "<li>Ingredients not available.</li>";
            }
        }

        if (instructionsListEl) {
            if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
                instructionsListEl.innerHTML = recipe.instructions.map(step => `<li>${escapeHtml(step)}</li>`).join('');
            } else {
                instructionsListEl.innerHTML = "<li>Instructions not available.</li>";
            }
        }

        // --- Setup Action Buttons Based on User and Recipe ---
        if (pageContext.isAuthenticated) {
            // Favorite Button
            if (favoriteBtn && favoriteUrlBase) {
                favoriteBtn.style.display = "inline-block";
                favoriteBtn.textContent = recipe.is_favorited ? "Remove from Favorites" : "Add to Favorites";
                favoriteBtn.onclick = function(event) {
                    event.preventDefault();
                    toggleFavorite(recipe.id, recipe.is_favorited);
                };
            }

            // Edit and Delete Buttons (for staff/owner)
            // Assuming `recipe.can_edit_delete` is a boolean sent by the server
            // indicating if the current logged-in user can edit/delete this specific recipe.
            if (recipe.can_edit_delete || (pageContext.isStaff && recipe.user_id == pageContext.userId)) { // Example condition
                if (editBtn && editUrlBase) {
                    editBtn.style.display = "inline-block";
                    editBtn.href = editUrlBase.replace('0', recipe.id); // Construct edit URL
                }
                if (deleteBtn && deleteUrlBase) {
                    deleteBtn.style.display = "inline-block";
                    deleteBtn.onclick = function(event) {
                        event.preventDefault();
                        // Custom confirmation in layout, not browser
                        actionMessageDiv.innerHTML = `<span>Are you sure you want to delete the recipe "${recipe.title || 'this recipe'}"? This cannot be undone.</span><br><button id='confirm-delete-btn' style='margin-top:8px;background:#dc3545;color:#fff;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;'>Confirm Delete</button> <button id='cancel-delete-btn' style='margin-top:8px;background:#888;color:#fff;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;'>Cancel</button>`;
                        actionMessageDiv.className = 'error';
                        actionMessageDiv.style.display = 'block';
                        document.getElementById('confirm-delete-btn').onclick = function() {
                            deleteRecipeAction(recipe.id);
                            actionMessageDiv.style.display = 'none';
                        };
                        document.getElementById('cancel-delete-btn').onclick = function() {
                            actionMessageDiv.style.display = 'none';
                        };
                    };
                }
            }
        }
    }

    // --- Function to Fetch Recipe Details via AJAX ---
    fetch(recipeDetailUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText} (Status: ${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            if (data.recipe) { // Assuming the server returns { "recipe": { ... } }
                populateRecipeDetails(data.recipe);
            } else {
                throw new Error("Recipe data not found in server response.");
            }
        })
        .catch(error => {
            console.error('Error fetching recipe details:', error);
            displayLoadingError(`Could not load recipe details. ${error.message}`);
        });

    // --- Action: Toggle Favorite ---
    function toggleFavorite(currentRecipeId, isCurrentlyFavorited) {
        const url = favoriteUrlBase.replace('0', currentRecipeId);
        const csrfToken = getCookie('csrftoken');

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ recipe_id: currentRecipeId }) // Server might infer from URL param too
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayActionMessage(data.message, "success");
                if (favoriteBtn) {
                    favoriteBtn.textContent = data.is_favorited ? "Remove from Favorites" : "Add to Favorites";
                }
                // Optionally update a global favorite state or re-fetch recipe if needed
            } else {
                displayActionMessage(data.error || "Could not update favorite status.", "error");
            }
        })
        .catch(error => {
            console.error("Error toggling favorite:", error);
            displayActionMessage("An error occurred. Please try again.", "error");
        });
    }

    // --- Action: Delete Recipe ---
    function deleteRecipeAction(currentRecipeId) {
        const url = deleteUrlBase.replace('0', currentRecipeId);
        const csrfToken = getCookie('csrftoken');

        fetch(url, {
            method: 'POST', // Or 'DELETE', ensure your Django view handles it
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            // body: JSON.stringify({}) // Optional body
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message || "Recipe deleted successfully."); // Use alert for redirect confirmation
                if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                } else {
                    window.location.href = "/"; // Always go to home page
                }
            } else {
                displayActionMessage(data.error || "Could not delete recipe.", "error");
            }
        })
        .catch(error => {
            console.error("Error deleting recipe:", error);
            displayActionMessage("An error occurred while deleting. Please try again.", "error");
        });
    }

    // Basic HTML escaping function
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe; // Handle non-string inputs
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});

// Note: The getCookie function should be available globally or imported.
// It's assumed to be in `csrf_cookie.js` and loaded in the HTML.
// function getCookie(name) { ... }