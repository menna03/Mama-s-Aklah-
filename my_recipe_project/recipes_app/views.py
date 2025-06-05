import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden, Http404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Q
from django.urls import reverse_lazy

from .models import Recipe, Favorite
from .forms import RecipeForm, CustomUserCreationForm # This should now use the updated form

# --- Helper Decorators/Functions ---
# (Keep staff_member_required as is)
def staff_member_required(view_func):
    actual_decorator = user_passes_test(
        lambda u: u.is_authenticated and u.is_staff,
        login_url='login_page_view_name',
        redirect_field_name=None
    )
    return actual_decorator(view_func)

# --- Standard Page Rendering Views ---
# (Keep home_view, login_page_view, etc., as they were in django_views_py_signup_fix artifact)
def home_view(request):
    return render(request, 'recipes_app/Home.html')

def login_page_view(request):
    if request.user.is_authenticated:
        return redirect('home_view_name')
    return render(request, 'recipes_app/login.html')

def signup_page_view(request):
    if request.user.is_authenticated:
        return redirect('home_view_name')
    return render(request, 'recipes_app/signup.html')

def browse_recipes_view(request):
    return render(request, 'recipes_app/Browse_Recipes.html')

def recipe_detail_view(request, recipe_id):
    try:
        recipe = Recipe.objects.get(pk=recipe_id)
        can_view = recipe.is_public or \
                   (request.user.is_authenticated and (request.user == recipe.author or request.user.is_staff))
        if not can_view:
            raise Http404("Recipe not found or you don't have permission to view it.")
        context = {'recipe_id': recipe_id}
        return render(request, 'recipes_app/Recipe_Page.html', context)
    except Recipe.DoesNotExist:
        raise Http404("Recipe not found.")

@login_required(login_url='login_page_view_name')
@staff_member_required
def main_dashboard_view(request):
    return render(request, 'recipes_app/main.html')

@login_required(login_url='login_page_view_name')
@staff_member_required
def upload_recipe_view(request, recipe_id=None):
    if recipe_id:
        recipe_instance = get_object_or_404(Recipe, pk=recipe_id)
        if not (request.user == recipe_instance.author or request.user.is_staff):
            return HttpResponseForbidden("You don't have permission to edit this recipe.")
        form = RecipeForm(instance=recipe_instance)
    else:
        form = RecipeForm()
        recipe_instance = None
    context = {'recipe_form': form, 'recipe_instance': recipe_instance}
    return render(request, 'recipes_app/Upload.html', context)

@login_required(login_url='login_page_view_name')
def favorites_page_view(request):
    user_favorites = Favorite.objects.filter(user=request.user).select_related('recipe')
    favorite_recipes = [fav.recipe for fav in user_favorites]
    context = {'favorite_recipes': favorite_recipes}
    return render(request, 'recipes_app/Favorites_Page.html', context)

# --- AJAX Data Fetching Views ---
# (Keep get_recipes_ajax, get_featured_recipes_ajax, etc. as they were)
@require_GET
def get_recipes_ajax(request):
    search_term = request.GET.get('search', '').strip()
    limit = 50
    if request.GET.get('home') == '1' or request.GET.get('featured') == '1':
        limit = 5
    # Show all recipes to staff, only public to others
    if request.user.is_authenticated and request.user.is_staff:
        recipes_query = Recipe.objects.all()
    else:
        recipes_query = Recipe.objects.filter(is_public=True)
    if search_term:
        recipes_query = recipes_query.filter(
            Q(name__icontains=search_term) | Q(description__icontains=search_term) | Q(ingredients__icontains=search_term)
        )
    recipes_data = [{
        'id': recipe.pk,
        'name': recipe.name,
        'title': recipe.name,
        'description': recipe.description[:150] + '...' if recipe.description and len(recipe.description) > 150 else recipe.description,
        'image_url': recipe.image_url_resolved,
        'author_username': recipe.author.username,
        'course': recipe.get_course_display(),
        'is_public': recipe.is_public,
    } for recipe in recipes_query.select_related('author').order_by('-created_at')[:limit]]
    return JsonResponse({'recipes': recipes_data})

