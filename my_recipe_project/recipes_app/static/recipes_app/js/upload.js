document.addEventListener("DOMContentLoaded", function () {
    // --- Get Form Elements ---
    const uploadForm = document.getElementById("upload-form");
    // const formHeading = document.getElementById("form-heading"); // Will be set by Django template
    const submitButton = document.getElementById("submit-button"); // Will be set by Django template
    // const recipeIdField = document.getElementById("recipeId"); // Managed by form's data-recipe-id
    // const existingImageField = document.getElementById("existingImage"); // Managed by form-context-data or Django form

    const imageFileInput = document.getElementById("imageFileInput"); // Use the correct ID from the template
    const imagePreview = document.getElementById("imagePreview");
    const imageFileNameSpan = document.getElementById("imageFileName"); // Span to show selected file name
    const clearButton = document.getElementById("clear-btn");
    const formMessageDiv = document.getElementById("form-message"); // For AJAX feedback

    // --- Basic Element Check ---
    if (!uploadForm || !submitButton || !imageFileInput || !imagePreview || !imageFileNameSpan || !clearButton || !formMessageDiv) {
        console.error("One or more critical upload form elements not found! Check HTML IDs.");
        if (formMessageDiv) {
            formMessageDiv.textContent = "Error initializing the form. Please check console.";
            formMessageDiv.className = "error";
            formMessageDiv.style.display = "block";
        }
        return;
    }

    // --- Get Context Data from HTML (passed by Django template) ---
    const formContextDataEl = document.getElementById("form-context-data");
    let formContext = {
        formMode: "add", // Default to add
        recipeId: null,
        existingImageUrl: null,
        // ajaxUrl: uploadForm.dataset.ajaxUrl // Get from form directly
    };

    if (formContextDataEl) {
        try {
            formContext = JSON.parse(formContextDataEl.textContent);
        } catch (e) {
            console.error("Error parsing form context data:", e);
        }
    }
    // Override with form's data attributes if they are more direct
    formContext.formMode = uploadForm.dataset.mode || formContext.formMode;
    formContext.recipeId = uploadForm.dataset.recipeId || formContext.recipeId;
    const ajaxUrl = uploadForm.dataset.ajaxUrl;

    if (!ajaxUrl) {
        displayFormMessage("Form submission URL is not configured. Please contact support.", "error");
        console.error("AJAX URL for form submission is missing from uploadForm.dataset.ajaxUrl.");
        submitButton.disabled = true;
        return;
    }


    // --- Event Listener for File Input Change (Image Preview) ---
    if (imageFileInput) {
        imageFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block'; // Show preview
                    imagePreview.classList.add('has-image');
                    imageFileNameSpan.textContent = file.name;
                }
                reader.readAsDataURL(file);
            } else {
                // Clear preview if no file selected
                imagePreview.src = '#';
                imagePreview.style.display = 'none';
                imagePreview.classList.remove('has-image');
                imageFileNameSpan.textContent = '';
            }
        });
    }

    // --- Clear Button Handler ---
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            imagePreview.src = '#';
            imagePreview.style.display = 'none';
            imagePreview.classList.remove('has-image');
            if (imageFileNameSpan) imageFileNameSpan.textContent = '';
        });
    }

    // --- Populate Form for Edit Mode (Handled by Django Template Rendering) ---
    // The Django template `Upload.html` will be rendered with the form pre-filled
    // if `recipe_form.instance.pk` exists. So, `populateFormForEdit` is no longer needed here
    // for initial population. JS might only adjust UI elements based on `formContext.formMode`.

    if (formContext.formMode === 'edit' && formContext.existingImageUrl) {
        // If there's an existing image, and the Django form didn't already show it via a widget,
        // you could set the preview here. However, Django's ImageField widget usually handles this.
        // For instance, if `currentImagePreview` element exists from template:
        const currentImagePreviewEl = document.getElementById("currentImagePreview");
        if (currentImagePreviewEl && !currentImagePreviewEl.src) { // If not already set by Django
             // currentImagePreviewEl.src = formContext.existingImageUrl; // This is already done by template
        }
    }


    // --- Form Submission Handler ---
    uploadForm.addEventListener("submit", function (event) {
        event.preventDefault();
        displayFormMessage("", ""); // Clear previous messages
        submitButton.disabled = true;
        submitButton.textContent = formContext.formMode === 'edit' ? "Updating..." : "Uploading...";

        const formData = new FormData(uploadForm); // Collects all form data, including files

        // Client-side validation (can be basic, server-side is key)
        const name = formData.get('name'); // Django form field name for title
        const ingredients = formData.get('ingredients'); // Django form field name
        const description = formData.get('description'); // Django form field name
        const instructions = formData.get('instructions'); // Django form field name

        if (!name || !ingredients || !description || !instructions) {
            displayFormMessage("Please fill in all required recipe fields.", "error");
            enableSubmitButton();
            return;
        }

        // CSRF token should be included in the form by {% csrf_token %}
        // FormData will pick it up automatically if it's a standard input field.
        // If not, or for extra safety:
        // const csrfToken = getCookie('csrftoken');
        // if (csrfToken) {
        //     formData.append('csrfmiddlewaretoken', csrfToken);
        // } else {
        //     displayFormMessage("Security token missing. Please refresh and try again.", "error");
        //     enableSubmitButton();
        //     return;
        // }

        fetch(ajaxUrl, {
            method: 'POST',
            body: formData, // FormData handles multipart/form-data and Content-Type
            // DO NOT set Content-Type header manually when using FormData with fetch
            // headers: { 'X-CSRFToken': csrfToken } // Django usually checks token from form data first
        })
        .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
        .then(({ok, status, data}) => {
            if (ok && data.success) {
                displayFormMessage(data.message || (formContext.formMode === 'edit' ? "Recipe updated successfully!" : "Recipe added successfully!"), "success");
                formMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // If on the Browse Recipes page, refresh the recipe list
                if (window.location.pathname.includes('/browse')) {
                    if (typeof fetchAndDisplayRecipes === 'function') {
                        fetchAndDisplayRecipes();
                    } else {
                        window.location.reload();
                    }
                } else {
                    setTimeout(() => {
                        window.location.href = "/browse/";
                    }, 2000);
                }
            } else {
                let errorMessage = data.error || `Failed to ${formContext.formMode === 'edit' ? 'update' : 'add'} recipe.`;
                if (data.errors) {
                    let messages = [];
                    for (const field in data.errors) {
                        messages.push(`<strong>${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${data.errors[field].join(", ")}`);
                    }
                    errorMessage = messages.join("<br>");
                }
                displayFormMessage(errorMessage, "error", true);
                enableSubmitButton();
            }
        })
        .catch(error => {
            console.error('Form submission AJAX error:', error);
            displayFormMessage("A network or server error occurred: " + error.message, "error");
            enableSubmitButton();
        });
    });

    function displayFormMessage(message, type, allowHtml = false) {
        if (allowHtml) {
            formMessageDiv.innerHTML = message;
        } else {
            formMessageDiv.textContent = message;
        }
        formMessageDiv.className = type; // 'success' or 'error'
        formMessageDiv.style.display = message ? 'block' : 'none';
    }

    function enableSubmitButton() {
        submitButton.disabled = false;
        submitButton.textContent = formContext.formMode === 'edit' ? "Update Recipe" : "Upload Recipe";
    }
});
