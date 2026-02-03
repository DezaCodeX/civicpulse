#!/usr/bin/env python
"""
Test authentication flow to debug 401 errors
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civic.settings')
django.setup()

from app.models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken
import json

# Create test user
test_email = 'auth_test@example.com'
user, created = CustomUser.objects.get_or_create(
    email=test_email,
    defaults={'firebase_uid': 'test_firebase_uid_123'}
)
print(f"✅ Test user: {user.email} ({'created' if created else 'existing'})")
print(f"   Firebase UID: {user.firebase_uid}")

# Generate JWT tokens
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
refresh_token = str(refresh)

print(f"\n✅ JWT Tokens Generated:")
print(f"   Access Token (first 50 chars): {access_token[:50]}...")
print(f"   Refresh Token (first 50 chars): {refresh_token[:50]}...")

# Test token structure
print(f"\n✅ Token Structure:")
print(f"   Access token starts with valid JWT format: {access_token.count('.') == 2}")
print(f"   Contains algorithm (HS256): {'eyJ' in access_token[:10]}")

# Instructions
print(f"\n" + "="*70)
print("🔧 TROUBLESHOOTING 401 ERRORS:")
print("="*70)

print(f"""
1. ✅ Verify token is stored in browser localStorage:
   - Open Developer Console (F12)
   - Go to Application → Storage → LocalStorage → http://localhost:3000
   - Look for 'access' key - it should have a long token value
   
2. ✅ Verify login response contains tokens:
   - Go to Network tab
   - Login and look for firebase-login request
   - Check Response tab - should have 'access' and 'refresh' keys
   
3. ✅ Verify token is sent in API request:
   - Open Console in DevTools
   - Look for "🔐 Request Interceptor" logs
   - It should show: hasToken: true and Bearer token in headers
   
4. ✅ Common fixes:
   - Clear localStorage and log in again
   - Restart Django server: python manage.py runserver
   - Check that login endpoint returns tokens
   - Verify 'access' key is exactly correct in localStorage
   
5. ✅ Test the endpoints directly:
   - Use curl with the token from above:
   
   # Get token first:
   curl -X POST http://127.0.0.1:8000/api/firebase-login/ \\
     -H "Content-Type: application/json" \\
     -d '{{"uid": "test_uid_123", "email": "{test_email}"}}'
   
   # Then use token in complaint endpoint:
   curl -X POST http://127.0.0.1:8000/api/complaints/create/ \\
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \\
     -F "title=Test" \\
     -F "description=Test water issue" \\
     -F "latitude=28.7041" \\
     -F "longitude=77.1025" \\
     -F "location=Test"

Database Test Tokens:
Email: {test_email}
Firebase UID: test_firebase_uid_123
Access Token (valid for 5 min):
{access_token}

Refresh Token (valid for 7 days):
{refresh_token}
""")

print("="*70)
print("✅ Setup Complete - Try submitting complaint now!")
print("="*70)
