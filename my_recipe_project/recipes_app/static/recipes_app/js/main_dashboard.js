document.addEventListener("DOMContentLoaded", function () {
    const chefRecipeContainer = document.getElementById("chefRecipeContainer");
    const errorDiv = document.getElementById("chef-recipe-error-message");

    if (!chefRecipeContainer) {
        if (errorDiv) errorDiv.textContent = 'Page error: Recipe container missing.';
        return;
    }

    const chefRecipesUrl = chefRecipeContainer.dataset.chefRecipesUrl;
    let recipeDetailUrlBase = chefRecipeContainer.dataset.recipeDetailUrlBase;

    if (!chefRecipesUrl || !recipeDetailUrlBase) {
        if (errorDiv) errorDiv.textContent = 'Configuration error: Missing API URLs.';
        chefRecipeContainer.innerHTML = '<p>Could not load recipes due to a configuration error.</p>';
        return;
    }
    if (recipeDetailUrlBase.endsWith('0')) {
        recipeDetailUrlBase = recipeDetailUrlBase.substring(0, recipeDetailUrlBase.length - 1);
    }

    function displayChefRecipes(recipes) {
        chefRecipeContainer.innerHTML = "";
        if (!Array.isArray(recipes) || recipes.length === 0) {
            chefRecipeContainer.innerHTML = '<p>No recipes found. Click "+ Add New Recipe" to create one.</p>';
            return;
        }
        recipes.forEach(recipe => {
            const card = document.createElement("div");
            card.className = "menu-item";
            const detailUrl = recipeDetailUrlBase.replace('0/', `${recipe.id}/`);
            card.innerHTML = `
                <a href="${detailUrl}">
                    <img src="${recipe.image_url || '/static/recipes_app/images/logo.png'}" alt="Recipe Image" style="width:100%;height:160px;object-fit:cover;border-radius:8px 8px 0 0;">
                    <h3>${recipe.name}</h3>
                </a>
            `;
            chefRecipeContainer.appendChild(card);
        });
    }

    function fetchAndDisplayChefRecipes() {
        chefRecipeContainer.innerHTML = "<p>Loading your recipes...</p>";
        if (errorDiv) errorDiv.textContent = '';
        fetch(chefRecipesUrl)
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then(data => {
                if (data.recipes) {
                    displayChefRecipes(data.recipes);
                } else {
                    displayChefRecipes([]);
                }
            })
            .catch(error => {
                chefRecipeContainer.innerHTML = '<p>Could not load recipes. Please try again later.</p>';
                if (errorDiv) errorDiv.textContent = 'Failed to load recipes. ' + error.message;
            });
    }

    fetchAndDisplayChefRecipes();
}); 