from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import login
from geopy.distance import geodesic
from .models import Mechanic, ActivityLog, MechanicGallery, Review, CustomerProfile
from .forms import UserRegistrationForm, ReviewForm
import json
import logging

logger = logging.getLogger(__name__)


def register(request):
    """User registration view."""
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome to MechLocator, {user.first_name}!')
            log_activity(request, 'register', f'New user registered: {user.username}')
            return redirect('mechanics:home')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserRegistrationForm()
    
    return render(request, 'mechanics/register.html', {'form': form})


def mechanic_list(request):
    """List all mechanic shops with filtering and pagination."""
    mechanics = Mechanic.objects.filter(is_active=True)
    
    # Get search parameters
    search_query = request.GET.get('search', '')
    rating_filter = request.GET.get('rating', '')
    sort_by = request.GET.get('sort', 'name')
    
    # Apply search filter
    if search_query:
        mechanics = mechanics.filter(
            Q(name__icontains=search_query) |
            Q(address__icontains=search_query) |
            Q(contact__icontains=search_query)
        )
    
    # Apply rating filter
    if rating_filter:
        try:
            min_rating = float(rating_filter)
            mechanics = mechanics.filter(rating__gte=min_rating)
        except ValueError:
            pass
    
    # Apply sorting
    if sort_by == 'rating':
        mechanics = mechanics.order_by('-rating', 'name')
    elif sort_by == 'name':
        mechanics = mechanics.order_by('name')
    else:
        mechanics = mechanics.order_by('name')
    
    # Pagination
    paginator = Paginator(mechanics, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'mechanics': page_obj,
        'total_mechanics': mechanics.count(),
        'search_query': search_query,
        'rating_filter': rating_filter,
        'sort_by': sort_by,
    }
    
    log_activity(request, 'view', 'Mechanic list page visited')
    return render(request, 'mechanics/mechanic_list.html', context)


def home(request):
    """Home page view with mechanic search functionality."""
    mechanics = Mechanic.objects.filter(is_active=True).order_by('-rating', 'name')
    
    # Get search parameters
    radius = request.GET.get('radius', 10)
    rating = request.GET.get('rating', 0)
    sort_by = request.GET.get('sort_by', 'distance')
    
    # Apply filters
    if rating and float(rating) > 0:
        mechanics = mechanics.filter(rating__gte=float(rating))
    
    # Pagination
    paginator = Paginator(mechanics, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'mechanics': page_obj,
        'total_mechanics': mechanics.count(),
        'radius': radius,
        'rating': rating,
        'sort_by': sort_by,
    }
    
    log_activity(request, 'view', 'Home page visited')
    return render(request, 'mechanics/home.html', context)


def mechanic_detail(request, mechanic_id):
    """Detailed view of a mechanic shop."""
    mechanic = get_object_or_404(Mechanic, id=mechanic_id, is_active=True)
    
    # Get user location for distance calculation
    user_lat = request.GET.get('lat')
    user_lng = request.GET.get('lng')
    
    if user_lat and user_lng:
        try:
            user_location = (float(user_lat), float(user_lng))
            mechanic_location = (mechanic.latitude, mechanic.longitude)
            distance = geodesic(user_location, mechanic_location).kilometers
            mechanic.distance_from_user = round(distance, 1)
        except (ValueError, TypeError):
            mechanic.distance_from_user = None
    
    log_activity(request, 'view', f'Mechanic detail viewed: {mechanic.name}')
    
    context = {
        'mechanic': mechanic,
        'user_lat': user_lat,
        'user_lng': user_lng,
    }
    return render(request, 'mechanics/mechanic_detail.html', context)


