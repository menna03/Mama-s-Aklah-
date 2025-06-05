"""
URL configuration for my_recipe_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/X.Y/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include # Make sure include is imported
from django.conf import settings # Required for static and media files in development
from django.conf.urls.static import static # Required for static and media files in development

urlpatterns = [
    path('admin/', admin.site.urls), # URLs for the Django admin interface
    path('', include('recipes_app.urls')), # Include URLs from your 'recipes_app'
    # Add other app URLs here if you have more apps, e.g., path('accounts/', include('django.contrib.auth.urls')),
]

# Serve static and media files during development
# In production, your web server (e.g., Nginx, Apache) should be configured to serve these.
if settings.DEBUG:
    # Serve static files (CSS, JavaScript, app-specific images)
    # Django's runserver automatically serves static files from apps' 'static' directories
    # and from STATICFILES_DIRS when DEBUG is True.
    # However, explicitly adding it can be done like this, though usually not necessary for STATIC_URL.
    # urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) # STATIC_ROOT is for collectstatic

    # Serve media files (user-uploaded files like recipe images)
    # This is crucial for seeing uploaded images during development.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Note on static files in development:
# When DEBUG is True and 'django.contrib.staticfiles' is in INSTALLED_APPS,
# the development server (runserver) automatically serves static files found
# through the staticfiles finders (i.e., in each app's 'static/' subdirectory
# and any directories listed in STATICFILES_DIRS).
# The `static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)` line
# is more relevant for serving the `STATIC_ROOT` directory after `collectstatic` has been run,
# which is typically not how static files are served during active development of app-specific static files.
# Serving MEDIA_URL is always necessary to add manually for development.