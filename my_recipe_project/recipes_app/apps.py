from django.apps import AppConfig

class RecipesAppConfig(AppConfig):
    """
    Application configuration for the 'recipes_app'.
    """
    # default_auto_field specifies the type of primary key to use for models
    # in this app when one isn't explicitly defined.
    # 'django.db.models.BigAutoField' is recommended for new projects.
    default_auto_field = 'django.db.models.BigAutoField'

    # The name attribute is the full Python path to the application.
    # This is usually automatically set correctly when the app is created.
    name = 'recipes_app'

    # verbose_name is a human-readable name for this application.
    # It's used in the Django admin interface, for example.
    # verbose_name = "Recipe Management" # Optional: Uncomment and customize if needed
