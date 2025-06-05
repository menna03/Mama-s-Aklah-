from django.urls import path
from . import views # Import views from the current app

# app_name = 'recipes_app' # Optional for namespacing

urlpatterns = [
    # --- Standard Page Views ---
    path('', views.home_view, name='home_view_name'), # <<< THIS LINE REFERENCES home_view
    path('login/', views.login_page_view, name='login_page_view_name'),
    path('signup/', views.signup_page_view, name='signup_page_view_name'),
    path('browse/', views.browse_recipes_view, name='browse_recipes_view_name'),
    path('recipe/<int:recipe_id>/', views.recipe_detail_view, name='recipe_detail_view_name'),
    path('dashboard/main/', views.main_dashboard_view, name='main_dashboard_view_name'),
    path('dashboard/upload/', views.upload_recipe_view, name='upload_recipe_view_name'),
    path('dashboard/edit/<int:recipe_id>/', views.upload_recipe_view, name='edit_recipe_view_name'),
    path('favorites/', views.favorites_page_view, name='favorites_page_view_name'),

    # --- AJAX Endpoints ---
    path('ajax/recipes/all/', views.get_recipes_ajax, name='get_recipes_ajax_name'),
    path('ajax/recipes/featured/', views.get_featured_recipes_ajax, name='get_featured_recipes_ajax_name'),
    path('ajax/recipes/chef/', views.get_chef_recipes_ajax, name='get_chef_recipes_ajax_name'),
    path('ajax/recipe/<int:recipe_id>/detail/', views.get_recipe_detail_ajax, name='get_recipe_detail_ajax_name'),
    path('ajax/auth/login/', views.ajax_login_view, name='ajax_login_view_name'),
    path('ajax/auth/logout/', views.ajax_logout_view, name='ajax_logout_view_name'),
    path('ajax/auth/signup/', views.ajax_signup_view, name='ajax_signup_view_name'),
    path('ajax/recipe/add/', views.ajax_add_recipe, name='ajax_add_recipe_name'),
    path('ajax/recipe/edit/<int:recipe_id>/', views.ajax_edit_recipe, name='ajax_edit_recipe_name'),
    path('ajax/recipe/delete/<int:recipe_id>/', views.ajax_delete_recipe, name='delete_recipe_ajax_name'),
    path('ajax/recipe/favorite/<int:recipe_id>/toggle/', views.ajax_toggle_favorite, name='toggle_favorite_ajax_name'),
]
