from django.urls import path
from .views import SignupView, user_profile, firebase_login, test_view

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('firebase-login/', firebase_login, name='firebase_login'),
    path('test/', test_view, name='test'),
    path('profile/', user_profile, name='user_profile'),
]