def search_mechanics(request):
    """API endpoint for searching mechanics."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_lat = data.get('latitude')
            user_lng = data.get('longitude')
            radius = float(data.get('radius', 10))
            rating = float(data.get('rating', 0))
            
            if not user_lat or not user_lng:
                return JsonResponse({'error': 'Location required'}, status=400)
            
            # Get mechanics within radius
            mechanics = Mechanic.objects.filter(is_active=True)
            
            if rating > 0:
                mechanics = mechanics.filter(rating__gte=rating)
            
            # Calculate distances and filter by radius
            user_location = (float(user_lat), float(user_lng))
            nearby_mechanics = []
            
            for mechanic in mechanics:
                mechanic_location = (mechanic.latitude, mechanic.longitude)
                distance = geodesic(user_location, mechanic_location).kilometers
                
                if distance <= radius:
                    mechanic.distance = round(distance, 1)
                    nearby_mechanics.append({
                        'id': mechanic.id,
                        'name': mechanic.name,
                        'address': mechanic.address,
                        'contact': mechanic.contact,
                        'rating': mechanic.rating,
                        'distance': mechanic.distance,
                        'latitude': mechanic.latitude,
                        'longitude': mechanic.longitude,
                    })
            
            # Sort by distance
            nearby_mechanics.sort(key=lambda x: x['distance'])
            
            log_activity(request, 'search', f'Mechanic search: {len(nearby_mechanics)} results')
            
            return JsonResponse({
                'mechanics': nearby_mechanics,
                'count': len(nearby_mechanics)
            })
            
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.error(f"Search mechanics error: {str(e)}")
            return JsonResponse({'error': 'Invalid request data'}, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@login_required
def user_profile(request):
    """User profile page."""
    user = request.user
    
    # Get user's recent activity
    recent_activity = ActivityLog.objects.filter(
        user=user
    ).order_by('-timestamp')[:10]
    
    context = {
        'user': user,
        'recent_activity': recent_activity,
    }
    
    log_activity(request, 'view', 'User profile visited')
    return render(request, 'mechanics/user_profile.html', context)


def about(request):
    """About page view."""
    log_activity(request, 'view', 'About page visited')
    return render(request, 'mechanics/about.html')


def contact(request):
    """Contact page view with form handling."""
    if request.method == 'POST':
        # Handle form submission
        first_name = request.POST.get('firstName', '').strip()
        last_name = request.POST.get('lastName', '').strip()
        email = request.POST.get('email', '').strip()
        phone = request.POST.get('phone', '').strip()
        subject = request.POST.get('subject', '').strip()
        message = request.POST.get('message', '').strip()
        newsletter = request.POST.get('newsletter') == 'on'
        
        # Basic validation
        if not all([first_name, last_name, email, subject, message]):
            messages.error(request, 'Please fill in all required fields.')
        elif not email or '@' not in email:
            messages.error(request, 'Please enter a valid email address.')
        else:
            # Log the contact form submission
            log_activity(
                request, 
                'contact', 
                f'Contact form submitted: {subject} from {email}'
            )
            
            # In a real application, you would send an email here
            # For now, we'll just show a success message
            messages.success(
                request, 
                'Thank you for your message! We will get back to you within 24 hours.'
            )
            
            # Redirect to prevent form resubmission
            return redirect('mechanics:contact')
    
    log_activity(request, 'view', 'Contact page visited')
    return render(request, 'mechanics/contact.html')


def log_activity(request, action, details):
    """Log user activity."""
    try:
        ActivityLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            details=details,
            ip_address=get_client_ip(request),
        )
    except Exception as e:
        logger.error(f"Failed to log activity: {str(e)}")


def get_client_ip(request):
    """Get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_call_api(request):
    """API endpoint to log mechanic call events."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            mechanic_id = data.get('mechanic_id')
            mechanic_name = data.get('mechanic_name')
            
            if mechanic_id and mechanic_name:
                log_activity(
                    request, 
                    'call', 
                    f'Called mechanic: {mechanic_name} (ID: {mechanic_id})'
                )
                return JsonResponse({'status': 'success', 'message': 'Call logged successfully'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Missing mechanic information'}, status=400)
                
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Log call API error: {str(e)}")
            return JsonResponse({'status': 'error', 'message': 'Invalid request data'}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)


def mechanic_gallery(request, mechanic_id):
    """Gallery view for a mechanic shop."""
    mechanic = get_object_or_404(Mechanic, id=mechanic_id, is_active=True)
    gallery_photos = MechanicGallery.objects.filter(mechanic=mechanic).order_by('-is_featured', '-uploaded_at')
    
    context = {
        'mechanic': mechanic,
        'gallery_photos': gallery_photos,
    }
    
    log_activity(request, 'view', f'Gallery viewed for: {mechanic.name}')
    return render(request, 'mechanics/mechanic_gallery.html', context)


def mechanic_detail(request, mechanic_id):
    """Detailed view of a mechanic shop with reviews."""
    mechanic = get_object_or_404(Mechanic, id=mechanic_id, is_active=True)
    
    # Get user location for distance calculation
    user_lat = request.GET.get('lat')
    user_lng = request.GET.get('lng')
    
    if user_lat and user_lng:
        try:
            user_location = (float(user_lat), float(user_lng))
            mechanic_location = (mechanic.latitude, mechanic.longitude)
            distance = geodesic(user_location, mechanic_location).kilometers
            mechanic.distance_from_user = round(distance, 1)
        except (ValueError, TypeError):
            mechanic.distance_from_user = None
    
    # Get reviews
    reviews = Review.objects.filter(mechanic=mechanic, is_public=True).order_by('-created_at')
    
    # Get gallery photos (limit to 6 for preview)
    gallery_photos = MechanicGallery.objects.filter(mechanic=mechanic)[:6]
    
    # Check if user has already reviewed this mechanic
    user_review = None
    if request.user.is_authenticated:
        try:
            user_review = Review.objects.get(mechanic=mechanic, customer=request.user)
        except Review.DoesNotExist:
            pass
    
    log_activity(request, 'view', f'Mechanic detail viewed: {mechanic.name}')
    
    context = {
        'mechanic': mechanic,
        'user_lat': user_lat,
        'user_lng': user_lng,
        'reviews': reviews,
        'gallery_photos': gallery_photos,
        'user_review': user_review,
        'review_form': ReviewForm() if request.user.is_authenticated and not user_review else None,
    }
    return render(request, 'mechanics/mechanic_detail.html', context)


@login_required
def submit_review(request, mechanic_id):
    """Submit a review for a mechanic."""
    mechanic = get_object_or_404(Mechanic, id=mechanic_id, is_active=True)
    
    # Check if user already reviewed this mechanic
    existing_review = Review.objects.filter(mechanic=mechanic, customer=request.user).first()
    if existing_review:
        messages.warning(request, 'You have already reviewed this mechanic shop.')
        return redirect('mechanics:mechanic_detail', mechanic_id=mechanic.id)
    
    if request.method == 'POST':
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.mechanic = mechanic
            review.customer = request.user
            review.save()
            
            # Create or update customer profile
            customer_profile, created = CustomerProfile.objects.get_or_create(user=request.user)
            
            log_activity(request, 'review', f'Review submitted for: {mechanic.name}')
            messages.success(request, 'Thank you for your review!')
            return redirect('mechanics:mechanic_detail', mechanic_id=mechanic.id)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ReviewForm()
    
    context = {
        'mechanic': mechanic,
        'form': form,
    }
    return render(request, 'mechanics/submit_review.html', context)


@login_required
def edit_review(request, review_id):
    """Edit an existing review."""
    review = get_object_or_404(Review, id=review_id, customer=request.user)
    
    if request.method == 'POST':
        form = ReviewForm(request.POST, instance=review)
        if form.is_valid():
            form.save()
            log_activity(request, 'review', f'Review edited for: {review.mechanic.name}')
            messages.success(request, 'Your review has been updated.')
            return redirect('mechanics:mechanic_detail', mechanic_id=review.mechanic.id)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ReviewForm(instance=review)
    
    context = {
        'review': review,
        'form': form,
    }
    return render(request, 'mechanics/edit_review.html', context)


@login_required
def delete_review(request, review_id):
    """Delete a review."""
    review = get_object_or_404(Review, id=review_id, customer=request.user)
    mechanic_id = review.mechanic.id
    
    if request.method == 'POST':
        log_activity(request, 'review', f'Review deleted for: {review.mechanic.name}')
        review.delete()
        messages.success(request, 'Your review has been deleted.')
        return redirect('mechanics:mechanic_detail', mechanic_id=mechanic_id)
    
    context = {
        'review': review,
    }
    return render(request, 'mechanics/delete_review.html', context)


@login_required
def customer_dashboard(request):
    """Customer dashboard with reviews and profile management."""
    user = request.user
    
    # Get customer profile
    customer_profile, created = CustomerProfile.objects.get_or_create(user=user)
    
    # Get user's reviews
    reviews = Review.objects.filter(customer=user).order_by('-created_at')
    
    # Get user's recent activity
    recent_activity = ActivityLog.objects.filter(user=user).order_by('-timestamp')[:10]
    
    context = {
        'user': user,
        'customer_profile': customer_profile,
        'reviews': reviews,
        'recent_activity': recent_activity,
    }
    
    log_activity(request, 'view', 'Customer dashboard visited')
    return render(request, 'mechanics/customer_dashboard.html', context)


@login_required
def edit_customer_profile(request):
    """Edit customer profile."""
    customer_profile, created = CustomerProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        # Update user fields
        request.user.first_name = request.POST.get('first_name', '').strip()
        request.user.last_name = request.POST.get('last_name', '').strip()
        request.user.email = request.POST.get('email', '').strip()
        request.user.save()
        
        # Update customer profile fields
        customer_profile.phone = request.POST.get('phone', '').strip()
        customer_profile.address = request.POST.get('address', '').strip()
        customer_profile.date_of_birth = request.POST.get('date_of_birth') or None
        
        # Handle profile image upload
        if 'profile_image' in request.FILES:
            customer_profile.profile_image = request.FILES['profile_image']
        
        customer_profile.save()
        
        log_activity(request, 'profile_update', 'Customer profile updated')
        messages.success(request, 'Your profile has been updated.')
        return redirect('mechanics:customer_dashboard')
    
    context = {
        'customer_profile': customer_profile,
    }
    return render(request, 'mechanics/edit_customer_profile.html', context)
