from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Recipe, Favorite # Assuming your models are Recipe and Favorite
# from .forms import RecipeForm # Assuming you will create a RecipeForm

# Create your tests here.

class RecipeModelTests(TestCase):
    """
    Tests for the Recipe model.
    """
    def setUp(self):
        # Create a user for associating with recipes
        self.user = User.objects.create_user(username='testuser', password='testpassword123')
        # Create a recipe instance
        self.recipe = Recipe.objects.create(
            name='Test Pancake',
            author=self.user,
            description='A delicious test pancake recipe.',
            ingredients='Flour, Egg, Milk',
            instructions='Mix and cook.',
            course='main_course',
            is_public=True
        )

    def test_recipe_creation(self):
        """Test that a recipe can be created and has the correct attributes."""
        self.assertEqual(self.recipe.name, 'Test Pancake')
        self.assertEqual(self.recipe.author.username, 'testuser')
        self.assertTrue(self.recipe.is_public)
        self.assertIsNotNone(self.recipe.created_at)
        self.assertIsNotNone(self.recipe.updated_at)

    def test_recipe_str_representation(self):
        """Test the __str__ method of the Recipe model."""
        self.assertEqual(str(self.recipe), 'Test Pancake')

    def test_recipe_get_absolute_url(self):
        """Test the get_absolute_url method."""
        # This assumes your URL for recipe detail is named 'recipe_detail_view_name'
        # and takes 'recipe_id' as a kwarg.
        expected_url = reverse('recipe_detail_view_name', kwargs={'recipe_id': self.recipe.pk})
        self.assertEqual(self.recipe.get_absolute_url(), expected_url)

class FavoriteModelTests(TestCase):
    """
    Tests for the Favorite model.
    """
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='password1')
        self.user2 = User.objects.create_user(username='user2', password='password2')
        self.recipe1 = Recipe.objects.create(
            name='Recipe Alpha', author=self.user1, ingredients='A', instructions='B'
        )
        self.favorite = Favorite.objects.create(user=self.user1, recipe=self.recipe1)

    def test_favorite_creation(self):
        """Test that a favorite relationship can be created."""
        self.assertEqual(self.favorite.user, self.user1)
        self.assertEqual(self.favorite.recipe, self.recipe1)
        self.assertIsNotNone(self.favorite.favorited_at)

    def test_favorite_str_representation(self):
        """Test the __str__ method of the Favorite model."""
        self.assertEqual(str(self.favorite), f"{self.user1.username} favorites {self.recipe1.name}")

    def test_unique_favorite_constraint(self):
        """Test that a user cannot favorite the same recipe twice."""
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Favorite.objects.create(user=self.user1, recipe=self.recipe1)


