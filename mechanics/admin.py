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

# Basic Mechanic Admin
@admin.register(Mechanic)
class MechanicAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'contact', 'rating', 'is_active', 'created_at']
    list_filter = ['is_active', 'rating', 'created_at']
    search_fields = ['name', 'address', 'contact']
    list_editable = ['is_active', 'rating']
    ordering = ['-created_at']

# Basic User Profile Admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)

# Basic Activity Log Admin
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'details', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__username', 'details']
    readonly_fields = ['user', 'action', 'details', 'ip_address', 'timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

# Basic Search Query Admin
@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['query_type', 'user_location', 'radius', 'results_count', 'user', 'timestamp']
    list_filter = ['query_type', 'radius', 'timestamp']
    search_fields = ['user_location', 'user__username']
    readonly_fields = ['query_type', 'user_location', 'radius', 'results_count', 'user', 'timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

# Gallery Admin
@admin.register(MechanicGallery)
class MechanicGalleryAdmin(admin.ModelAdmin):
    list_display = ['mechanic', 'caption', 'is_featured', 'uploaded_at']
    list_filter = ['is_featured', 'uploaded_at', 'mechanic']
    search_fields = ['mechanic__name', 'caption']
    list_editable = ['is_featured']

# Review Admin
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer', 'mechanic', 'rating', 'title', 'is_verified', 'is_public', 'created_at']
    list_filter = ['rating', 'is_verified', 'is_public', 'created_at', 'mechanic']
    search_fields = ['customer__username', 'mechanic__name', 'title', 'comment']
    list_editable = ['is_verified', 'is_public']

# Customer Profile Admin
@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email', 'phone']
    list_editable = ['is_verified']

# Note: Mechanic, ActivityLog, and SearchQuery are already registered with @admin.register decorators
# User is registered in urls.py to avoid conflicts
