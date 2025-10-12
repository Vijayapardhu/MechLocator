from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys


class Mechanic(models.Model):
    """Model for storing mechanic shop information."""
    name = models.CharField(max_length=200, help_text="Name of the mechanic shop")
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Latitude coordinate"
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Longitude coordinate"
    )
    address = models.TextField(help_text="Full address of the shop")
    contact = models.CharField(max_length=20, help_text="Phone number")
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        default=0.0,
        help_text="Rating from 0.0 to 5.0"
    )
    working_hours = models.TextField(
        help_text="Working hours (e.g., Mon-Fri: 8AM-6PM, Sat: 9AM-4PM)"
    )
    image = models.ImageField(
        upload_to='mechanic_images/',
        blank=True,
        null=True,
        help_text="Shop image"
    )
    is_active = models.BooleanField(default=True, help_text="Whether the shop is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-rating', 'name']
        verbose_name = "Mechanic Shop"
        verbose_name_plural = "Mechanic Shops"

    def __str__(self):
        return f"{self.name} - {self.address}"

    def get_distance_from(self, lat, lng):
        """Calculate distance from given coordinates using Haversine formula."""
        from geopy.distance import geodesic
        
        shop_coords = (float(self.latitude), float(self.longitude))
        user_coords = (float(lat), float(lng))
        
        return round(geodesic(shop_coords, user_coords).kilometers, 2)


class UserProfile(models.Model):
    """Extended user profile model."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, help_text="User's phone number")
    address = models.TextField(blank=True, help_text="User's address")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username}'s Profile"


class ActivityLog(models.Model):
    """Model for storing user activity logs."""
    ACTION_CHOICES = [
        ('search', 'Search for mechanics'),
        ('view', 'View mechanic details'),
        ('call', 'Call mechanic'),
        ('filter', 'Apply filters'),
        ('login', 'User login'),
        ('logout', 'User logout'),
        ('admin_action', 'Admin action'),
    ]

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        help_text="User who performed the action (null for anonymous users)"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, help_text="Type of action performed")
    details = models.TextField(blank=True, help_text="Additional details about the action")
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="User's IP address")
    timestamp = models.DateTimeField(default=timezone.now, help_text="When the action occurred")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        user_info = self.user.username if self.user else "Anonymous"
        return f"{user_info} - {self.get_action_display()} at {self.timestamp}"


class SearchQuery(models.Model):
    """Model for storing search queries for analytics."""
    query_type = models.CharField(max_length=50, help_text="Type of search (e.g., 'distance', 'rating')")
    user_location = models.CharField(max_length=100, help_text="User's location coordinates")
    radius = models.IntegerField(help_text="Search radius in kilometers")
    results_count = models.IntegerField(help_text="Number of results returned")
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Search Query"
        verbose_name_plural = "Search Queries"

    def __str__(self):
        return f"{self.query_type} search at {self.timestamp}"


class MechanicImage(models.Model):
    """Model for storing multiple images for mechanic/shop."""
    mechanic = models.ForeignKey(
        Mechanic,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="Mechanic shop this image belongs to"
    )
    image = models.ImageField(
        upload_to='mechanic_gallery/',
        help_text="Mechanic or shop photo"
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional caption for the image"
    )
    image_type = models.CharField(
        max_length=20,
        choices=[
            ('mechanic', 'Mechanic Photo'),
            ('shop', 'Shop Photo'),
            ('work', 'Work Sample'),
            ('before', 'Before Work'),
            ('after', 'After Work'),
            ('equipment', 'Equipment Photo'),
            ('team', 'Team Photo'),
        ],
        default='shop',
        help_text="Type of image"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Set as primary/featured image"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', '-uploaded_at']
        verbose_name = "Mechanic Image"
        verbose_name_plural = "Mechanic Images"

    def __str__(self):
        return f"{self.mechanic.name} - {self.get_image_type_display()}"


class CustomerFeedback(models.Model):
    """Model for storing customer feedback and reviews."""
    mechanic = models.ForeignKey(
        Mechanic,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        help_text="Mechanic shop this feedback is for"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="User who submitted the feedback"
    )
    customer_name = models.CharField(
        max_length=100,
        help_text="Customer name"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Rating from 0.0 to 5.0"
    )
    comment = models.TextField(
        help_text="Customer's review/comment"
    )
    is_approved = models.BooleanField(
        default=False,
        help_text="Whether the feedback is approved for display"
    )
    mechanic_reply = models.TextField(
        blank=True,
        help_text="Mechanic's response to the feedback"
    )
    mechanic_reply_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the mechanic replied"
    )
    helpful_count = models.IntegerField(
        default=0,
        help_text="Number of users who found this review helpful"
    )
    unhelpful_count = models.IntegerField(
        default=0,
        help_text="Number of users who found this review unhelpful"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Customer Feedback"
        verbose_name_plural = "Customer Feedbacks"

    def __str__(self):
        return f"{self.customer_name} - {self.mechanic.name} ({self.rating}★)"


class FeedbackImage(models.Model):
    """Model for storing images attached to customer feedback."""
    feedback = models.ForeignKey(
        CustomerFeedback,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="Feedback this image belongs to"
    )
    image = models.ImageField(
        upload_to='feedback_images/',
        help_text="Image from customer feedback"
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional caption for the image"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Feedback Image"
        verbose_name_plural = "Feedback Images"

    def __str__(self):
        return f"Image for {self.feedback.customer_name}'s feedback"
    
    def save(self, *args, **kwargs):
        """Override save to optimize/compress image."""
        if self.image:
            img = Image.open(self.image)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize if image is too large (max 1920x1920)
            max_size = (1920, 1920)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Compress and save
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            # Replace the image file with compressed version
            self.image = InMemoryUploadedFile(
                output, 'ImageField', 
                f"{self.image.name.split('.')[0]}.jpg",
                'image/jpeg',
                sys.getsizeof(output), None
            )
        
        super().save(*args, **kwargs)


class FeedbackVote(models.Model):
    """Model for tracking user votes on feedback."""
    VOTE_CHOICES = [
        ('helpful', 'Helpful'),
        ('unhelpful', 'Unhelpful'),
    ]
    
    feedback = models.ForeignKey(
        CustomerFeedback,
        on_delete=models.CASCADE,
        related_name='votes',
        help_text="Feedback that was voted on"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="User who voted (null for anonymous)"
    )
    session_key = models.CharField(
        max_length=40,
        blank=True,
        help_text="Session key for anonymous users"
    )
    vote_type = models.CharField(
        max_length=10,
        choices=VOTE_CHOICES,
        help_text="Type of vote"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Feedback Vote"
        verbose_name_plural = "Feedback Votes"
        # Ensure one vote per user/session per feedback
        unique_together = [['feedback', 'user'], ['feedback', 'session_key']]

    def __str__(self):
        user_info = self.user.username if self.user else f"Session {self.session_key[:8]}"
        return f"{user_info} - {self.vote_type} on {self.feedback}"
