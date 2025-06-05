from django.db import models
from django.contrib.auth.models import User # Standard Django User model
from django.utils import timezone
from django.urls import reverse
from django.templatetags.static import static

# It's good practice to define choices for CharFields outside the model if they are extensive,
# but for a few options, defining them in the model is fine.
class Recipe(models.Model):
    """
    Represents a recipe in the application.
    """
    COURSE_CHOICES = [
        ('appetizer', 'Appetizer'),
        ('main_course', 'Main Course'),
        ('dessert', 'Dessert'),
        ('side_dish', 'Side Dish'),
        ('beverage', 'Beverage'),
        ('other', 'Other'),
    ]

    # Core Recipe Information
    name = models.CharField(
        max_length=255,
        help_text="The name of the recipe."
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE, # If a user is deleted, their recipes are also deleted.
                                  # Consider models.SET_NULL if recipes should remain and be assigned to an anonymous user.
        related_name='recipes',
        help_text="The user who created this recipe."
    )
    description = models.TextField(
        blank=True, # Optional field
        help_text="A short introduction or description of the recipe."
    )
    ingredients = models.TextField(
        help_text="List all ingredients, one per line for clarity."
    )
    instructions = models.TextField(
        help_text="Provide step-by-step instructions, one step per line for clarity."
    )

    # Image for the recipe
    # Requires Pillow to be installed: pip install Pillow
    image = models.ImageField(
        upload_to='recipe_images/', # Files will be uploaded to MEDIA_ROOT/recipe_images/
        blank=True,                 # Image is optional
        null=True,
        help_text="Upload an image for the recipe (optional)."
    )

    # Categorization and Details
    course = models.CharField(
        max_length=50,
        choices=COURSE_CHOICES,
        default='main_course',
        help_text="The course category of the recipe."
    )
    preparation_time = models.PositiveIntegerField(
        blank=True, null=True, # In minutes
        help_text="Preparation time in minutes (optional)."
    )
    cooking_time = models.PositiveIntegerField(
        blank=True, null=True, # In minutes
        help_text="Cooking time in minutes (optional)."
    )
    servings = models.PositiveIntegerField(
        blank=True, null=True,
        help_text="Number of servings this recipe makes (optional)."
    )

    # Timestamps and Status
    created_at = models.DateTimeField(
        default=timezone.now, # Automatically set when the recipe is first created
        editable=False
    )
    updated_at = models.DateTimeField(
        auto_now=True # Automatically set every time the recipe is saved
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Is this recipe visible to everyone? Uncheck for private recipes."
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Should this recipe be featured on the home page?"
    )

    class Meta:
        ordering = ['-created_at'] # Default ordering for recipes (newest first)
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        # Assumes you have a URL pattern named 'recipe_detail_view_name' that takes a recipe_id
        return reverse('recipe_detail_view_name', kwargs={'recipe_id': self.pk})

    @property
    def image_url_resolved(self):
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        # Use logo.png as the default placeholder image
        return static('recipes_app/css/images/logo.png')

class Favorite(models.Model):
    """
    Represents a user's favorite recipe.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    favorited_at = models.DateTimeField(
        auto_now_add=True # Automatically set when the favorite is created
    )

    class Meta:
        unique_together = ('user', 'recipe')
        ordering = ['-favorited_at']
        verbose_name = "Favorite Recipe"
        verbose_name_plural = "Favorite Recipes"

    def __str__(self):
        return f"{self.user.username} favorites {self.recipe.name}"

# After defining or changing models, run:
# python manage.py makemigrations recipes_app
# python manage.py migrate
