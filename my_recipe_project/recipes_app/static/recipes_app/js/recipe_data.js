// Web _Technology_Project_Phase_2/recipe_data.js

// --- Initial Default Recipes (if localStorage is empty) ---
const initialRecipes = {
    "hamam": {
        title: "Hamam Mahshi", course: "main_course", intro: "A delicious Egyptian pigeon dish stuffed with rice and spices.", image: "images/hamam.png",
        ingredients: ["2 pigeons (cleaned)", "1 cup rice or freekeh", "2 tbsp butter", "1 small onion (chopped)", "1 tsp cumin", "1 tsp salt", "½ tsp black pepper", "4 cups chicken broth"],
        instructions: ["Clean pigeons thoroughly.", "In a bowl, mix rice/freekeh with melted butter, onion, and spices.", "Carefully stuff pigeons with the mixture.", "Secure openings with kitchen twine or toothpicks.", "Bring broth to boil, then reduce to simmer.", "Add stuffed pigeons and cook covered for 45-50 minutes.", "Optional: Broil or pan-fry briefly for crispy skin.", "Serve immediately."]
    },
    "mahshi": {
        title: "Stuffed Vegetables (Mahshi)", course: "main_course", intro: "A classic Egyptian dish made with vegetables stuffed with rice and herbs.", image: "images/mahshi.jpeg",
        ingredients: ["1 cup Egyptian rice", "½ cup chopped parsley", "½ cup chopped dill", "1 onion (finely diced)", "2 tomatoes (puréed)", "2 tbsp tomato paste", "½ cup vegetable oil", "1 tsp each: salt, pepper, cumin", "Assorted vegetables (zucchini, eggplant, peppers)", "Grape leaves (optional)"],
        instructions: ["Wash and hollow vegetables.", "Mix rice with herbs, onions, tomatoes, paste, oil and spices.", "Stuff vegetables ¾ full.", "Arrange tightly in pot.", "Mix 1 cup water with remaining tomato paste/purée, pour over.", "Add water just to cover vegetables.", "Place a heat-proof plate on top.", "Simmer covered for 45-50 minutes until rice is cooked.", "Let rest 10 minutes before serving."]
    },
    // ... (include other initial recipes: mosa23a, bashamel, kofta, molokhia) ...
    "mosa23a": {
        title: "Eggplant Casserole (Mosa23a)", course: "main_course", intro: "Layered eggplant dish with spiced minced meat and tomato sauce.", image: "images/mosag3a.jpeg",
        ingredients: ["2 large eggplants", "500g minced meat", "1 large onion (chopped)", "2 cloves garlic (minced)", "400g crushed tomatoes", "1 tbsp tomato paste", "1 tsp mixed spices (e.g., Baharat)", "Salt and pepper to taste", "Oil for frying"],
        instructions: ["Slice eggplants, salt, and let sit 30 min, then pat dry.", "Fry eggplant slices until golden; set aside.", "Sauté onion until soft, add garlic and minced meat, cook until browned.", "Stir in spices, salt, pepper, crushed tomatoes, and tomato paste.", "Simmer sauce for 10-15 minutes.", "Layer fried eggplant and meat sauce in a baking dish.", "Bake at 180°C (350°F) for 25-30 minutes.", "Let rest before serving."]
    },
    "bashamel": {
        title: "Macarona bel Bashamel", course: "main_course", intro: "Creamy baked pasta with minced meat filling topped with Béchamel sauce.", image: "images/macarona.jpeg",
        ingredients: ["500g penne pasta", "For Filling:", "500g minced meat", "1 onion (chopped)", "Salt, pepper, spices", "For Béchamel:", "100g butter", "100g flour", "1 liter milk (warm)", "Salt, white pepper, nutmeg"],
        instructions: ["Cook pasta until al dente; drain.", "Prepare filling: Sauté onion, add meat, cook until browned, season.", "Prepare Béchamel: Melt butter, stir in flour, cook for 1 min.", "Gradually whisk in warm milk until smooth.", "Simmer until thickened, season.", "Mix half the Béchamel with the pasta.", "Layer half the pasta in a baking dish.", "Spread meat filling over pasta.", "Top with remaining pasta.", "Pour remaining Béchamel over the top.", "Bake at 190°C (375°F) for 30-40 minutes until golden brown."]
    },
    "kofta": {
        title: "Kofta", course: "main_course", intro: "Grilled or baked skewers of seasoned minced meat.", image: "images/kofta.jpeg",
        ingredients: ["1kg minced lamb or beef (or mix)", "1 large onion (grated and squeezed dry)", "½ cup chopped fresh parsley", "1 tbsp ground cumin", "1 tsp ground coriander", "½ tsp paprika", "Salt and black pepper to taste"],
        instructions: ["In a large bowl, combine minced meat, grated onion, parsley, and all spices.", "Mix ingredients thoroughly by hand until well combined.", "Divide mixture into equal portions and shape onto skewers or form into patties/logs.", "If grilling, preheat grill. Grill kofta for 8-12 minutes, turning occasionally, until cooked through.", "If baking, place on a baking sheet and bake at 200°C (400°F) for 15-20 minutes.", "Serve hot with pita bread, tahini sauce, or rice."]
    },
    "molokhia": {
        title: "Molokhia", course: "main_course", intro: "Traditional green soup made from finely chopped jute mallow leaves.", image: "images/molokhia.png",
        ingredients: ["500g fresh or frozen molokhia leaves (finely chopped)", "4 cups chicken or rabbit broth", "4-5 cloves garlic (minced)", "1 tbsp ground coriander", "1 tbsp ghee or butter", "Salt to taste", "Optional: Pinch of chili flakes"],
        instructions: ["Bring broth to a simmer in a pot.", "Add the chopped molokhia leaves to the broth. Stir well.", "Let it simmer gently (do not boil vigorously) for 10-15 minutes.", "Prepare 'Ta'leya': In a separate small pan, heat ghee/butter.", "Add minced garlic and sauté until lightly golden.", "Add ground coriander and chili flakes (if using), sauté for 30 seconds more until fragrant.", "Pour the hot Ta'leya mixture directly into the molokhia pot (it should sizzle!). Stir well.", "Season with salt to taste.", "Serve immediately with rice or pita bread."]
    }
};