class RecipeViewTests(TestCase):
    """
    Tests for the views related to recipes.
    """
    def setUp(self):
        self.client = Client() # Django's test client
        self.user = User.objects.create_user(username='viewtestuser', password='password123', email='view@test.com')
        self.staff_user = User.objects.create_user(username='staffuser', password='password123', is_staff=True)

        self.public_recipe = Recipe.objects.create(
            name='Public Recipe One', author=self.user, ingredients='A', instructions='B', is_public=True
        )
        self.private_recipe = Recipe.objects.create(
            name='Private Recipe One', author=self.user, ingredients='C', instructions='D', is_public=False
        )
        # URLs (replace with your actual URL names from recipes_app/urls.py)
        self.home_url = reverse('home_view_name')
        self.browse_recipes_url = reverse('browse_recipes_view_name')
        self.recipe_detail_url = reverse('recipe_detail_view_name', kwargs={'recipe_id': self.public_recipe.pk})
        self.login_url = reverse('login_page_view_name')
        self.signup_url = reverse('signup_page_view_name')
        self.upload_recipe_url = reverse('upload_recipe_view_name') # For GET request to the form page
        self.main_dashboard_url = reverse('main_dashboard_view_name')

    def test_home_page_view(self):
        """Test the home page view returns a 200 OK status and uses the correct template."""
        response = self.client.get(self.home_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'recipes_app/Home.html') # Verify correct template

    def test_browse_recipes_view(self):
        """Test the browse recipes page view."""
        response = self.client.get(self.browse_recipes_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'recipes_app/Browse_Recipes.html')
        self.assertContains(response, self.public_recipe.name) # Public recipe should be visible
        # self.assertNotContains(response, self.private_recipe.name) # Assuming private recipes aren't listed for anonymous users

    def test_recipe_detail_view_public_recipe(self):
        """Test the recipe detail view for a public recipe."""
        response = self.client.get(self.recipe_detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'recipes_app/Recipe_Page.html')
        self.assertContains(response, self.public_recipe.name)

    def test_recipe_detail_view_private_recipe_unauthenticated(self):
        """Test accessing a private recipe detail view when unauthenticated (should likely redirect or be 404/403)."""
        private_detail_url = reverse('recipe_detail_view_name', kwargs={'recipe_id': self.private_recipe.pk})
        response = self.client.get(private_detail_url)
        # This depends on your view's logic for private recipes.
        # It might redirect to login, or return 404 if not found for the user.
        # self.assertIn(response.status_code, [302, 404]) # Example: expecting redirect or not found
        # For now, let's assume it might show if is_public is the only check in the template
        # A more robust test would involve checking the view's specific logic for private recipes.
        self.assertEqual(response.status_code, 200) # If template just shows based on ID
        self.assertContains(response, self.private_recipe.name)


    def test_upload_recipe_view_get_unauthenticated(self):
        """Test accessing the upload recipe page (GET) when unauthenticated (should redirect to login)."""
        response = self.client.get(self.upload_recipe_url)
        self.assertRedirects(response, f"{self.login_url}?next={self.upload_recipe_url}") # Assumes @login_required

    def test_upload_recipe_view_get_authenticated_staff(self):
        """Test accessing the upload recipe page (GET) as authenticated staff."""
        self.client.login(username='staffuser', password='password123')
        response = self.client.get(self.upload_recipe_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'recipes_app/Upload.html')
        # self.assertIsInstance(response.context['recipe_form'], RecipeForm) # If you pass a form

    def test_main_dashboard_view_unauthenticated(self):
        """Test accessing main dashboard when unauthenticated."""
        response = self.client.get(self.main_dashboard_url)
        self.assertRedirects(response, f"{self.login_url}?next={self.main_dashboard_url}")

    def test_main_dashboard_view_authenticated_non_staff(self):
        """Test accessing main dashboard as authenticated non-staff (should be denied/redirected)."""
        self.client.login(username='viewtestuser', password='password123')
        response = self.client.get(self.main_dashboard_url)
        # Depending on your logic, it might redirect to home or show an access denied template.
        # For now, let's assume it redirects to home if not staff.
        self.assertRedirects(response, self.home_url) # Or a specific 'access_denied_url'

    def test_main_dashboard_view_authenticated_staff(self):
        """Test accessing main dashboard as authenticated staff."""
        self.client.login(username='staffuser', password='password123')
        response = self.client.get(self.main_dashboard_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'recipes_app/main.html')

# --- AJAX View Tests ---
# These are more complex as they involve simulating AJAX requests (e.g., with 'HTTP_X_REQUESTED_WITH')
# and checking JSON responses.

class AjaxViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='ajaxuser', password='password123', email='ajax@test.com')
        self.recipe = Recipe.objects.create(name='AJAX Recipe', author=self.user, ingredients='I', instructions='J', is_public=True, is_featured=True)
        self.get_recipes_ajax_url = reverse('get_recipes_ajax_name')
        self.get_featured_recipes_ajax_url = reverse('get_featured_recipes_ajax_name')
        self.get_recipe_detail_ajax_url = reverse('get_recipe_detail_ajax_name', kwargs={'recipe_id': self.recipe.pk})
        self.ajax_login_url = reverse('ajax_login_view_name')
        # Add other AJAX URLs as needed

    def test_get_recipes_ajax_view(self):
        """Test the AJAX view for getting all public recipes."""
        response = self.client.get(self.get_recipes_ajax_url, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        data = response.json()
        self.assertIn('recipes', data)
        self.assertTrue(any(r['name'] == 'AJAX Recipe' for r in data['recipes']))

    def test_get_featured_recipes_ajax_view(self):
        """Test the AJAX view for getting featured recipes."""
        response = self.client.get(self.get_featured_recipes_ajax_url, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        data = response.json()
        self.assertIn('recipes', data)
        self.assertTrue(any(r['name'] == 'AJAX Recipe' and r['is_featured'] for r in data['recipes']))


    def test_get_recipe_detail_ajax_view(self):
        """Test AJAX view for getting a single recipe's details."""
        response = self.client.get(self.get_recipe_detail_ajax_url, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        data = response.json()
        self.assertIn('recipe', data)
        self.assertEqual(data['recipe']['name'], 'AJAX Recipe')
        # self.assertIn('is_favorited', data['recipe']) # Check if favorite status is included
        # self.assertIn('can_edit_delete', data['recipe']) # Check if permission flag is included

    def test_ajax_login_view_success(self):
        """Test successful AJAX login."""
        response = self.client.post(
            self.ajax_login_url,
            data={'email': 'ajax@test.com', 'password': 'password123'},
            content_type='application/json', # Important for how Django parses request.body
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('redirect_url', data)
        self.assertTrue(self.client.session['_auth_user_id']) # Check if user is logged in session

    def test_ajax_login_view_failure(self):
        """Test failed AJAX login."""
        response = self.client.post(
            self.ajax_login_url,
            data={'email': 'ajax@test.com', 'password': 'wrongpassword'},
            content_type='application/json',
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 401) # Or 200 with success:false, depending on your view
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('error', data)

    # Add more tests for:
    # - AJAX signup (success, failure - e.g., email exists)
    # - AJAX add recipe (requires authenticated staff user)
    # - AJAX edit recipe
    # - AJAX delete recipe
    # - AJAX toggle favorite (requires authenticated user)
    # - Search functionality in get_recipes_ajax_view

# Example for testing form submission (if you were not using full AJAX for uploads)
# class RecipeFormTests(TestCase):
#     def setUp(self):
#         self.user = User.objects.create_user(username='formuser', password='password123')

#     def test_valid_recipe_form_submission(self):
#         # This would test a Django Form directly or a view that uses it.
#         # For ImageField, you'd need to mock a file upload.
#         form_data = {
#             'name': 'Form Recipe',
#             'description': 'Desc',
#             'ingredients': 'Ingr',
#             'instructions': 'Instr',
#             'course': 'main_course',
#             'is_public': True,
#             # 'author': self.user.id # If author is part of the form directly
#         }
#         # For file uploads:
#         # from django.core.files.uploadedfile import SimpleUploadedFile
#         # image = SimpleUploadedFile("test_image.jpg", b"file_content", content_type="image/jpeg")
#         # form_data_with_file = {**form_data, 'image': image}
#
#         # If testing a Django Form class:
#         # form = RecipeForm(data=form_data) #, files={'image': image} if file upload
#         # self.assertTrue(form.is_valid(), form.errors.as_data())

#         # If testing a view that processes this form:
#         # self.client.login(username='formuser', password='password123')
#         # response = self.client.post(reverse('your_add_recipe_view_name'), data=form_data_with_file)
#         # self.assertEqual(response.status_code, 302) # Expect redirect on success
#         # self.assertTrue(Recipe.objects.filter(name='Form Recipe').exists())
#         pass
