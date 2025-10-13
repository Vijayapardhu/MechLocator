from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
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


class ReviewForm(forms.ModelForm):
    """Form for submitting mechanic reviews."""
    
    class Meta:
        from .models import Review
        model = Review
        fields = ['rating', 'title', 'comment']
        widgets = {
            'rating': forms.Select(attrs={
                'class': 'form-select',
                'placeholder': 'Select rating'
            }),
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter review title'
            }),
            'comment': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Write your detailed review here...'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make all fields required
        for field in self.fields.values():
            field.required = True
    
    def clean_title(self):
        """Validate review title."""
        title = self.cleaned_data.get('title')
        if title and len(title.strip()) < 5:
            raise ValidationError('Review title must be at least 5 characters long.')
        return title.strip()
    
    def clean_comment(self):
        """Validate review comment."""
        comment = self.cleaned_data.get('comment')
        if comment and len(comment.strip()) < 10:
            raise ValidationError('Review comment must be at least 10 characters long.')
        return comment.strip()