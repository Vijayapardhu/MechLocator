from django.urls import path
from . import views

app_name = 'mechanics'

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('mechanics/', views.mechanic_list, name='mechanic_list'),
    path('mechanic/<int:mechanic_id>/', views.mechanic_detail, name='mechanic_detail'),
    path('search/', views.search_mechanics, name='search_mechanics'),
    path('api/search/', views.search_mechanics, name='search_mechanics_api'),
    path('api/log-call/', views.log_call_api, name='log_call_api'),
    path('api/feedback/<int:feedback_id>/vote/', views.vote_feedback, name='vote_feedback'),
    path('profile/', views.user_profile, name='user_profile'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
]
