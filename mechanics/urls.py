from django.urls import path
from . import views

app_name = 'mechanics'

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('mechanics/', views.mechanic_list, name='mechanic_list'),
    path('mechanic/<int:mechanic_id>/', views.mechanic_detail, name='mechanic_detail'),
    path('mechanic/<int:mechanic_id>/gallery/', views.mechanic_gallery, name='mechanic_gallery'),
    path('search/', views.search_mechanics, name='search_mechanics'),
    path('api/search/', views.search_mechanics, name='search_mechanics_api'),
    path('api/log-call/', views.log_call_api, name='log_call_api'),
    path('profile/', views.user_profile, name='user_profile'),
    path('customer/dashboard/', views.customer_dashboard, name='customer_dashboard'),
    path('customer/profile/edit/', views.edit_customer_profile, name='edit_customer_profile'),
    path('mechanic/<int:mechanic_id>/review/', views.submit_review, name='submit_review'),
    path('review/<int:review_id>/edit/', views.edit_review, name='edit_review'),
    path('review/<int:review_id>/delete/', views.delete_review, name='delete_review'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
]
