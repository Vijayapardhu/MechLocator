from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


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
        help_text="Shop profile image"
    )
    profile_image = models.ImageField(
        upload_to='mechanic_profiles/',
        blank=True,
        null=True,
        help_text="Mechanic profile photo"
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


class MechanicGallery(models.Model):
    """Model for storing mechanic shop gallery photos."""
    mechanic = models.ForeignKey(
        Mechanic, 
        on_delete=models.CASCADE, 
        related_name='gallery_photos',
        help_text="Associated mechanic shop"
    )
    image = models.ImageField(
        upload_to='mechanic_gallery/',
        help_text="Gallery photo"
    )
    caption = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Photo caption (optional)"
    )
    is_featured = models.BooleanField(
        default=False, 
        help_text="Whether this photo should be featured in the gallery"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_featured', '-uploaded_at']
        verbose_name = "Gallery Photo"
        verbose_name_plural = "Gallery Photos"

    def __str__(self):
        return f"{self.mechanic.name} - {self.caption or 'Gallery Photo'}"

    def clean(self):
        """Validate that only one photo can be featured per mechanic."""
        if self.is_featured:
            existing_featured = MechanicGallery.objects.filter(
                mechanic=self.mechanic, 
                is_featured=True
            ).exclude(id=self.id)
            if existing_featured.exists():
                raise ValidationError("Only one photo can be featured per mechanic shop.")


class Review(models.Model):
    """Model for storing customer reviews of mechanic shops."""
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]

    mechanic = models.ForeignKey(
        Mechanic, 
        on_delete=models.CASCADE, 
        related_name='reviews',
        help_text="Mechanic shop being reviewed"
    )
    customer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='reviews',
        help_text="Customer who wrote the review"
    )
    rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    title = models.CharField(
        max_length=100,
        help_text="Review title"
    )
    comment = models.TextField(
        help_text="Detailed review comment"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this review is verified"
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Whether this review is visible to public"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['mechanic', 'customer']  # One review per customer per mechanic
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self):
        return f"{self.customer.username} - {self.mechanic.name} ({self.rating}/5)"

    def clean(self):
        """Validate review data."""
        if self.rating < 1 or self.rating > 5:
            raise ValidationError("Rating must be between 1 and 5.")
        
        if not self.title.strip():
            raise ValidationError("Review title cannot be empty.")
        
        if not self.comment.strip():
            raise ValidationError("Review comment cannot be empty.")

    def save(self, *args, **kwargs):
        """Override save to update mechanic rating."""
        self.full_clean()
        super().save(*args, **kwargs)
        self.update_mechanic_rating()

    def update_mechanic_rating(self):
        """Update the mechanic's average rating based on all reviews."""
        reviews = Review.objects.filter(
            mechanic=self.mechanic, 
            is_public=True
        )
        if reviews.exists():
            avg_rating = reviews.aggregate(
                avg_rating=models.Avg('rating')
            )['avg_rating']
            self.mechanic.rating = round(avg_rating, 2)
            self.mechanic.save(update_fields=['rating'])


class CustomerProfile(models.Model):
    """Extended customer profile for review system."""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='customer_profile',
        help_text="Associated user account"
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        help_text="Customer's phone number"
    )
    address = models.TextField(
        blank=True, 
        help_text="Customer's address"
    )
    date_of_birth = models.DateField(
        null=True, 
        blank=True, 
        help_text="Customer's date of birth"
    )
    profile_image = models.ImageField(
        upload_to='customer_profiles/',
        blank=True, 
        null=True, 
        help_text="Customer's profile photo"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether customer is verified"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Customer Profile"
        verbose_name_plural = "Customer Profiles"

    def __str__(self):
        return f"{self.user.username}'s Customer Profile"

    @property
    def full_name(self):
        """Return customer's full name."""
        return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username

    @property
    def review_count(self):
        """Return number of reviews written by this customer."""
        return self.user.reviews.filter(is_public=True).count()
