from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import CustomerFeedback, FeedbackImage
import re


class UserRegistrationForm(UserCreationForm):
    """Custom user registration form with additional fields."""
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your email address'
        })
    )
    first_name = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your first name'
        })
    )
    last_name = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your last name'
        })
    )
    phone = forms.CharField(
        max_length=15,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your phone number (optional)'
        })
    )
    
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'phone', 'password1', 'password2')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Style all form fields
        for field_name, field in self.fields.items():
            if field_name not in ['email', 'first_name', 'last_name', 'phone']:
                field.widget.attrs.update({
                    'class': 'form-control',
                    'placeholder': f'Enter your {field_name.replace("_", " ")}'
                })
    
    def clean_email(self):
        """Validate email uniqueness."""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError('This email address is already registered.')
        return email
    
    def clean_phone(self):
        """Validate phone number format."""
        phone = self.cleaned_data.get('phone')
        if phone:
            # Remove all non-digit characters
            phone_clean = re.sub(r'\D', '', phone)
            if len(phone_clean) < 10:
                raise ValidationError('Please enter a valid phone number with at least 10 digits.')
        return phone
    
    def clean_username(self):
        """Validate username format."""
        username = self.cleaned_data.get('username')
        if len(username) < 3:
            raise ValidationError('Username must be at least 3 characters long.')
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise ValidationError('Username can only contain letters, numbers, and underscores.')
        return username
    
    def save(self, commit=True):
        """Save the user and set email as required."""
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        
        if commit:
            user.save()
            # Save additional profile data if needed
            if hasattr(user, 'profile'):
                user.profile.phone = self.cleaned_data.get('phone', '')
                user.profile.save()
        
        return user


class CustomerFeedbackForm(forms.ModelForm):
    """Form for submitting customer feedback with images."""
    
    class Meta:
        model = CustomerFeedback
        fields = ['customer_name', 'rating', 'comment']
        widgets = {
            'customer_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Your name'
            }),
            'rating': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'max': '5',
                'step': '0.5',
                'placeholder': 'Rating (0-5)'
            }),
            'comment': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Share your experience...'
            }),
        }
