document.addEventListener('DOMContentLoaded', function () {
    const favoritesList = document.getElementById('favorites-list');

    if (!favoritesList) return;

    favoritesList.addEventListener('click', function (event) {
        if (!event.target.classList.contains('remove-favorite-btn')) return;

        const button = event.target;
        const recipeId = button.dataset.recipeId;
        const url = button.dataset.actionUrl;
        const csrfToken = getCookie('csrftoken');

        if (!url) {
            console.error('Action URL not found for favorite button.');
            showNotification('Could not process request. URL missing.', true);
            return;
        }
        if (!csrfToken) {
            console.error('CSRF token not found.');
            showNotification('Security token missing. Please refresh.', true);
            return;
        }

        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response =>
                response.json().then(data => ({ ok: response.ok, status: response.status, data }))
            )
            .then(({ ok, data }) => {
                if (ok && data.success && data.is_favorited === false) {
                    const cardToRemove = document.getElementById(`fav-recipe-card-${recipeId}`);
                    if (cardToRemove) {
                        cardToRemove.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        cardToRemove.style.opacity = '0';
                        cardToRemove.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            cardToRemove.remove();
                            if (favoritesList.children.length === 0) {
                                const emptyMsg = document.getElementById('empty-favorites-message');
                                if (emptyMsg) emptyMsg.style.display = 'block';
                            }
                        }, 500);
                    }
                    showNotification(data.message || `Recipe removed from favorites.`);
                } else {
                    showNotification(data.message || data.error || 'Error updating favorites.', true);
                }
            })
            .catch(error => {
                console.error('Error removing favorite:', error);
                showNotification(error.message || 'An unexpected error occurred. Please try again.', true);
            });
    });
});
