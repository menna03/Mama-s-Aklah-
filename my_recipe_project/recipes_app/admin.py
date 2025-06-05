from django.contrib import admin
from .models import Recipe # Import your Recipe model (and any other models you want in admin)

# To customize how your models are displayed in the admin interface,
# you can create ModelAdmin classes.

class RecipeAdmin(admin.ModelAdmin):
    """
    Customization for the Recipe model in the Django admin interface.
    """
    list_display = ('name', 'author', 'course', 'created_at', 'updated_at', 'is_public') # Fields to display in the list view
    list_filter = ('course', 'is_public', 'author', 'created_at') # Fields to filter by in the sidebar
    search_fields = ('name', 'description', 'author__username') # Fields to search by
    readonly_fields = ('created_at', 'updated_at') # Fields that should be read-only in the edit form
    # prepopulated_fields = {'slug': ('name',)} # Example: if you have a slug field that should be auto-populated from the name

    fieldsets = (
        (None, {
            'fields': ('name', 'author', 'course', 'is_public')
        }),
        ('Content', {
            'fields': ('description', 'ingredients', 'instructions', 'image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',) # Makes this section collapsible
        }),
    )
    # If you have many-to-many fields or inline related models, you can define them here too.
    # For example, if ingredients were a separate model linked via ManyToMany:
    # filter_horizontal = ('ingredients_m2m_field_name',)

# Register your models here
admin.site.register(Recipe, RecipeAdmin) # Register the Recipe model with its custom admin options

# If you have other models, register them as well:
# from .models import Category, Favorite
#
# class CategoryAdmin(admin.ModelAdmin):
#     list_display = ('name',)
#     search_fields = ('name',)
#
# class FavoriteAdmin(admin.ModelAdmin):
#     list_display = ('user', 'recipe', 'favorited_at')
#     list_filter = ('user', 'favorited_at')
#
# admin.site.register(Category, CategoryAdmin)
# admin.site.register(Favorite, FavoriteAdmin)

# Make sure your models (Recipe, Category, Favorite, etc.) are defined in recipes_app/models.py
# For example, a basic Recipe model might look like this in models.py:
"""
# In recipes_app/models.py:
from django.db import models
from django.contrib.auth.models import User # Or your custom user model
from django.utils import timezone

class Recipe(models.Model):
    COURSE_CHOICES = [
        ('appetizer', 'Appetizer'),
        ('main_course', 'Main Course'),
        ('dessert', 'Dessert'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    description = models.TextField(help_text="A short introduction or description of the recipe.")
    ingredients = models.TextField(help_text="List ingredients, one per line.")
    instructions = models.TextField(help_text="List instructions, one step per line.")
    image = models.ImageField(upload_to='recipe_images/', blank=True, null=True, help_text="Upload an image for the recipe.")
    course = models.CharField(max_length=50, choices=COURSE_CHOICES, default='main_course')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=True, help_text="Is this recipe visible to everyone?")
    # Add other fields like preparation_time, cooking_time, difficulty, etc.

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']
"""
