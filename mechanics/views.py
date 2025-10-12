from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import login
from django.views.decorators.http import require_POST
from geopy.distance import geodesic
from .models import Mechanic, ActivityLog, MechanicImage, CustomerFeedback, FeedbackImage, FeedbackVote
from .forms import UserRegistrationForm, CustomerFeedbackForm
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
    
    # Get mechanic images
    mechanic_images = mechanic.images.all()
    
    # Get approved customer feedback
    feedbacks = mechanic.feedbacks.filter(is_approved=True).order_by('-created_at')
    
    # Handle feedback form submission
    if request.method == 'POST':
        form = CustomerFeedbackForm(request.POST, request.FILES)
        if form.is_valid():
            feedback = form.save(commit=False)
            feedback.mechanic = mechanic
            if request.user.is_authenticated:
                feedback.user = request.user
            feedback.save()
            
            # Handle image uploads
            images = request.FILES.getlist('images')
            for image in images:
                FeedbackImage.objects.create(
                    feedback=feedback,
                    image=image
                )
            
            messages.success(request, 'Thank you for your feedback! It will be reviewed before being published.')
            log_activity(request, 'feedback', f'Feedback submitted for {mechanic.name}')
            return redirect('mechanics:mechanic_detail', mechanic_id=mechanic.id)
    else:
        form = CustomerFeedbackForm()
    
    log_activity(request, 'view', f'Mechanic detail viewed: {mechanic.name}')
    
    context = {
        'mechanic': mechanic,
        'mechanic_images': mechanic_images,
        'feedbacks': feedbacks,
        'feedback_form': form,
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


def log_activity(request, action, description):
    """Log user activity."""
    try:
        ActivityLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            description=description,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
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


@require_POST
def vote_feedback(request, feedback_id):
    """API endpoint to vote on feedback (helpful/unhelpful)."""
    try:
        feedback = get_object_or_404(CustomerFeedback, id=feedback_id, is_approved=True)
        data = json.loads(request.body)
        vote_type = data.get('vote_type')
        
        if vote_type not in ['helpful', 'unhelpful']:
            return JsonResponse({'status': 'error', 'message': 'Invalid vote type'}, status=400)
        
        # Get or create session key for anonymous users
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key
        
        # Check if user has already voted
        user = request.user if request.user.is_authenticated else None
        
        existing_vote = None
        if user:
            existing_vote = FeedbackVote.objects.filter(feedback=feedback, user=user).first()
        else:
            existing_vote = FeedbackVote.objects.filter(feedback=feedback, session_key=session_key).first()
        
        if existing_vote:
            # Update vote if changed
            if existing_vote.vote_type != vote_type:
                # Decrement old vote count
                if existing_vote.vote_type == 'helpful':
                    feedback.helpful_count = max(0, feedback.helpful_count - 1)
                else:
                    feedback.unhelpful_count = max(0, feedback.unhelpful_count - 1)
                
                # Update vote type
                existing_vote.vote_type = vote_type
                existing_vote.save()
                
                # Increment new vote count
                if vote_type == 'helpful':
                    feedback.helpful_count += 1
                else:
                    feedback.unhelpful_count += 1
                
                feedback.save()
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Vote updated',
                    'helpful_count': feedback.helpful_count,
                    'unhelpful_count': feedback.unhelpful_count
                })
            else:
                return JsonResponse({
                    'status': 'info',
                    'message': 'You have already voted',
                    'helpful_count': feedback.helpful_count,
                    'unhelpful_count': feedback.unhelpful_count
                })
        else:
            # Create new vote
            FeedbackVote.objects.create(
                feedback=feedback,
                user=user,
                session_key=session_key if not user else '',
                vote_type=vote_type
            )
            
            # Increment vote count
            if vote_type == 'helpful':
                feedback.helpful_count += 1
            else:
                feedback.unhelpful_count += 1
            
            feedback.save()
            
            log_activity(request, 'vote', f'Voted {vote_type} on feedback {feedback.id}')
            
            return JsonResponse({
                'status': 'success',
                'message': f'Voted as {vote_type}',
                'helpful_count': feedback.helpful_count,
                'unhelpful_count': feedback.unhelpful_count
            })
            
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"Vote feedback error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Server error'}, status=500)
