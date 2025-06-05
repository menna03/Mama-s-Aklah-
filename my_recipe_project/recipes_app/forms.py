from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User # Or your custom user model if you have one
from .models import Recipe

class CustomUserCreationForm(UserCreationForm):
    """
    A custom form for creating new users that includes an email field and allows is_staff if provided.
    It inherits username, password, and password2 fields from UserCreationForm.
    """
    email = forms.EmailField(
        required=True,
        help_text="Required. A valid email address.",
        widget=forms.EmailInput(attrs={'autocomplete': 'email', 'placeholder': 'your@email.com'})
    )
    is_staff = forms.BooleanField(
        required=False,
        label="Sign up as a Chef/Admin",
        help_text="Check if you want admin/chef privileges."
    )

    class Meta(UserCreationForm.Meta):
        model = User
        # UserCreationForm.Meta.fields is typically ("username",)
        # We add "email" and "is_staff" to this. The password fields are handled by UserCreationForm itself.
        fields = UserCreationForm.Meta.fields + ('email', 'is_staff')

    def clean_email(self):
        """
        Custom validation to ensure the email is unique.
        """
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email address already exists.")
        return email

    def save(self, commit=True):
        """
        Saves the new User instance.
        The parent UserCreationForm's save method handles setting the username and hashed password.
        We only need to ensure our custom fields (like email and is_staff) are also saved.
        """
        user = super().save(commit=False) # Call parent's save, but don't commit yet
        user.email = self.cleaned_data["email"]
        user.is_staff = self.cleaned_data.get("is_staff", False)
        if commit:
            user.save()
        return user

class RecipeForm(forms.ModelForm):
    """
    A ModelForm for creating and updating Recipe instances.
    """
    ingredients = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 6, 'placeholder': 'e.g.\n1 cup Flour\n2 Eggs\n1 tsp Salt'}),
        help_text="List all ingredients, one per line for clarity."
    )
    instructions = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 8, 'placeholder': 'e.g.\n1. Mix dry ingredients.\n2. Add wet ingredients.\n3. Bake at 180°C.'}),
        help_text="Provide step-by-step instructions, one step per line for clarity."
    )
    description = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4, 'placeholder': 'Enter a brief intro for the recipe...'}),
        required=False
    )

    class Meta:
        model = Recipe
        fields = [
            'name', 'description', 'ingredients', 'instructions', 'image',
            'course', 'preparation_time', 'cooking_time', 'servings',
            'is_public', 'is_featured',
        ]
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'e.g., Classic Pancakes'}),
            'preparation_time': forms.NumberInput(attrs={'min': 0, 'placeholder': 'e.g., 30 (in minutes)'}),
            'cooking_time': forms.NumberInput(attrs={'min': 0, 'placeholder': 'e.g., 45 (in minutes)'}),
            'servings': forms.NumberInput(attrs={'min': 1, 'placeholder': 'e.g., 4'}),
        }
        help_texts = {
            'image': "Upload an image for the recipe. If editing, leaving this blank will keep the current image. Use the 'Clear' checkbox to remove an existing image.",
            'is_public': "Check if this recipe should be visible to everyone.",
            'is_featured': "Check if this recipe should be featured on the home page.",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make image field not required if editing and an image already exists,
        # or if it's optional in the model.
        if self.instance and self.instance.pk and self.instance.image:
            self.fields['image'].required = False
        elif self.Meta.model.image.field.blank: # Check if model field allows blank
            self.fields['image'].required = False
        # Set is_public checked by default for new recipes
        if not self.instance or not self.instance.pk:
            self.fields['is_public'].initial = True