@require_GET
def get_featured_recipes_ajax(request):
    # Only show recipes that are both public and featured on the home page
    featured_recipes = Recipe.objects.filter(is_public=True, is_featured=True).order_by('-created_at')[:5]
    recipes_data = [{
        'id': recipe.pk,
        'name': recipe.name,
        'title': recipe.name,
        'image_url': recipe.image_url_resolved,
        'description': recipe.description[:100] + '...' if recipe.description and len(recipe.description) > 100 else recipe.description,
    } for recipe in featured_recipes]
    return JsonResponse({'recipes': recipes_data})

@require_GET
@login_required(login_url='login_page_view_name')
@staff_member_required
def get_chef_recipes_ajax(request):
    recipes_query = Recipe.objects.all().order_by('-created_at')
    recipes_data = [{
        'id': recipe.pk, 'name': recipe.name,
        'image_url': recipe.image.url if recipe.image else None,
        'is_public': recipe.is_public,
    } for recipe in recipes_query[:100]]
    return JsonResponse({'recipes': recipes_data})

@require_GET
def get_recipe_detail_ajax(request, recipe_id):
    recipe = get_object_or_404(Recipe.objects.select_related('author'), pk=recipe_id)
    can_view = recipe.is_public or (request.user.is_authenticated and (request.user == recipe.author or request.user.is_staff))
    if not can_view:
        return JsonResponse({'error': 'Recipe not found or access denied.'}, status=404)
    is_favorited = request.user.is_authenticated and Favorite.objects.filter(user=request.user, recipe=recipe).exists()
    can_edit_delete = request.user.is_authenticated and (request.user == recipe.author or request.user.is_staff)
    recipe_data = {
        'id': recipe.pk,
        'name': recipe.name,
        'title': recipe.name,
        'author_id': recipe.author.id,
        'author_username': recipe.author.username,
        'description': recipe.description,
        'ingredients': recipe.ingredients.splitlines() if recipe.ingredients else [],
        'instructions': recipe.instructions.splitlines() if recipe.instructions else [],
        'image_url': recipe.image.url if recipe.image else None,
        'course': recipe.get_course_display(),
        'preparation_time': recipe.preparation_time,
        'cooking_time': recipe.cooking_time,
        'servings': recipe.servings,
        'created_at': recipe.created_at.strftime("%b %d, %Y, %I:%M %p"),
        'is_public': recipe.is_public,
        'is_favorited': is_favorited,
        'can_edit_delete': can_edit_delete,
    }
    return JsonResponse({'recipe': recipe_data})

# --- AJAX Authentication Views ---
# (Keep ajax_login_view and ajax_logout_view as they were)
@require_POST
def ajax_login_view(request):
    try:
        data = json.loads(request.body)
        email_or_username = data.get('email', '').strip()
        password = data.get('password', '')
        if not email_or_username or not password:
            return JsonResponse({'success': False, 'error': 'Email/Username and password are required.'}, status=400)
        user = authenticate(request, username=email_or_username, password=password)
        if user is None and '@' in email_or_username:
            try:
                user_obj = User.objects.get(email__iexact=email_or_username)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist: pass
        if user is not None:
            auth_login(request, user)
            redirect_url = str(reverse_lazy('home_view_name'))
            return JsonResponse({'success': True, 'message': 'Login successful!', 'redirect_url': redirect_url})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid credentials. Please try again.'}, status=401)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data in request body.'}, status=400)
    except Exception as e:
        print(f"Login Error: {e}")
        return JsonResponse({'success': False, 'error': 'An server error occurred during login.'}, status=500)

@require_POST
@login_required(login_url='login_page_view_name')
def ajax_logout_view(request):
    auth_logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully.', 'redirect_url': str(reverse_lazy('login_page_view_name'))})


