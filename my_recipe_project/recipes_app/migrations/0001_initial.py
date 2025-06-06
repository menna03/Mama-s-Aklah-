# Generated by Django 5.2.1 on 2025-05-17 15:05

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Recipe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='The name of the recipe.', max_length=255)),
                ('description', models.TextField(blank=True, help_text='A short introduction or description of the recipe.')),
                ('ingredients', models.TextField(help_text='List all ingredients, one per line for clarity.')),
                ('instructions', models.TextField(help_text='Provide step-by-step instructions, one step per line for clarity.')),
                ('image', models.ImageField(blank=True, help_text='Upload an image for the recipe (optional).', null=True, upload_to='recipe_images/')),
                ('course', models.CharField(choices=[('appetizer', 'Appetizer'), ('main_course', 'Main Course'), ('dessert', 'Dessert'), ('side_dish', 'Side Dish'), ('beverage', 'Beverage'), ('other', 'Other')], default='main_course', help_text='The course category of the recipe.', max_length=50)),
                ('preparation_time', models.PositiveIntegerField(blank=True, help_text='Preparation time in minutes (optional).', null=True)),
                ('cooking_time', models.PositiveIntegerField(blank=True, help_text='Cooking time in minutes (optional).', null=True)),
                ('servings', models.PositiveIntegerField(blank=True, help_text='Number of servings this recipe makes (optional).', null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_public', models.BooleanField(default=True, help_text='Is this recipe visible to everyone? Uncheck for private recipes.')),
                ('is_featured', models.BooleanField(default=False, help_text='Should this recipe be featured on the home page?')),
                ('author', models.ForeignKey(help_text='The user who created this recipe.', on_delete=django.db.models.deletion.CASCADE, related_name='recipes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Recipe',
                'verbose_name_plural': 'Recipes',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('favorited_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to=settings.AUTH_USER_MODEL)),
                ('recipe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='recipes_app.recipe')),
            ],
            options={
                'verbose_name': 'Favorite Recipe',
                'verbose_name_plural': 'Favorite Recipes',
                'ordering': ['-favorited_at'],
                'unique_together': {('user', 'recipe')},
            },
        ),
    ]
