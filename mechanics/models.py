from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


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