const RECIPE_STORAGE_KEY = 'recipes';

// --- Function to get all recipes ---
function getRecipes() {
    const recipesFromStorage = localStorage.getItem(RECIPE_STORAGE_KEY);
    if (recipesFromStorage) {
        try {
            // Basic check if it looks like our structure before parsing
            if (!recipesFromStorage.startsWith('{') || !recipesFromStorage.endsWith('}')) {
                console.warn("Invalid data format in localStorage, resetting.");
                throw new Error("Invalid format");
            }
            return JSON.parse(recipesFromStorage);
        } catch (e) {
            console.error("Error parsing recipes from localStorage, resetting.", e);
            localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(initialRecipes));
            return initialRecipes;
        }
    } else {
        localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(initialRecipes));
        return initialRecipes;
    }
}

// --- Function to add a new recipe ---
function addRecipe(newRecipe) {
    if (!newRecipe || !newRecipe.id || !newRecipe.title) {
        console.error("Invalid recipe data provided to addRecipe.");
        return false;
    }
    const currentRecipes = getRecipes();
    if (currentRecipes[newRecipe.id]) {
        // To prevent accidental overwrite, generate a slightly different ID if it exists
        newRecipe.id = newRecipe.id + '-' + Date.now();
        console.warn(`Recipe ID "${newRecipe.id}" collision, generated new ID: ${newRecipe.id}`);
    }
    currentRecipes[newRecipe.id] = newRecipe;
    try {
        localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(currentRecipes));
        console.log(`Recipe "${newRecipe.title}" added with ID ${newRecipe.id}.`);
        return true;
    } catch (e) {
        console.error("Error saving recipes to localStorage:", e);
        alert("Error saving recipe: Storage might be full or restricted.");
        return false;
    }
}

// --- Function to delete a recipe ---
function deleteRecipe(recipeId) {
    const currentRecipes = getRecipes();
    if (currentRecipes[recipeId]) {
        delete currentRecipes[recipeId]; // Remove the key from the object
        try {
            localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(currentRecipes));
            console.log(`Recipe ID "${recipeId}" deleted.`);
            return true;
        } catch (e) {
            console.error("Error saving recipes after deletion:", e);
            alert("Error saving changes after deleting recipe.");
            // Optional: Add the recipe back to prevent data loss if save fails?
            return false;
        }
    } else {
        console.warn(`Recipe ID "${recipeId}" not found for deletion.`);
        return false;
    }
}

// --- Function to update an existing recipe ---
function updateRecipe(recipeId, updatedData) {
    if (!recipeId || !updatedData || !updatedData.title) {
        console.error("Invalid data provided for updateRecipe.");
        return false;
    }
    const currentRecipes = getRecipes();
    if (currentRecipes[recipeId]) {
        // Ensure the ID remains the same within the updated data
        updatedData.id = recipeId;
        currentRecipes[recipeId] = updatedData; // Replace the existing recipe data
        try {
            localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(currentRecipes));
            console.log(`Recipe ID "${recipeId}" updated.`);
            return true;
        } catch (e) {
            console.error("Error saving recipes after update:", e);
            alert("Error saving changes after updating recipe.");
            return false;
        }

    } else {
        console.warn(`Recipe ID "${recipeId}" not found for update.`);
        return false;
    }
}


console.log("recipe_data.js loaded");