from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.db import models
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import json

from .models import Mechanic, UserProfile, ActivityLog, SearchQuery, MechanicGallery, Review, CustomerProfile

# Custom Admin Site (keeping for reference)
class MechLocatorAdminSite(admin.AdminSite):
    site_header = "MechLocator Administration"
    site_title = "MechLocator Admin"
    index_title = "Welcome to MechLocator Administration"
    site_url = "/"

admin_site = MechLocatorAdminSite(name='mechlocator_admin')

# Update default admin site
admin.site.site_header = "MechLocator Administration"
admin.site.site_title = "MechLocator Admin"
admin.site.index_title = "Welcome to MechLocator Administration"

# Enhanced Mechanic Admin
@admin.register(Mechanic)
class MechanicAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'address_display', 'contact_display', 'rating', 'is_active',
        'status_badge', 'distance_from_center', 'created_date'
    ]
    list_filter = [
        'is_active', 'rating', 'created_at', 'updated_at',
        ('working_hours', admin.EmptyFieldListFilter),
    ]
    search_fields = ['name', 'address', 'contact']
    readonly_fields = ['created_at', 'updated_at', 'distance_from_center']
    list_editable = ['is_active', 'rating']
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'address', 'contact', 'rating', 'is_active')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude'),
            'description': 'Enter coordinates or use the map picker below'
        }),
        ('Details', {
            'fields': ('working_hours', 'image', 'profile_image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
    
    actions = ['activate_mechanics', 'deactivate_mechanics', 'bulk_update_rating', 'export_mechanics']
    
    def address_display(self, obj):
        if obj.address:
            return format_html('<span title="{}">{}</span>', 
                             obj.address, obj.address[:50] + '...' if len(obj.address) > 50 else obj.address)
        return format_html('<span class="text-muted">No address</span>')
    address_display.short_description = 'Address'
    
    def contact_display(self, obj):
        if obj.contact:
            return format_html('<a href="tel:{}" class="btn btn-sm btn-outline-primary">{}</a>', 
                             obj.contact, obj.contact)
        return format_html('<span class="text-muted">No contact</span>')
    contact_display.short_description = 'Contact'
    
    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span class="badge bg-success">Active</span>')
        return format_html('<span class="badge bg-danger">Inactive</span>')
    status_badge.short_description = 'Status'
    
    def distance_from_center(self, obj):
        # Calculate distance from a center point (e.g., city center)
        if obj.latitude and obj.longitude:
            # This is a simplified calculation - you could make it more sophisticated
            return f"{obj.latitude:.4f}, {obj.longitude:.4f}"
        return "N/A"
    distance_from_center.short_description = 'Coordinates'
    
    def created_date(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')
    created_date.short_description = 'Created'
    
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        """Override changeform_view to add Google Maps API key to context"""
        extra_context = extra_context or {}
        extra_context['google_maps_api_key'] = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
        return super().changeform_view(request, object_id, form_url, extra_context)
    
    def activate_mechanics(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} mechanics have been activated.')
    activate_mechanics.short_description = "Activate selected mechanics"
    
    def deactivate_mechanics(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} mechanics have been deactivated.')
    deactivate_mechanics.short_description = "Deactivate selected mechanics"
    
    def bulk_update_rating(self, request, queryset):
        if 'apply' in request.POST:
            new_rating = request.POST.get('rating')
            if new_rating:
                updated = queryset.update(rating=new_rating)
                self.message_user(request, f'{updated} mechanics have been updated with rating {new_rating}.')
                return redirect('.')
        
        return render(request, 'admin/mechanics/mechanic/bulk_update_rating.html', {
            'mechanics': queryset,
            'title': 'Update Rating for Selected Mechanics'
        })
    bulk_update_rating.short_description = "Update rating for selected mechanics"
    
    def export_mechanics(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="mechanics_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Address', 'Contact', 'Rating', 'Latitude', 'Longitude', 'Status', 'Created'])
        
        for mechanic in queryset:
            writer.writerow([
                mechanic.name,
                mechanic.address,
                mechanic.contact,
                mechanic.rating,
                mechanic.latitude,
                mechanic.longitude,
                'Active' if mechanic.is_active else 'Inactive',
                mechanic.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_mechanics.short_description = "Export selected mechanics to CSV"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_site.admin_view(self.mechanic_dashboard), name='mechanics_mechanic_dashboard'),
            path('map-view/', self.admin_site.admin_view(self.mechanic_map_view), name='mechanics_mechanic_map'),
            path('analytics/', self.admin_site.admin_view(self.mechanic_analytics), name='mechanics_mechanic_analytics'),
        ]
        return custom_urls + urls
    
    def mechanic_dashboard(self, request):
        # Get statistics
        total_mechanics = Mechanic.objects.count()
        active_mechanics = Mechanic.objects.filter(is_active=True).count()
        inactive_mechanics = total_mechanics - active_mechanics
        
        # Rating distribution
        rating_stats = Mechanic.objects.values('rating').annotate(count=Count('id')).order_by('rating')
        
        # Recent activity
        recent_mechanics = Mechanic.objects.order_by('-created_at')[:5]
        
        # Monthly growth
        from django.db.models.functions import TruncMonth
        monthly_growth = Mechanic.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        context = {
            'total_mechanics': total_mechanics,
            'active_mechanics': active_mechanics,
            'inactive_mechanics': inactive_mechanics,
            'rating_stats': rating_stats,
            'recent_mechanics': recent_mechanics,
            'monthly_growth': monthly_growth,
            'title': 'Mechanic Dashboard',
            'opts': self.model._meta,
        }
        return render(request, 'admin/mechanics/mechanic/dashboard.html', context)
    
    def mechanic_map_view(self, request):
        mechanics = Mechanic.objects.filter(is_active=True)
        context = {
            'mechanics': mechanics,
            'title': 'Mechanic Map View',
            'opts': self.model._meta,
            'google_maps_api_key': getattr(settings, 'GOOGLE_MAPS_API_KEY', ''),
        }
        return render(request, 'admin/mechanics/mechanic/map_view.html', context)
    
    def mechanic_analytics(self, request):
        # Get date range from request
        days = int(request.GET.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Activity over time
        daily_activity = ActivityLog.objects.filter(
            timestamp__range=(start_date, end_date)
        ).annotate(
            date=models.DateField('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Search queries over time
        search_queries = SearchQuery.objects.filter(
            timestamp__range=(start_date, end_date)
        ).annotate(
            date=models.DateField('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Top searched locations
        top_locations = SearchQuery.objects.values('user_location').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        context = {
            'daily_activity': daily_activity,
            'search_queries': search_queries,
            'top_locations': top_locations,
            'days': days,
            'title': 'Mechanic Analytics',
            'opts': self.model._meta,
        }
        return render(request, 'admin/mechanics/mechanic/analytics.html', context)

# Enhanced User Profile Admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('phone', 'address')
    extra = 0

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone_display', 'is_staff', 'is_active', 'last_login')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups', 'date_joined', 'last_login')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'userprofile__phone')
    ordering = ('-date_joined',)
    
    def phone_display(self, obj):
        try:
            return obj.userprofile.phone
        except UserProfile.DoesNotExist:
            return "No phone"
    phone_display.short_description = 'Phone'
    
    actions = ['activate_users', 'deactivate_users', 'add_to_staff', 'remove_from_staff']
    
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users have been activated.')
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users have been deactivated.')
    deactivate_users.short_description = "Deactivate selected users"
    
    def add_to_staff(self, request, queryset):
        updated = queryset.update(is_staff=True)
        self.message_user(request, f'{updated} users have been added to staff.')
    add_to_staff.short_description = "Add selected users to staff"
    
    def remove_from_staff(self, request, queryset):
        updated = queryset.update(is_staff=False)
        self.message_user(request, f'{updated} users have been removed from staff.')
    remove_from_staff.short_description = "Remove selected users from staff"

# Enhanced Activity Log Admin
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user_display', 'action_display', 'details_display', 'ip_address', 'timestamp_display']
    list_filter = ['action', 'timestamp', 'ip_address']
    search_fields = ['user__username', 'user__email', 'details', 'ip_address']
    readonly_fields = ['user', 'action', 'details', 'ip_address', 'timestamp']
    list_per_page = 50
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def user_display(self, obj):
        if obj.user:
            return format_html('<a href="{}">{}</a>', 
                             reverse('admin:auth_user_change', args=[obj.user.id]), obj.user.username)
        return "Anonymous"
    user_display.short_description = 'User'
    
    def action_display(self, obj):
        action_colors = {
            'login': 'success',
            'logout': 'secondary',
            'search': 'info',
            'call': 'warning',
            'register': 'primary',
            'profile_update': 'info',
            'admin_action': 'danger'
        }
        color = action_colors.get(obj.action, 'secondary')
        return format_html('<span class="badge bg-{}">{}</span>', color, obj.action.title())
    action_display.short_description = 'Action'
    
    def details_display(self, obj):
        if obj.details:
            return format_html('<span title="{}">{}</span>', 
                             obj.details, obj.details[:50] + '...' if len(obj.details) > 50 else obj.details)
        return "No details"
    details_display.short_description = 'Details'
    
    def timestamp_display(self, obj):
        return obj.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    timestamp_display.short_description = 'Timestamp'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('activity-summary/', self.admin_site.admin_view(self.activity_summary), name='mechanics_activitylog_summary'),
        ]
        return custom_urls + urls
    
    def activity_summary(self, request):
        # Get date range from request
        days = int(request.GET.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Activity by type
        activity_by_type = ActivityLog.objects.filter(
            timestamp__range=(start_date, end_date)
        ).values('action').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Activity by user
        activity_by_user = ActivityLog.objects.filter(
            timestamp__range=(start_date, end_date)
        ).values('user__username').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Hourly activity
        hourly_activity = ActivityLog.objects.filter(
            timestamp__range=(start_date, end_date)
        ).extra(
            select={'hour': 'EXTRACT(hour FROM timestamp)'}
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')
        
        context = {
            'activity_by_type': activity_by_type,
            'activity_by_user': activity_by_user,
            'hourly_activity': hourly_activity,
            'days': days,
            'title': 'Activity Summary',
            'opts': self.model._meta,
        }
        return render(request, 'admin/mechanics/activitylog/summary.html', context)

# Enhanced Search Query Admin
@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['query_type_display', 'user_location_display', 'radius_display', 'results_count', 'user_display', 'timestamp_display']
    list_filter = ['query_type', 'radius', 'timestamp']
    search_fields = ['user_location', 'user__username']
    readonly_fields = ['query_type', 'user_location', 'radius', 'results_count', 'user', 'timestamp']
    list_per_page = 50
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def query_type_display(self, obj):
        type_colors = {
            'location_based': 'primary',
            'rating_filter': 'success',
            'radius_filter': 'info',
            'combined': 'warning'
        }
        color = type_colors.get(obj.query_type, 'secondary')
        return format_html('<span class="badge bg-{}">{}</span>', color, obj.query_type.replace('_', ' ').title())
    query_type_display.short_description = 'Query Type'
    
    def user_location_display(self, obj):
        if obj.user_location:
            return format_html('<span title="{}">{}</span>', 
                             obj.user_location, obj.user_location[:30] + '...' if len(obj.user_location) > 30 else obj.user_location)
        return "No location"
    user_location_display.short_description = 'User Location'
    
    def radius_display(self, obj):
        return f"{obj.radius} km"
    radius_display.short_description = 'Radius'
    
    def user_display(self, obj):
        if obj.user:
            return format_html('<a href="{}">{}</a>', 
                             reverse('admin:auth_user_change', args=[obj.user.id]), obj.user.username)
        return "Anonymous"
    user_display.short_description = 'User'
    
    def timestamp_display(self, obj):
        return obj.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    timestamp_display.short_description = 'Timestamp'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('search-analytics/', self.admin_site.admin_view(self.search_analytics), name='mechanics_searchquery_analytics'),
        ]
        return custom_urls + urls
    
    def search_analytics(self, request):
        # Get date range from request
        days = int(request.GET.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Search queries over time
        daily_searches = SearchQuery.objects.filter(
            timestamp__range=(start_date, end_date)
        ).annotate(
            date=models.DateField('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Popular search locations
        popular_locations = SearchQuery.objects.values('user_location').annotate(
            count=Count('id')
        ).order_by('-count')[:15]
        
        # Radius distribution
        radius_distribution = SearchQuery.objects.values('radius').annotate(
            count=Count('id')
        ).order_by('radius')
        
        # Query type distribution
        query_type_distribution = SearchQuery.objects.values('query_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        context = {
            'daily_searches': daily_searches,
            'popular_locations': popular_locations,
            'radius_distribution': radius_distribution,
            'query_type_distribution': query_type_distribution,
            'days': days,
            'title': 'Search Analytics',
            'opts': self.model._meta,
        }
        return render(request, 'admin/mechanics/searchquery/analytics.html', context)

# Gallery Admin
@admin.register(MechanicGallery)
class MechanicGalleryAdmin(admin.ModelAdmin):
    list_display = ['mechanic', 'caption_display', 'is_featured', 'uploaded_at']
    list_filter = ['is_featured', 'uploaded_at', 'mechanic']
    search_fields = ['mechanic__name', 'caption']
    list_editable = ['is_featured']
    list_per_page = 25
    
    fieldsets = (
        ('Photo Information', {
            'fields': ('mechanic', 'image', 'caption', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('uploaded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['uploaded_at', 'updated_at']
    
    def caption_display(self, obj):
        if obj.caption:
            return obj.caption[:50] + '...' if len(obj.caption) > 50 else obj.caption
        return "No caption"
    caption_display.short_description = 'Caption'

# Review Admin
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer', 'mechanic', 'rating_display', 'title_display', 'is_verified', 'is_public', 'created_at']
    list_filter = ['rating', 'is_verified', 'is_public', 'created_at', 'mechanic']
    search_fields = ['customer__username', 'mechanic__name', 'title', 'comment']
    list_editable = ['is_verified', 'is_public']
    list_per_page = 25
    
    fieldsets = (
        ('Review Information', {
            'fields': ('customer', 'mechanic', 'rating', 'title', 'comment')
        }),
        ('Moderation', {
            'fields': ('is_verified', 'is_public')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def rating_display(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<span title="{}">{} ({}/5)</span>', 
                         obj.get_rating_display(), stars, obj.rating)
    rating_display.short_description = 'Rating'
    
    def title_display(self, obj):
        return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
    title_display.short_description = 'Title'
    
    actions = ['verify_reviews', 'unverify_reviews', 'make_public', 'make_private']
    
    def verify_reviews(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} reviews have been verified.')
    verify_reviews.short_description = "Verify selected reviews"
    
    def unverify_reviews(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} reviews have been unverified.')
    unverify_reviews.short_description = "Unverify selected reviews"
    
    def make_public(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} reviews have been made public.')
    make_public.short_description = "Make selected reviews public"
    
    def make_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} reviews have been made private.')
    make_private.short_description = "Make selected reviews private"

# Customer Profile Admin
@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name_display', 'phone', 'is_verified', 'review_count_display', 'created_at']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email', 'phone']
    list_editable = ['is_verified']
    list_per_page = 25
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'profile_image')
        }),
        ('Contact Details', {
            'fields': ('phone', 'address', 'date_of_birth')
        }),
        ('Account Status', {
            'fields': ('is_verified',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def full_name_display(self, obj):
        return obj.full_name
    full_name_display.short_description = 'Full Name'
    
    def review_count_display(self, obj):
        count = obj.review_count
        return format_html('<span class="badge bg-info">{}</span>', count)
    review_count_display.short_description = 'Reviews'
    
    actions = ['verify_customers', 'unverify_customers']
    
    def verify_customers(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} customers have been verified.')
    verify_customers.short_description = "Verify selected customers"
    
    def unverify_customers(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} customers have been unverified.')
    unverify_customers.short_description = "Unverify selected customers"

# Note: Mechanic, ActivityLog, and SearchQuery are already registered with @admin.register decorators
# User is registered in urls.py to avoid conflicts
