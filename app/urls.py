from django.urls import path
from .views import SignupView, user_profile

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('profile/', user_profile, name='user_profile'),
]