@require_POST
def ajax_signup_view(request):
    try:
        print(f"Raw signup request body: {request.body.decode('utf-8')}")
        data = json.loads(request.body)
        print(f"Parsed signup data from client: {data}")
    except json.JSONDecodeError:
        print("Signup Error: Invalid JSON data received.")
        return JsonResponse({'success': False, 'error': 'Invalid JSON data. Please ensure data is correctly formatted.'}, status=400)

    # The data dictionary from JS has keys: 'username', 'email', 'password', 'password2', 'is_staff'
    # UserCreationForm (and our CustomUserCreationForm) expects 'username', 'email' (from our addition),
    # and will look for 'password' and 'password2' for its password fields.
    # We pass the whole 'data' dictionary directly. The form will only use the fields it knows.
    form = CustomUserCreationForm(data)
    if form.is_valid():
        user = form.save() # The form's save method now handles setting is_staff=False
        print(f"User {user.username} created successfully. Staff status: {user.is_staff}")
        return JsonResponse({
            'success': True,
            'message': 'Account created successfully! Please log in.',
            'redirect_url': str(reverse_lazy('login_page_view_name'))
        })
    else:
        print(f"Signup form errors: {form.errors.get_json_data()}")
        return JsonResponse({'success': False, 'errors': form.errors.get_json_data()}, status=400)

# --- AJAX Recipe CRUD Views ---
# (Keep ajax_add_recipe, ajax_edit_recipe, ajax_delete_recipe, ajax_toggle_favorite as they were)
@require_POST
@login_required(login_url='login_page_view_name')
@staff_member_required
def ajax_add_recipe(request):
    form = RecipeForm(request.POST, request.FILES)
    if form.is_valid():
        recipe = form.save(commit=False)
        recipe.author = request.user
        # Force admin recipes to be public
        if request.user.is_staff:
            recipe.is_public = True
        recipe.save()
        return JsonResponse({
            'success': True, 'message': 'Recipe added successfully!', 'recipe_id': recipe.pk,
            'redirect_url': str(reverse_lazy('recipe_detail_view_name', kwargs={'recipe_id': recipe.pk}))
        })
    else:
        return JsonResponse({'success': False, 'errors': form.errors.get_json_data()}, status=400)

@require_POST
@login_required(login_url='login_page_view_name')
def ajax_edit_recipe(request, recipe_id):
    recipe_instance = get_object_or_404(Recipe, pk=recipe_id)
    if not (request.user == recipe_instance.author or request.user.is_staff):
        return JsonResponse({'success': False, 'error': "You don't have permission to edit this recipe."}, status=403)
    form = RecipeForm(request.POST, request.FILES, instance=recipe_instance)
    if form.is_valid():
        recipe = form.save(commit=False)
        # Force admin recipes to be public
        if request.user.is_staff:
            recipe.is_public = True
        recipe.save()
        return JsonResponse({
            'success': True, 'message': 'Recipe updated successfully!', 'recipe_id': recipe.pk,
            'redirect_url': str(reverse_lazy('recipe_detail_view_name', kwargs={'recipe_id': recipe.pk}))
        })
    else:
        return JsonResponse({'success': False, 'errors': form.errors.get_json_data()}, status=400)

@require_POST
@login_required(login_url='login_page_view_name')
def ajax_delete_recipe(request, recipe_id):
    recipe_instance = get_object_or_404(Recipe, pk=recipe_id)
    if not (request.user == recipe_instance.author or request.user.is_staff):
        return JsonResponse({'success': False, 'error': "You don't have permission to delete this recipe."}, status=403)
    try:
        recipe_instance.delete()
        return JsonResponse({
            'success': True, 'message': 'Recipe deleted successfully.',
            'redirect_url': str(reverse_lazy('main_dashboard_view_name'))
        })
    except Exception as e:
        print(f"Delete Recipe Error: {e}")
        return JsonResponse({'success': False, 'error': f'Error deleting recipe: {str(e)}'}, status=500)

# --- AJAX Recipe Action Views ---

@require_POST
@login_required(login_url='login_page_view_name')
def ajax_toggle_favorite(request, recipe_id):
    recipe = get_object_or_404(Recipe, pk=recipe_id)
    favorite, created = Favorite.objects.get_or_create(user=request.user, recipe=recipe)
    if created:
        is_favorited_now = True
        message = 'Recipe added to favorites!'
    else:
        favorite.delete()
        is_favorited_now = False
        message = 'Recipe removed from favorites.'
    return JsonResponse({'success': True, 'is_favorited': is_favorited_now, 'message': message})
